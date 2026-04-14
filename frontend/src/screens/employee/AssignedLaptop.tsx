import { useEffect, useState } from "react";
import { Laptop, Calendar, Shield, Wrench, FileText, CheckCircle } from "lucide-react";
import { apiGet } from "@/api/http";

interface AssignedLaptopProps {
  employeeEuid: string;
}

interface Asset {
  id: string;
  asset_code: string;
  company: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  warranty_expiry_date: string;
  status: string;
}

export function AssignedLaptop({ employeeEuid }: AssignedLaptopProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignedLaptop() {
      try {
        const response = await apiGet<{ success: boolean; data: Asset[] }>(
          `/employees/${employeeEuid}/assets`
        );

        if (response.success && response.data.length > 0) {
          setAsset(response.data[0]); // assuming single active assignment
        }
      } catch (error) {
        console.error("Failed to fetch assigned laptop", error);
      } finally {
        setLoading(false);
      }
    }

    if (employeeEuid) {
      fetchAssignedLaptop();
    }
  }, [employeeEuid]);

  if (loading) {
    return <div className="p-8">Loading assigned laptop...</div>;
  }

  if (!asset) {
    return <div className="p-8">No laptop assigned.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Main Laptop Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-600 p-4 rounded-xl">
              <Laptop className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-900">
                {asset.company} {asset.model}
              </h2>
              <p className="text-purple-700">Your Assigned Laptop</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{asset.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Asset Code</p>
            <p className="text-xl font-bold text-gray-900">{asset.asset_code}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Serial Number</p>
            <p className="text-lg font-mono font-semibold text-gray-900">
              {asset.serial_number}
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Assignment Details
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-gray-600">Purchase Date</span>
            <span className="font-semibold text-gray-900">
              {new Date(asset.purchase_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status</span>
            <span className="font-semibold text-gray-900">
              {asset.status}
            </span>
          </div>
        </div>
      </div>

      {/* Warranty Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Warranty Information
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Expires On</span>
            <span className="font-semibold text-gray-900">
              {new Date(asset.warranty_expiry_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Device Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Device Summary
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-gray-600">Model</span>
            <span className="font-semibold text-gray-900">{asset.model}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-gray-600">Company</span>
            <span className="font-semibold text-gray-900">{asset.company}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Asset Code</span>
            <span className="font-semibold text-gray-900">{asset.asset_code}</span>
          </div>
        </div>
      </div>

      {/* Basic Device Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wrench className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Basic Device Info
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-gray-600">Serial Number</span>
            <span className="font-semibold text-gray-900 font-mono">
              {asset.serial_number}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Current Status</span>
            <span className="font-semibold text-gray-900">{asset.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
