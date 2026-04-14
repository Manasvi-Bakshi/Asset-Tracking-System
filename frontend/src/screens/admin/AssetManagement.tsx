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

function mapBackendAsset(asset: BackendAsset): Asset {
  return {
    id: asset.asset_code,
    model: asset.model,
    serialNumber: asset.serial_number,
    assignedTo: "—",
    department: "—",
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
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedAssets(newSelected);
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

  const toggleAll = () => {
    const visibleIds = visibleAssets.map((a) => a.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedAssets.has(id));

    const next = new Set(selectedAssets);
    if (allSelected) visibleIds.forEach((id) => next.delete(id));
    else visibleIds.forEach((id) => next.add(id));

    setSelectedAssets(next);
  };

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
          <h2 className="text-2xl font-semibold text-gray-900">
            ST Asset Management
          </h2>
          <p className="text-sm text-gray-500">
            Comprehensive asset tracking and inventory system
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by asset ID, model, serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 h-10 border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm transition"
          />
        </div>

        {/* Buttons (Improved) */}
        <div className="flex justify-center lg:justify-start items-center gap-3">
          <button
            onClick={handleFilterClick}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition text-sm"
          >
            <Filter className="w-4 h-4" />
            {conditionFilter === "all" ? "All" : conditionFilter}
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
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
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Asset ID
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Laptop Model
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Serial Number
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Issue Date
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Warranty
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  Condition
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleAssets.map((asset, index) => (
                <tr
                  key={asset.id}
                  className={`border-b border-gray-100 hover:bg-blue-50/50 ${
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
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {asset.model}
                  </td>
                  <td className="px-4 py-4 text-sm font-mono text-gray-700">
                    {asset.serialNumber}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {asset.issueDate}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {asset.warranty}
                  </td>
                  <td className="px-4 py-4">
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

      <div className="text-sm text-gray-600">
        Showing {visibleAssets.length} assets
      </div>
    </div>
  );
}