import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { apiGet } from "@/api/http";

interface EmployeeAttendanceProps {
  employeeEuid: string;
  refreshKey?: number; // ✅ used for auto refresh
}

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  first_entry_time: string | null;
  last_exit_time: string | null;
  total_duration_minutes: number | null;
  status: string | null;
}

export function EmployeeAttendance({ employeeEuid, refreshKey }: EmployeeAttendanceProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        console.log("🔄 Fetching attendance...");

        const response = await apiGet<{ success: boolean; data: AttendanceRecord[] }>(
          `/employees/${employeeEuid}/attendance`
        );

        if (response.success) {
          setRecords(response.data);
        }
      } catch (error) {
        console.error("❌ Failed to fetch attendance", error);
      } finally {
        setLoading(false);
      }
    }

    if (employeeEuid) {
      setLoading(true); // ✅ ensures refresh shows loading properly
      fetchAttendance();
    }
  }, [employeeEuid, refreshKey]); // ✅ CRITICAL FIX

  if (loading) {
    return <div className="p-8">Loading attendance...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="p-8 text-gray-500">
        No attendance records found.
      </div>
    );
  }

  const latest = records[0];

  return (
    <div className="space-y-6">
      {/* Current / Latest Status */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-green-900">
                {latest.status || "Unknown"}
              </h2>
            </div>
            <p className="text-green-700">
              Latest attendance record
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(latest.attendance_date).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Time In</p>
            <p className="text-lg font-semibold text-gray-900">
              {latest.first_entry_time
                ? new Date(latest.first_entry_time).toLocaleTimeString()
                : "-"}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Time Out</p>
            <p className="text-lg font-semibold text-gray-900">
              {latest.last_exit_time
                ? new Date(latest.last_exit_time).toLocaleTimeString()
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attendance History
        </h3>

        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(record.attendance_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  {record.first_entry_time &&
                    `In: ${new Date(record.first_entry_time).toLocaleTimeString()}`}
                  {record.last_exit_time &&
                    ` • Out: ${new Date(record.last_exit_time).toLocaleTimeString()}`}
                </p>
              </div>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {record.status || "Unknown"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}