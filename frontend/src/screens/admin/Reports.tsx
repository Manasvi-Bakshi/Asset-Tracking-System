import { useEffect, useState } from "react";
import { Download, Calendar, TrendingUp, FileText, Upload } from "lucide-react";

interface Summary {
  totalEmployees: number;
  totalAssets: number;
  availableAssets: number;
  deployedAssets: number;
  maintenanceAssets: number;
}

export function Reports() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: file upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/summary`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSummary(data.data);
        }
      })
      .catch(err => console.error("Reports fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  // ✅ NEW: handle file select
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setMessage(null);
    }
  };

  // ✅ NEW: handle upload
  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/upload/excel`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        setMessage("✅ File uploaded successfully");
      } else {
        setMessage("❌ Upload failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading reports...</div>;
  }

  if (!summary) {
    return <div className="p-8 text-red-600">Failed to load report summary</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          ST Reports & Analytics
        </h2>
        <p className="text-gray-600">
          System-level operational summary
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <SummaryCard title="Employees" value={summary.totalEmployees} icon={Calendar} />
        <SummaryCard title="Assets" value={summary.totalAssets} icon={FileText} />
        <SummaryCard title="Available" value={summary.availableAssets} icon={TrendingUp} />
        <SummaryCard title="Deployed" value={summary.deployedAssets} icon={FileText} />
        <SummaryCard title="Maintenance" value={summary.maintenanceAssets} icon={FileText} />
      </div>

      {/* ✅ NEW: Excel Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Excel Data
        </h3>

        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              file:cursor-pointer cursor-pointer
              border border-gray-300 rounded-lg"
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {fileName && (
          <div className="mt-3 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
            Selected: <span className="font-medium">{fileName}</span>
          </div>
        )}

        {message && (
          <div className="mt-3 text-sm px-4 py-2 rounded-lg bg-gray-100">
            {message}
          </div>
        )}
      </div>

      {/* Existing Export Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Report Downloads
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Export functionality will be implemented after full feature completion.
        </p>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          <Download className="w-4 h-4" />
          Download Summary
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
  );
}