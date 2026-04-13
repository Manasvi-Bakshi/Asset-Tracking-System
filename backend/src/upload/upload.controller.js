import { processExcelFile } from "./upload.service.js";

export async function uploadExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await processExcelFile(req.file);

    res.json({
      success: true,
      message: "Excel processed",
      data: result,
    });
  } catch (error) {
    console.error("❌ Excel processing error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Excel processing failed",
    });
  }
}