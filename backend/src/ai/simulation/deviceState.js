import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const datasetPath = path.join(
  __dirname,
  "..",
  "data",
  "dataset.json"
);

const dataset = JSON.parse(
  fs.readFileSync(datasetPath, "utf-8")
);

const deviceState = new Map();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomDelta(amount) {
  return (Math.random() * amount * 2) - amount;
}

export function getOrCreateState(assetId) {
  if (deviceState.has(assetId)) {
    return deviceState.get(assetId);
  }

  const sample =
    dataset[Math.floor(Math.random() * dataset.length)];

  const initialState = {
    Brand: sample.Brand,
    OS: sample.OS,

    DeviceAgeYears: sample.DeviceAgeYears,

    CPU_Temperature_C: sample.CPU_Temperature_C,
    GPU_Temperature_C: sample.GPU_Temperature_C,

    CPU_Load_Pct: sample.CPU_Load_Pct,
    Memory_Used_Pct: sample.Memory_Used_Pct,

    Disk_Read_MBps: sample.Disk_Read_MBps,
    Disk_Write_MBps: sample.Disk_Write_MBps,

    Battery_Health_Pct: sample.Battery_Health_Pct,
    System_Voltage_V: sample.System_Voltage_V,

    Fan_Speed_RPM: sample.Fan_Speed_RPM,
    System_Uptime_Hrs: sample.System_Uptime_Hrs,

    Disk_Health_Pct: sample.Disk_Health_Pct,
    Network_Usage_MBps: sample.Network_Usage_MBps,
  };

  deviceState.set(assetId, initialState);

  return initialState;
}

export function evolveState(state) {
  state.CPU_Load_Pct = clamp(
    state.CPU_Load_Pct + randomDelta(5),
    1,
    100
  );

  state.Memory_Used_Pct = clamp(
    state.Memory_Used_Pct + randomDelta(4),
    1,
    100
  );

  state.CPU_Temperature_C = clamp(
    state.CPU_Temperature_C +
      (state.CPU_Load_Pct / 100) * 3 +
      randomDelta(2),
    30,
    100
  );

  state.GPU_Temperature_C = clamp(
    state.GPU_Temperature_C +
      (state.CPU_Load_Pct / 100) * 2 +
      randomDelta(2),
    30,
    100
  );

  state.Fan_Speed_RPM = clamp(
    state.Fan_Speed_RPM +
      (state.CPU_Temperature_C - 50) * 8 +
      randomDelta(100),
    1000,
    6000
  );

  state.Battery_Health_Pct = clamp(
    state.Battery_Health_Pct - Math.random() * 0.05,
    5,
    100
  );

  state.System_Voltage_V = clamp(
    state.System_Voltage_V + randomDelta(0.15),
    7,
    13
  );

  state.System_Uptime_Hrs += Math.random() * 0.3;

  state.Network_Usage_MBps = clamp(
    state.Network_Usage_MBps + randomDelta(5),
    0,
    100
  );

  state.Disk_Read_MBps = clamp(
    state.Disk_Read_MBps + randomDelta(10),
    0,
    250
  );

  state.Disk_Write_MBps = clamp(
    state.Disk_Write_MBps + randomDelta(10),
    0,
    250
  );

  state.Disk_Health_Pct = clamp(
    state.Disk_Health_Pct - Math.random() * 0.02,
    1,
    100
  );

  return {
    Brand: state.Brand,
    OS: state.OS,

    DeviceAgeYears: state.DeviceAgeYears,

    CPU_Temperature_C: Number(state.CPU_Temperature_C.toFixed(2)),
    GPU_Temperature_C: Number(state.GPU_Temperature_C.toFixed(2)),

    CPU_Load_Pct: Number(state.CPU_Load_Pct.toFixed(2)),
    Memory_Used_Pct: Number(state.Memory_Used_Pct.toFixed(2)),

    Disk_Read_MBps: Number(state.Disk_Read_MBps.toFixed(2)),
    Disk_Write_MBps: Number(state.Disk_Write_MBps.toFixed(2)),

    Battery_Health_Pct: Number(state.Battery_Health_Pct.toFixed(2)),
    System_Voltage_V: Number(state.System_Voltage_V.toFixed(2)),

    Fan_Speed_RPM: Number(state.Fan_Speed_RPM.toFixed(2)),
    System_Uptime_Hrs: Number(state.System_Uptime_Hrs.toFixed(2)),

    Disk_Health_Pct: Number(state.Disk_Health_Pct.toFixed(2)),
    Network_Usage_MBps: Number(state.Network_Usage_MBps.toFixed(2)),
  };
}