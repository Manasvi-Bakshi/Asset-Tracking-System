const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

export interface PresencePayload {
  asset_id: string;
  location_id: string;
  event_type: "ENTER" | "EXIT";
  source: string;

  // ✅ NEW: GPS structure (matches backend)
  gps?: {
    latitude: number;
    longitude: number;
  };

  // ✅ NEW: WLAN support
  network?: {
    ssid: string;
  };
}

export async function postPresence(payload: PresencePayload) {
  const response = await fetch(`${API_BASE_URL}/presence`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}