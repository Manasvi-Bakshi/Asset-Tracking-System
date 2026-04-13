import xlsx from "xlsx";
import { insertEmployeesBulk } from "./upload.repository.js";

export async function processExcelFile(file) {
  const workbook = xlsx.read(file.buffer, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(sheet);

  if (!data.length) {
    throw new Error("Empty file");
  }

  const validRows = [];
  const errors = [];

  data.forEach((row, index) => {
    const euid = String(row.euid || "").trim();
    const first_name = String(row.first_name || "").trim();
    const email = String(row.email || "").trim();

    if (!euid || !first_name || !email) {
      errors.push({
        row: index + 2, // +2 because Excel header + 0 index
        reason: "Missing required fields (euid, first_name, email)",
      });
    } else {
      validRows.push(row);
    }
  });

  const inserted = await insertEmployeesBulk(validRows);

  return {
    total: data.length,
    inserted: inserted.length,
    skipped: errors.length,
    errors,
  };
}