import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';

import {
  Laptop,
  Activity,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Cpu
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState
} from "react";

import { apiGet } from "@/api/http";

interface FleetDevice {

  id: string;

  asset_code: string;

  company: string;

  model: string;

  employee_name: string | null;

  euid: string | null;

  battery: number | null;

  cpu_label: string | null;

  status: string | null;

  predicted_label: string | null;

  last_updated: string | null;
}

export function AdminDeviceHealth() {

  const [devices, setDevices] =
    useState<FleetDevice[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  useEffect(() => {

    let intervalId: number;

    async function fetchFleetHealth() {

      try {

        const data =
          await apiGet<FleetDevice[]>(
            "/api/ai/devices"
          );

        setDevices(data);

      } catch (err) {

        console.error(
          "Fleet device health fetch failed:",
          err
        );

      } finally {

        setLoading(false);
      }
    }

    fetchFleetHealth();

    intervalId = window.setInterval(
      fetchFleetHealth,
      5000
    );

    return () => clearInterval(intervalId);

  }, []);

  const filteredDevices =
    useMemo(() => {

      return devices.filter((device) => {

        const term =
          search.toLowerCase();

        return (

          device.asset_code
            ?.toLowerCase()
            .includes(term)

          ||

          device.employee_name
            ?.toLowerCase()
            .includes(term)

          ||

          device.company
            ?.toLowerCase()
            .includes(term)

          ||

          device.model
            ?.toLowerCase()
            .includes(term)
        );
      });

    }, [devices, search]);

  if (loading) {

    return (
      <div className="p-8 text-gray-500">
        Loading fleet device health...
      </div>
    );
  }

  const total =
    filteredDevices.length;

  const healthy =
    filteredDevices.filter(
      d => d.status === "HEALTHY"
    ).length;

  const warning =
    filteredDevices.filter(
      d => d.status === "WARNING"
    ).length;

  const critical =
    filteredDevices.filter(
      d => d.status === "CRITICAL"
    ).length;

  return (

    <div className="p-8 space-y-6">

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          title="Total Devices"
          value={total.toString()}
          icon={Laptop}
          color="blue"
        />

        <StatCard
          title="Healthy Devices"
          value={healthy.toString()}
          icon={Activity}
          color="green"
        />

        <StatCard
          title="Warning Devices"
          value={warning.toString()}
          icon={AlertTriangle}
          color="yellow"
        />

        <StatCard
          title="Devices Requiring Attention"
          value={critical.toString()}
          icon={XCircle}
          color="red"
        />

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        <div className="p-6 border-b border-gray-200 flex items-center justify-between">

          <div>

            <h3 className="text-lg font-semibold text-gray-900">
              Device Health Monitoring
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Real-time device health insights across enterprise assets
            </p>

          </div>

          <div className="flex gap-3">

            <div className="relative">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                aria-label="Search devices"
                placeholder="Search devices..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
              />

            </div>

            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition"
              aria-label="Filter devices"
            >

              <Filter className="w-4 h-4" />

              Filter

            </button>

          </div>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50 border-b border-gray-200">

              <tr>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Device
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Battery
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  CPU
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  AI Insight
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Update
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">

              {filteredDevices.map((device) => (

                <tr
                  key={device.id}
                  className="hover:bg-gray-50 transition"
                >

                  {/* DEVICE */}

                  <td className="px-6 py-4">

                    <div>

                      <p className="text-sm font-semibold text-gray-900">
                        {device.company} {device.model}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {device.asset_code}
                      </p>

                    </div>
                  </td>

                  {/* EMPLOYEE */}

                  <td className="px-6 py-4">

                    <div>

                      <p className="text-sm font-medium text-gray-900">
                        {device.employee_name ?? "Unassigned"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {device.euid ?? "-"}
                      </p>

                    </div>
                  </td>

                  {/* BATTERY */}

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">

                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${
                            (device.battery ?? 0) >= 70
                              ? "bg-green-500"
                              : (device.battery ?? 0) >= 40
                              ? "bg-yellow-500"
                              : "bg-orange-500"
                          }`}
                          style={{
                            width: `${device.battery ?? 0}%`
                          }}
                        />

                      </div>

                      <span className="text-sm font-medium">
                        {device.battery ?? 0}%
                      </span>

                    </div>
                  </td>

                  {/* CPU */}

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-2">

                      <Cpu className="w-4 h-4 text-gray-500" />

                      <span className="text-sm text-gray-700">
                        {device.cpu_label ?? "Monitoring"}
                      </span>

                    </div>
                  </td>

                  {/* AI */}

                  <td className="px-6 py-4">

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">

                      {
                        device.predicted_label
                          ?.replaceAll("_", " ")
                          ?? "Monitoring"
                      }

                    </span>
                  </td>

                  {/* LAST UPDATE */}

                  <td className="px-6 py-4 text-sm text-gray-500">

                    {
                      device.last_updated
                        ? new Date(
                            device.last_updated
                          ).toLocaleTimeString()

                        : "-"
                    }

                  </td>

                  {/* STATUS */}

                  <td className="px-6 py-4">

                    <StatusBadge
                      status={
                        device.status === "HEALTHY"
                          ? "success"

                          : "warning"
                      }

                      label={
                        device.status ?? "MONITORING"
                      }
                    />

                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}