import express from "express";
import { getSimulatedDevice } from "./ai.controller.js";

const router = express.Router();

router.get("/device", getSimulatedDevice);

export default router;