import { useEffect, useState } from "react";
import { StatCard } from "@/components/common/StatCard";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Laptop,
  Activity,
  AlertTriangle,
} from "lucide-react";

import { fetchEmployees } from "@/api/employees";
import { fetchAssets } from "@/api/assets";

export function DashboardOverview() {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ NEW STATE (office location)
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchEmployees(), fetchAssets()])
      .then(([employees, assets]) => {
        setEmployeeCount(employees.length);
        setAssetCount(assets.length);
      })
      .catch((err) => {
        console.error("Dashboard fetch failed:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // ✅ NEW FUNCTION (set office location)
  async function handleSetOfficeLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation not supported");
      return;
    }

    setLocationLoading(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/locations/office`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            }
          );

          const data = await res.json();

          if (data.success) {
            setLocationMessage("✅ Office location updated successfully");
          } else {
            setLocationMessage("❌ Failed to update location");
          }
        } catch (err) {
          console.error(err);
          setLocationMessage("❌ Error updating location");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setLocationLoading(false);
        setLocationMessage("❌ Location permission denied");
      }
    );
  }

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-6">

      {/* ✅ NEW SECTION: Office Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Office Configuration
        </h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Set your current office location for attendance validation.
        </p>

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
          <button
            onClick={handleSetOfficeLocation}
            disabled={locationLoading}
            className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {locationLoading ? "Setting Location..." : "Set Office Location"}
          </button>

          {locationMessage && (
            <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-2">
              {locationMessage}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={employeeCount.toString()}
            icon={Users}
            color="blue"
            subtitle="Active workforce"
          />
          <StatCard
            title="Present Today"
            value={employeeCount.toString()}
            icon={CheckCircle}
            color="green"
            subtitle="Temporary logic"
          />
          <StatCard
            title="Absent"
            value="0"
            icon={XCircle}
            color="red"
            subtitle="Temporary logic"
          />
          <StatCard
            title="Late Entries"
            value="0"
            icon={Clock}
            color="yellow"
            subtitle="Temporary logic"
          />
        </div>
      </div>

      {/* Device Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Device Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Devices"
            value={assetCount.toString()}
            icon={Laptop}
            color="blue"
            subtitle="Registered assets"
          />
          <StatCard
            title="Available"
            value="—"
            icon={Activity}
            color="green"
            subtitle="Status breakdown later"
          />
          <StatCard
            title="Maintenance"
            value="—"
            icon={AlertTriangle}
            color="yellow"
            subtitle="Status breakdown later"
          />
          <StatCard
            title="Deployed"
            value="—"
            icon={XCircle}
            color="red"
            subtitle="Status breakdown later"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="text-sm text-gray-500">
          Activity tracking will be implemented after full feature wiring.
        </div>
      </div>
    </div>
  );
}