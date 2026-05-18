import { apiGet } from "./http";

export interface DeviceTelemetry {
  Brand: string;
  OS: string;

  DeviceAgeYears: number;

  CPU_Temperature_C: number;
  GPU_Temperature_C: number;

  CPU_Load_Pct: number;
  Memory_Used_Pct: number;

  Disk_Read_MBps: number;
  Disk_Write_MBps: number;

  Battery_Health_Pct: number;
  System_Voltage_V: number;

  Fan_Speed_RPM: number;
  System_Uptime_Hrs: number;

  Disk_Health_Pct: number;
  Network_Usage_MBps: number;
}

export interface DeviceHealthResponse {
  id: string;

  battery: number;

  cpuLabel: string;

  status: "HEALTHY" | "WARNING" | "CRITICAL";

  predictedLabel: string;

  telemetry: DeviceTelemetry;

  lastCheckIn: string;
}

export async function getEmployeeDeviceHealth(
  euid: string
): Promise<DeviceHealthResponse> {
  return apiGet<DeviceHealthResponse>(
    `/api/ai/employee/${euid}`
  );
}