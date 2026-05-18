import {
  Battery,
  Cpu,
  HardDrive,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

import { useEffect, useState } from 'react';

import {
  getEmployeeDeviceHealth,
  DeviceHealthResponse
} from '../../api/ai';

import { apiGet } from '../../api/http';

interface EmployeeDeviceHealthProps {
  employeeEuid: string;
}

export function EmployeeDeviceHealth({
  employeeEuid
}: EmployeeDeviceHealthProps) {

  const [deviceHealth, setDeviceHealth] =
    useState<DeviceHealthResponse | null>(null);

  const [asset, setAsset] = useState<any>(null);

  useEffect(() => {

    let intervalId: number;

    async function fetchAssignedLaptop() {
      try {

        const response = await apiGet<{
          success: boolean;
          data: any[];
        }>(
          `/employees/${employeeEuid}/assets`
        );

        if (
          response.success &&
          response.data.length > 0
        ) {
          setAsset(response.data[0]);
        }

      } catch (error) {
        console.error(
          "Failed to fetch assigned laptop",
          error
        );
      }
    }

    async function fetchHealth() {

      try {

        const data =
          await getEmployeeDeviceHealth(employeeEuid);

        setDeviceHealth(data);

      } catch (err) {
        console.error(
          "Device health fetch failed",
          err
        );
      }
    }

    if (employeeEuid) {

      fetchAssignedLaptop();

      fetchHealth();

      intervalId = window.setInterval(
        fetchHealth,
        3000
      );
    }

    return () => clearInterval(intervalId);

  }, [employeeEuid]);

  const telemetry = deviceHealth?.telemetry;

  /*
    PREVENT STATIC → DYNAMIC FLICKER
  */

  if (!deviceHealth || !telemetry) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-gray-500">
        Loading device health...
      </div>
    );
  }

  const battery =
    Math.round(
      telemetry.Battery_Health_Pct
    );

  const cpu =
    Math.round(
      telemetry.CPU_Load_Pct
    );

  const storage =
    Math.round(
      telemetry.Disk_Health_Pct
    );

  const overallHealth =
    Math.round(
      (
        battery +
        storage +
        (100 - cpu)
      ) / 3
    );

  const deviceMetrics = [
    {
      label: 'Battery Health',
      value: battery,
      icon: Battery,
      status: battery < 50 ? 'warning' : 'good',
      color: battery < 50 ? 'yellow' : 'green'
    },

    {
      label: 'CPU Performance',
      value: cpu,
      icon: Cpu,
      status: cpu > 80 ? 'warning' : 'good',
      color: cpu > 80 ? 'yellow' : 'green'
    },

    {
      label: 'Storage Available',
      value: storage,
      icon: HardDrive,
      status: storage < 70 ? 'warning' : 'good',
      color: storage < 70 ? 'yellow' : 'green'
    },

    {
      label: 'Overall Health',
      value: overallHealth,
      icon: Activity,
      status: overallHealth < 70 ? 'warning' : 'good',
      color: overallHealth < 70 ? 'yellow' : 'green'
    },
  ];

  return (
    <div className="space-y-6">

      {/* DEVICE STATUS */}

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-8">

        <div className="flex items-start justify-between mb-6">

          <div>

            <h2 className="text-2xl font-bold text-blue-900 mb-2">

              {
                asset
                  ? `${asset.company} ${asset.model}`
                  : "Assigned Device"
              }

            </h2>

            <p className="text-blue-700">
              AI monitoring indicates your device is operating normally
            </p>

          </div>

          <div className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg ${
            deviceHealth.status === "CRITICAL"
              ? "bg-red-600"
              : deviceHealth.status === "WARNING"
              ? "bg-yellow-600"
              : "bg-green-600"
          }`}>

            <CheckCircle className="w-5 h-5" />

            <span className="font-medium">
              {deviceHealth.status}
            </span>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {deviceMetrics.map((metric, index) => {

            const Icon = metric.icon;

            return (

              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm transition-all duration-500"
              >

                <div className="flex items-center gap-2 mb-3">

                  <Icon className={`w-5 h-5 ${
                    metric.color === "green"
                      ? "text-green-600"
                      : metric.color === "yellow"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`} />

                  <p className="text-sm text-gray-600">
                    {metric.label}
                  </p>

                </div>

                <div className="mb-2">

                  <div className="flex items-end gap-2">

                    <p className="text-2xl font-bold text-gray-900 transition-all duration-500">
                      {metric.value}%
                    </p>

                    {metric.status === 'warning' && (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mb-1" />
                    )}

                  </div>

                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">

                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      metric.value >= 80
                        ? 'bg-green-500'
                        : metric.value >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${metric.value}%` }}
                  />

                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BATTERY */}

        <div className="bg-white rounded-xl border border-gray-200 p-6">

          <div className="flex items-center gap-3 mb-4">

            <Battery className="w-6 h-6 text-green-600" />

            <h3 className="text-lg font-semibold text-gray-900">
              Battery Health
            </h3>

          </div>

          <div className="space-y-3">

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Charge</span>
              <span className="font-semibold text-gray-900">
                {battery}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cycle Count</span>
              <span className="font-semibold text-gray-900">
                142
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Design Capacity</span>
              <span className="font-semibold text-gray-900">
                86.4 Wh
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">System Uptime</span>
              <span className="font-semibold text-gray-900">
                {telemetry.System_Uptime_Hrs.toFixed(1)} hrs
              </span>
            </div>

          </div>
        </div>

        {/* STORAGE */}

        <div className="bg-white rounded-xl border border-gray-200 p-6">

          <div className="flex items-center gap-3 mb-4">

            <HardDrive className="w-6 h-6 text-blue-600" />

            <h3 className="text-lg font-semibold text-gray-900">
              Storage
            </h3>

          </div>

          <div className="space-y-3">

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Disk Health</span>
              <span className="font-semibold text-gray-900">
                {storage}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Read Speed</span>
              <span className="font-semibold text-gray-900">
                {telemetry.Disk_Read_MBps.toFixed(0)} MB/s
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Write Speed</span>
              <span className="font-semibold text-gray-900">
                {telemetry.Disk_Write_MBps.toFixed(0)} MB/s
              </span>
            </div>

            <div className="mt-3">

              <div className="w-full bg-gray-200 rounded-full h-3">

                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${storage}%` }}
                />

              </div>

            </div>

          </div>
        </div>
      </div>

      {/* SYSTEM INFO */}

      <div className="bg-white rounded-xl border border-gray-200 p-6">

        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Processor</span>
            <span className="font-medium text-gray-900">
              Intel Core i7-12700H
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">RAM Usage</span>
            <span className="font-medium text-gray-900">
              {telemetry.Memory_Used_Pct.toFixed(0)}%
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Operating System</span>
            <span className="font-medium text-gray-900">
              {telemetry.OS}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">CPU Temperature</span>
            <span className="font-medium text-gray-900">
              {telemetry.CPU_Temperature_C.toFixed(1)}°C
            </span>
          </div>

        </div>
      </div>

      {/* RECOMMENDATION */}

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">

        <div className="flex items-start gap-3">

          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />

          <div>

            <h3 className="font-semibold text-yellow-900 mb-2">
              Recommendation
            </h3>

            <p className="text-sm text-yellow-800">

              {
                deviceHealth.predictedLabel === "Memory_Leak"
                  ? "Elevated memory instability detected. Consider restarting resource-intensive applications."

                  : deviceHealth.predictedLabel === "Overheating"
                  ? "Thermal activity is increasing. Ensure proper ventilation and reduce sustained heavy workloads."

                  : deviceHealth.predictedLabel === "Disk_Failure"
                  ? "Storage reliability degradation detected. Backup important files and contact IT support."

                  : deviceHealth.predictedLabel === "Power_Issue"
                  ? "Power delivery irregularities detected. Consider checking charging hardware and battery health."

                  : "Your device is operating within healthy parameters. No immediate action is required."
              }

            </p>

          </div>
        </div>
      </div>
    </div>
  );
}