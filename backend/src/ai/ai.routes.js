import express from "express";
import { getEmployeeDeviceHealth } from "./ai.controller.js";

const router = express.Router();

router.get("/employee/:euid", getEmployeeDeviceHealth);

export default router;