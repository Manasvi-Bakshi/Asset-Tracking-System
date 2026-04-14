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
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState<
    "all" | Asset["condition"]
  >("all");
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
    const visibleIds = visibleAssets.map((a) => a.id);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedAssets.has(id));

    if (allVisibleSelected) {
      const next = new Set(selectedAssets);
      visibleIds.forEach((id) => next.delete(id));
      setSelectedAssets(next);
    } else {
      const next = new Set(selectedAssets);
      visibleIds.forEach((id) => next.add(id));
      setSelectedAssets(next);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleAssets = assets.filter((asset) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      asset.id.toLowerCase().includes(normalizedSearch) ||
      asset.model.toLowerCase().includes(normalizedSearch) ||
      asset.serialNumber.toLowerCase().includes(normalizedSearch);
    const matchesFilter =
      conditionFilter === "all" || asset.condition === conditionFilter;
    return matchesSearch && matchesFilter;
  });

  const allVisibleSelected =
    visibleAssets.length > 0 &&
    visibleAssets.every((asset) => selectedAssets.has(asset.id));

  const handleFilterClick = () => {
    const order: Array<"all" | Asset["condition"]> = [
      "all",
      "excellent",
      "good",
      "fair",
      "poor",
    ];
    const nextIndex = (order.indexOf(conditionFilter) + 1) % order.length;
    setConditionFilter(order[nextIndex]);
  };

  const handleExportCsv = () => {
    const headers = [
      "Asset ID",
      "Laptop Model",
      "Serial Number",
      "Issue Date",
      "Warranty",
      "Condition",
    ];
    const rows = visibleAssets.map((asset) => [
      asset.id,
      asset.model,
      asset.serialNumber,
      asset.issueDate,
      asset.warranty,
      asset.condition,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assets-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 leading-tight">
            ST Asset Management
          </h2>
          <p className="text-sm text-gray-500">
            Comprehensive asset tracking and inventory system
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by asset ID, model, serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-12 border border-gray-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFilterClick}
              className="inline-flex items-center gap-2 px-4 h-12 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition"
            >
              <Filter className="w-4 h-4" />
              Filter: {conditionFilter === "all" ? "All" : conditionFilter}
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 h-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50/50 border-b border-gray-300">
                <th className="px-4 py-3.5 border-r border-gray-200">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-700 bg-gray-100">
                  Asset ID
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-700 bg-gray-100">
                  Laptop Model
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-700 bg-gray-100">
                  Serial Number
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-700 bg-gray-100">
                  Issue Date
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-700 bg-gray-100">
                  Warranty
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide text-gray-700 bg-gray-100">
                  Condition
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleAssets.map((asset, index) => (
                <tr
                  key={asset.id}
                  className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.id)}
                      onChange={() => toggleAsset(asset.id)}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {asset.id}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{asset.model}</td>
                  <td className="px-4 py-4 text-sm font-mono text-gray-700">
                    {asset.serialNumber}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{asset.issueDate}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{asset.warranty}</td>
                  <td className="px-4 py-4">
                    <div className="inline-flex rounded-full">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {visibleAssets.length} assets
      </div>
    </div>
  );
}
