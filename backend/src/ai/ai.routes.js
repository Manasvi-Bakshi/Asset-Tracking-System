import express from "express";

import {
  getEmployeeDeviceHealth,
  getAllDevicesHealth
} from "./ai.controller.js";

const router = express.Router();

/*
  EMPLOYEE DEVICE HEALTH
*/

router.get(
  "/employee/:euid",
  getEmployeeDeviceHealth
);

/*
  ADMIN FLEET DEVICE HEALTH
*/

router.get(
  "/devices",
  getAllDevicesHealth
);

export default router;