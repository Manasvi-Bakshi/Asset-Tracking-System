import pool from "../shared/db/pg.client.js";
import {
  insertPresenceEvent,
  getOfficeLocation,
  getActiveAssignment,
  getAttendanceForDate,
  createAttendance,
  updateAttendanceExit,
  updateAttendanceEntry,
  getEventDateIST,
  upsertOfficeLocation
} from "./presence.repository.js";

// --- CONFIG ---
const DEFAULT_RADIUS_METERS = 100;

// --- UTILS ---
function toRadians(deg) {
  return deg * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;

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

    console.log("🚀 Presence event:", data);

    const event = await insertPresenceEvent(client, data);

    const officeLocation = await getOfficeLocation(client, event.location_id);
    console.log("📍 Office:", officeLocation);

    if (!officeLocation) {
      await client.query("COMMIT");
      return { message: "Not an office location." };
    }

    const validation = validateLocation(data, officeLocation);
    console.log("📡 Validation:", validation);

    if (!validation.allowed) {
      await client.query("COMMIT");
      return { message: "Rejected: outside geofence/WiFi." };
    }

    const assignment = await getActiveAssignment(client, event.asset_id);
    console.log("👤 Assignment:", assignment);

    if (!assignment) {
      await client.query("COMMIT");
      return { message: "No active assignment." };
    }

    const employee_id = assignment.employee_id;

    const eventDate = await getEventDateIST(client, event.event_time);
    console.log("📅 Date:", eventDate);

    const existingAttendance =
      await getAttendanceForDate(client, employee_id, eventDate);

    console.log("📊 Existing:", existingAttendance);

    if (event.event_type === "ENTER") {
      if (!existingAttendance) {
        console.log("🔥 Creating attendance");
        await createAttendance(client, employee_id, eventDate, event.event_time);
      } else {
        console.log("🔁 Updating entry");
        await updateAttendanceEntry(client, existingAttendance.id, event.event_time);
      }
    }

    if (event.event_type === "EXIT") {
      if (existingAttendance) {
        console.log("🚪 Updating exit");
        await updateAttendanceExit(client, existingAttendance.id, event.event_time);
      }
    }

    await client.query("COMMIT");

    return { message: "Presence processed successfully." };

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ ERROR:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function setOfficeLocation(data) {
  const { latitude, longitude } = data;

  if (!latitude || !longitude) {
    throw new Error("Invalid coordinates");
  }

  const location = await upsertOfficeLocation({ latitude, longitude });

  return {
    message: "Office location updated",
    data: location,
  };
}