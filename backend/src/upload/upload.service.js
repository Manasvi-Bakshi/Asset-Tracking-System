import { insertEmployeesBulk, insertAssetsBulk } from "./upload.repository.js";
import xlsx from "xlsx";

export async function processExcelFile(file) {
  const workbook = xlsx.read(file.buffer, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(sheet);

  if (!data.length) {
    throw new Error("Empty file");
  }

  // 🔥 Detect type based on columns
  const isAssetFile = "asset_code" in data[0];

  const validRows = [];
  const errors = [];

  data.forEach((row, index) => {
    if (isAssetFile) {
      const asset_code = String(row.asset_code || "").trim();

      if (!asset_code) {
        errors.push({
          row: index + 2,
          reason: "Missing asset_code",
        });
      } else {
        validRows.push(row);
      }
    } else {
      const euid = String(row.euid || "").trim();
      const first_name = String(row.first_name || "").trim();
      const email = String(row.email || "").trim();

      if (!euid || !first_name || !email) {
        errors.push({
          row: index + 2,
          reason: "Missing required fields (euid, first_name, email)",
        });
      } else {
        validRows.push(row);
      }
    }
  });

  let inserted = [];
  let duplicates = [];

  if (isAssetFile) {
    const result = await insertAssetsBulk(validRows);
    inserted = result.inserted;
    duplicates = result.duplicates;
  } else {
    const result = await insertEmployeesBulk(validRows);
    inserted = result.inserted;
    duplicates = result.duplicates;
  }

  return {
    total: data.length,
    inserted: inserted.length,
    duplicates: duplicates.length,
    skipped: errors.length,
    errors,
  };
}