import { useEffect, useState } from "react";
import { fetchEmployees } from "@/api/employees";
import type { Employee as BackendEmployee } from "@/types/employee";

import { StatCard } from '@/components/common/StatCard';
import { Users, CheckCircle, XCircle, Clock, Search, Download } from 'lucide-react';

/*const attendanceData = [
  { id: 'EMP001', name: 'John Doe', date: '2026-01-16', timeIn: '09:12 AM', status: 'present' },
  { id: 'EMP002', name: 'Sarah Smith', date: '2026-01-16', timeIn: '08:55 AM', status: 'present' },
  { id: 'EMP003', name: 'Mike Johnson', date: '2026-01-16', timeIn: '09:32 AM', status: 'late' },
  { id: 'EMP004', name: 'Lisa Brown', date: '2026-01-16', timeIn: '09:05 AM', status: 'present' },
  { id: 'EMP005', name: 'Tom Wilson', date: '2026-01-16', timeIn: '-', status: 'absent' },
  { id: 'EMP006', name: 'Emma Davis', date: '2026-01-16', timeIn: '08:48 AM', status: 'present' },
  { id: 'EMP007', name: 'James Taylor', date: '2026-01-16', timeIn: '09:15 AM', status: 'present' },
  { id: 'EMP008', name: 'Sophia Martinez', date: '2026-01-16', timeIn: '-', status: 'absent' },
  { id: 'EMP009', name: 'Oliver Anderson', date: '2026-01-16', timeIn: '09:38 AM', status: 'late' },
  { id: 'EMP010', name: 'Ava Garcia', date: '2026-01-16', timeIn: '08:52 AM', status: 'present' },
];*/

interface UIAttendanceRecord {
  id: string;
  name: string;
  date: string;
  status: "present" | "late" | "absent";
}

/* ---------------------------
   Temporary Attendance Generator
   (Until real attendance API exists)
---------------------------- */

function generateTodayAttendance(emp: BackendEmployee): UIAttendanceRecord {
  const today = new Date().toISOString().split("T")[0];

  const mod = emp.id % 5;

  let status: "present" | "late" | "absent";

  if (!emp.is_active) {
    status = "absent";
  } else if (mod === 0) {
    status = "absent";
  } else if (mod === 1) {
    status = "late";
  } else {
    status = "present";
  }

  return {
    id: emp.euid,
    name: `${emp.first_name} ${emp.last_name}`,
    date: today,
    status,
  };
}

/* ---------------------------
   Component
---------------------------- */

export function AdminAttendance() {
  const [records, setRecords] = useState<UIAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees()
      .then((employees) => {
        const todayRecords = employees.map(generateTodayAttendance);
        setRecords(todayRecords);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load employees");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8">Loading attendance...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  const total = records.length;
  const present = records.filter(r => r.status === "present").length;
  const absent = records.filter(r => r.status === "absent").length;
  const late = records.filter(r => r.status === "late").length;

  const handleExport = () => {
    const headers = ["Employee ID", "Name", "Date"];
    const rows = records.map((record) => [record.id, record.name, record.date]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={total.toString()} icon={Users} color="blue" />
        <StatCard title="Present Today" value={present.toString()} icon={CheckCircle} color="green" />
        <StatCard title="Absent" value={absent.toString()} icon={XCircle} color="red" />
        <StatCard title="Late Entries" value={late.toString()} icon={Clock} color="yellow" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Attendance Records - Today
          </h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {record.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.date}
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