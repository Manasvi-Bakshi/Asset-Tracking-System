import pool from "../shared/db/pg.client.js";
import {
  insertPresenceEvent,
  getOfficeLocation,
  getActiveAssignment,
  getAttendanceForDate,
  createAttendance,
  updateAttendanceExit,
  updateAttendanceEntry,
  getEventDateIST
} from "./presence.repository.js";

// --- CONFIG ---
const DEFAULT_RADIUS_METERS = 100;

// --- UTILS ---
function toRadians(deg) {
  return deg * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function validateLocation(input, location) {
  let gpsValid = false;
  let wlanValid = false;

  // --- GPS VALIDATION ---
  if (
    input?.gps?.latitude &&
    input?.gps?.longitude &&
    location.latitude &&
    location.longitude
  ) {
    const distance = calculateDistance(
      input.gps.latitude,
      input.gps.longitude,
      Number(location.latitude),
      Number(location.longitude)
    );

    gpsValid = distance <= DEFAULT_RADIUS_METERS;
  }

  // --- WLAN VALIDATION ---
  if (input?.network?.ssid && location.last_known_network) {
    wlanValid = input.network.ssid === location.last_known_network;
  }

  return {
    gpsValid,
    wlanValid,
    allowed: gpsValid || wlanValid
  };
}

export async function processPresenceEvent(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const event = await insertPresenceEvent(data);

    const officeLocation = await getOfficeLocation(event.location_id);
    if (!officeLocation) {
      await client.query("COMMIT");
      return { message: "Not an office location. Attendance not processed." };
    }

    // 🆕 LOCATION VALIDATION
    const validation = validateLocation(data, officeLocation);

    if (!validation.allowed) {
      await client.query("COMMIT");
      return {
        message: "Presence rejected: outside geofence or invalid network."
      };
    }

    const assignment = await getActiveAssignment(event.asset_id);
    if (!assignment) {
      await client.query("COMMIT");
      return { message: "No active assignment found. Attendance not processed." };
    }

    const employee_id = assignment.employee_id;
    const eventDate = await getEventDateIST(event.event_time);

    const existingAttendance =
      await getAttendanceForDate(employee_id, eventDate);

    if (event.event_type === "ENTER") {
      if (!existingAttendance) {
        await createAttendance(employee_id, eventDate, event.event_time);
      } else {
        await updateAttendanceEntry(
          existingAttendance.id,
          event.event_time
        );
      }
    }

    if (event.event_type === "EXIT") {
      if (existingAttendance) {
        await updateAttendanceExit(
          existingAttendance.id,
          event.event_time
        );
      }
    }

    await client.query("COMMIT");
    return { message: "Presence processed successfully." };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}