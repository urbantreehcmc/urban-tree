const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const path = require('path');

async function readFiles() {
  try {
    // 1. PDF
    console.log("=== PDF: Bản sao của 383-ttht- trình tự xử lý.pdf ===");
    try {
      const pdfPath = "d:\\UrbanTree\\Bản sao của 383-ttht- trình tự xử lý.pdf";
      if (fs.existsSync(pdfPath)) {
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdf(dataBuffer).catch(e => console.error(e));
        if (pdfData && pdfData.text) console.log(pdfData.text.substring(0, 1500) + "\n...\n");
      } else {
        console.log("PDF not found.");
      }
    } catch(e) { console.error(e); }

    // 2. DOCX
    console.log("=== DOCX: Bản sao của Các biểu mẫu xử lý cây xanh.docx ===");
    try {
      const docxPath = "d:\\UrbanTree\\Bản sao của Các biểu mẫu xử lý cây xanh.docx";
      if (fs.existsSync(docxPath)) {
        const result = await mammoth.extractRawText({path: docxPath});
        console.log(result.value.substring(0, 1500) + "\n...\n");
      } else {
        console.log("DOCX not found.");
      }
    } catch(e) { console.error(e); }

    // 3. XLSX
    console.log("=== XLSX: Bản sao của Mau Phieu bao cao ket qua kiem tra.xlsx ===");
    try {
      const xlsxPath = "d:\\UrbanTree\\Bản sao của Mau Phieu bao cao ket qua kiem tra.xlsx";
      if (fs.existsSync(xlsxPath)) {
        const workbook = xlsx.readFile(xlsxPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        console.log(JSON.stringify(json).substring(0, 1500) + "\n...\n");
      } else {
        console.log("XLSX not found.");
      }
    } catch(e) { console.error(e); }

  } catch (err) {
    console.error("Error reading files:", err);
  }
}

readFiles();
