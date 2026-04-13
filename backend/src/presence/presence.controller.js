import { processPresenceEvent } from "./presence.service.js";
import { setOfficeLocation } from "./presence.service.js";

export async function postPresenceEvent(req, res) {
  try {
    const result = await processPresenceEvent(req.body);

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Presence processing failed" });
  }
}


export async function postOfficeLocation(req, res) {
  try {
    const result = await setOfficeLocation(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to set location" });
  }
}