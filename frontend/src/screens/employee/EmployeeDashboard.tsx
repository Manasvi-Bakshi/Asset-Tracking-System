import { useState, useEffect, useRef } from "react";
import { EmployeeAttendance } from './EmployeeAttendance';
import { EmployeeDeviceHealth } from './EmployeeDeviceHealth';
import { AssignedLaptop } from './AssignedLaptop';
import { LogOut, Clock, Laptop, Activity } from 'lucide-react';
import { postPresence } from "@/api/presence";
import stLogo from 'figma:asset/8a2a604d8afe75e33045de09e7f0260bf54a57ec.png';

interface EmployeeDashboardProps {
  userName: string;
  employeeEuid: string;
  onLogout: () => void;
}

export type EmployeePage = 'attendance' | 'device-health' | 'laptop';

export function EmployeeDashboard({ userName, employeeEuid, onLogout }: EmployeeDashboardProps) {
  const [activePage, setActivePage] = useState<EmployeePage>('attendance');
  const hasMarkedPresence = useRef(false);


  const renderContent = () => {
    switch (activePage) {
      case 'attendance':
        return <EmployeeAttendance employeeEuid={employeeEuid} />;
      case 'device-health':
        return <EmployeeDeviceHealth />;
      case 'laptop':
        return <AssignedLaptop employeeEuid={employeeEuid} />;
      default:
        return <EmployeeAttendance employeeEuid={employeeEuid} />;
    }
  };

useEffect(() => {
  if (hasMarkedPresence.current) return;

  async function markPresenceOnce() {
    console.log("🚀 Starting presence flow");

    try {
      console.log("📡 Fetching assigned asset...");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/employees/${employeeEuid}/assets`
      );

      const json = await res.json();
      console.log("📦 Asset response:", json);

      const assignedAsset = json?.data?.[0];

      if (!assignedAsset) {
        console.warn("❌ No assigned asset found — stopping");
        return;
      }

      const assetId = assignedAsset.id;
      const locationId = assignedAsset.location_id;

      console.log("🧩 Asset + Location:", assetId, locationId);

      if (!navigator.geolocation) {
        console.warn("❌ Geolocation not supported");
        return;
      }

      console.log("📍 Requesting GPS...");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log("📍 GPS received:", position.coords);

          try {
            const response = await postPresence({
              asset_id: assetId,
              location_id: locationId,
              event_type: "ENTER",
              source: "WEB",
              gps: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              network: {
                ssid: "ST_OFFICE_WIFI",
              },
            });

            console.log("✅ Presence API response:", response);

            hasMarkedPresence.current = true;
          } catch (err) {
            console.error("❌ Presence API failed", err);
          }
        },
        (error) => {
          console.error("❌ GPS error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    } catch (err) {
      console.error("❌ Fetch failed:", err);
    }
  }

  markPresenceOnce();
}, [employeeEuid]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <img src={stLogo} alt="ST Logo" className="h-10 w-auto" />
                <h1 className="text-xl font-bold text-gray-900">ST Employee Portal</h1>
              </div>
              
              <nav className="flex gap-2">
                <button
                  onClick={() => setActivePage('attendance')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    activePage === 'attendance'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Attendance
                </button>
                
                <button
                  onClick={() => setActivePage('device-health')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    activePage === 'device-health'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Device Health
                </button>
                
                <button
                  onClick={() => setActivePage('laptop')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    activePage === 'laptop'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                  My Laptop
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{userName}</div>
                <div className="text-xs text-gray-500">Employee</div>
              </div>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </div>
    </div>
  );
}
