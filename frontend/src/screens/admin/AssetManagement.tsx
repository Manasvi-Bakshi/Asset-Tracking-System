import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Search, Download, Filter } from "lucide-react";
import { fetchAssets } from "@/api/assets";
import type { Asset as BackendAsset } from "@/types/asset";

interface Asset {
  id: string;
  model: string;
  serialNumber: string;
  assignedTo: string;
  department: string;
  issueDate: string;
  warranty: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

/*const initialAssets: Asset[] = [
  { id: 'ASSET001', model: 'Dell XPS 15', serialNumber: 'DXP15-9520-A1B2C3', assignedTo: 'John Doe', department: 'Engineering', issueDate: '2024-03-15', warranty: 'Active (2 years)', condition: 'excellent' },
  { id: 'ASSET002', model: 'MacBook Pro 14"', serialNumber: 'MBP14-M2-D4E5F6', assignedTo: 'Sarah Smith', department: 'Design', issueDate: '2024-05-20', warranty: 'Active (3 years)', condition: 'excellent' },
  { id: 'ASSET003', model: 'Lenovo ThinkPad X1', serialNumber: 'TPX1-G9-G7H8I9', assignedTo: 'Mike Johnson', department: 'Sales', issueDate: '2023-11-10', warranty: 'Active (1 year)', condition: 'good' },
  { id: 'ASSET004', model: 'HP EliteBook 840', serialNumber: 'HPE840-G8-J1K2L3', assignedTo: 'Lisa Brown', department: 'HR', issueDate: '2023-08-05', warranty: 'Expired', condition: 'fair' },
  { id: 'ASSET005', model: 'Dell Latitude 7420', serialNumber: 'DL7420-M4N5O6', assignedTo: 'Tom Wilson', department: 'Marketing', issueDate: '2024-01-12', warranty: 'Active (2 years)', condition: 'excellent' },
  { id: 'ASSET006', model: 'MacBook Air M2', serialNumber: 'MBA-M2-P7Q8R9', assignedTo: 'Emma Davis', department: 'Design', issueDate: '2024-06-18', warranty: 'Active (3 years)', condition: 'excellent' },
  { id: 'ASSET007', model: 'ASUS ZenBook 14', serialNumber: 'AZB14-S1T2U3', assignedTo: 'James Taylor', department: 'Engineering', issueDate: '2023-04-22', warranty: 'Expired', condition: 'poor' },
  { id: 'ASSET008', model: 'Microsoft Surface Pro 9', serialNumber: 'MSP9-V4W5X6', assignedTo: 'Sophia Martinez', department: 'Finance', issueDate: '2024-02-28', warranty: 'Active (2 years)', condition: 'good' },
  { id: 'ASSET009', model: 'Dell XPS 13', serialNumber: 'DXP13-9315-Y7Z8A9', assignedTo: 'Oliver Anderson', department: 'Engineering', issueDate: '2024-07-10', warranty: 'Active (2 years)', condition: 'excellent' },
  { id: 'ASSET010', model: 'HP Spectre x360', serialNumber: 'HPSX360-B1C2D3', assignedTo: 'Ava Garcia', department: 'Marketing', issueDate: '2023-12-05', warranty: 'Active (1 year)', condition: 'good' },
];*/

function mapBackendAsset(asset: BackendAsset): Asset {
  return {
    id: asset.asset_code,
    model: asset.model,
    serialNumber: asset.serial_number,
    assignedTo: "—", // Assignment logic later
    department: "—", // Assignment logic later
    issueDate: new Date(asset.purchase_date).toLocaleDateString(),
    warranty: asset.warranty_expiry_date
      ? `Expires ${new Date(asset.warranty_expiry_date).toLocaleDateString()}`
      : "Unknown",
    condition:
      asset.status === "AVAILABLE"
        ? "excellent"
        : asset.status === "DEPLOYED"
        ? "good"
        : asset.status === "MAINTENANCE"
        ? "fair"
        : "poor",
  };
}

export function AssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------
     Fetch Real Assets
  ---------------------------- */

  useEffect(() => {
    fetchAssets()
      .then((backendAssets) => {
        const mapped = backendAssets.map(mapBackendAsset);
        setAssets(mapped);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load assets");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading assets...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const toggleAsset = (id: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAssets(newSelected);
  };

  const toggleAll = () => {
    if (selectedAssets.size === assets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(assets.map(a => a.id)));
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            ST Asset Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive asset tracking and inventory system
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by asset ID, model, serial number..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-300">
                <th className="px-4 py-3 border-r border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedAssets.size === assets.length}
                    onChange={toggleAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold bg-gray-100">
                  Asset ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold bg-gray-100">
                  Laptop Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold bg-gray-100">
                  Serial Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold bg-gray-100">
                  Issue Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold bg-gray-100">
                  Warranty
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold bg-gray-100">
                  Condition
                </th>
              </tr>
            </thead>

            <tbody>
              {assets.map((asset, index) => (
                <tr
                  key={asset.id}
                  className={`border-b ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.id)}
                      onChange={() => toggleAsset(asset.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {asset.id}
                  </td>
                  <td className="px-4 py-3 text-sm">{asset.model}</td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {asset.serialNumber}
                  </td>
                  <td className="px-4 py-3 text-sm">{asset.issueDate}</td>
                  <td className="px-4 py-3 text-sm">{asset.warranty}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={
                        asset.condition === "excellent" ||
                        asset.condition === "good"
                          ? "success"
                          : asset.condition === "fair"
                          ? "warning"
                          : "danger"
                      }
                      label={asset.condition.toUpperCase()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {assets.length} assets
      </div>
    </div>
  );
}
