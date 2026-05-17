"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPatrolPDFProps {
  onClose: () => void;
  onShowAlert?: (config: {
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }) => void;
}

// Lấy số ngày trong tháng
function getDaysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

// Lấy thứ trong tuần (T2-CN)
function getDayLabel(date: Date): string {
  const day = date.getDay(); // 0=CN, 1=T2, ..., 6=T7
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return labels[day];
}

// Kiểm tra có phải cuối tuần không
function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6; // CN hoặc T7
}

export default function ExportPatrolPDF({ onClose, onShowAlert }: ExportPatrolPDFProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [goi, setGoi] = useState("");
  const [phuong, setPhuong] = useState("");
  const [exporting, setExporting] = useState(false);

  // Options cho dropdown
  const [goiOptions, setGoiOptions] = useState<string[]>([]);
  const [phuongOptions, setPhuongOptions] = useState<string[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  // Load filter options
  useState(() => {
    async function loadOptions() {
      const { data } = await supabase.from("trees").select("goi, phuong").not("goi", "is", null);
      if (data) {
        const gois = [...new Set(data.map(r => r.goi).filter(Boolean))].sort();
        const phuongs = [...new Set(data.map(r => r.phuong).filter(Boolean))].sort();
        setGoiOptions(gois);
        setPhuongOptions(phuongs);
      }
      setOptionsLoaded(true);
    }
    loadOptions();
  });

  async function handleExport() {
    if (!phuong) {
      onShowAlert?.({ type: "warning", title: "Thiếu thông tin", message: "Vui lòng chọn Phường/Xã để xuất báo cáo." });
      return;
    }

    setExporting(true);
    try {
      // 1. Lấy danh sách tuyến đường trong phường đã chọn (+ gói thầu nếu có)
      let query = supabase.from("trees").select("ten_duong, phuong, goi, khu_vuc").eq("phuong", phuong);
      if (goi) query = query.eq("goi", goi);

      const { data: treeData } = await query;
      if (!treeData || treeData.length === 0) {
        onShowAlert?.({ type: "warning", title: "Không có dữ liệu", message: "Không tìm thấy cây xanh nào trong phường đã chọn." });
        setExporting(false);
        return;
      }

      // Gom danh sách tuyến đường duy nhất
      const streets = [...new Set(treeData.map(r => r.ten_duong).filter(Boolean))].sort();

      // 2. Lấy patrol_logs trong tháng đã chọn
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const daysInMonth = getDaysInMonth(month, year);
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      // Lấy tất cả tree_id của phường
      let treeIdsQuery = supabase.from("trees").select("id, ten_duong").eq("phuong", phuong);
      if (goi) treeIdsQuery = treeIdsQuery.eq("goi", goi);
      const { data: treeIds } = await treeIdsQuery;

      const treeMap: Record<string, string> = {}; // tree_id -> ten_duong
      (treeIds || []).forEach(t => { if (t.ten_duong) treeMap[t.id] = t.ten_duong; });

      const allTreeIds = Object.keys(treeMap);
      
      // Lấy patrol_logs cho các cây này trong tháng
      const { data: patrols } = await supabase
        .from("patrol_logs")
        .select("tree_id, created_at")
        .in("tree_id", allTreeIds.slice(0, 500)) // Limit để tránh query quá lớn
        .gte("created_at", startDate + "T00:00:00")
        .lte("created_at", endDate + "T23:59:59");

      // 3. Xây dựng ma trận: tuyến đường × ngày
      const matrix: Record<string, Set<number>> = {};
      streets.forEach(s => { matrix[s] = new Set(); });

      (patrols || []).forEach(p => {
        const street = treeMap[p.tree_id];
        if (street && matrix[street]) {
          const day = new Date(p.created_at).getDate();
          matrix[street].add(day);
        }
      });

      // 4. Tạo PDF
      generatePDF(streets, matrix, month, year, daysInMonth, phuong, goi);

      onShowAlert?.({ type: "success", title: "Xuất PDF thành công", message: `Đã tạo báo cáo tuần tra tháng ${month}/${year} cho phường ${phuong}.` });
      onClose();
    } catch (err: any) {
      console.error("Lỗi xuất PDF:", err);
      onShowAlert?.({ type: "error", title: "Lỗi xuất file", message: err.message || "Không thể tạo PDF." });
    } finally {
      setExporting(false);
    }
  }

  function generatePDF(
    streets: string[],
    matrix: Record<string, Set<number>>,
    month: number,
    year: number,
    daysInMonth: number,
    phuong: string,
    goi: string,
  ) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });

    // Header hành chính
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("ỦY BAN NHÂN DÂN TP.HỒ CHÍ MINH", 20, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CÔNG TY TNHH MTV CÔNG VIÊN CÂY XANH", 20, 17);

    doc.setFontSize(9);
    doc.text("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 320, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Độc lập - Tự do - Hạnh phúc", 330, 17);

    // Tiêu đề chính
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const title = `BẢNG DIỄN GIẢI KHỐI LƯỢNG TUẦN TRA CÂY XANH THÁNG ${month}/${year}${goi ? ` - GÓI THẦU KHU VỰC ${goi}` : ""}`;
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 25, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Cây xanh địa bàn phường ${phuong} - Thành phố Hồ Chí Minh`,
      doc.internal.pageSize.getWidth() / 2, 30,
      { align: "center" }
    );

    // Xây dựng header bảng
    const dayHeaders: string[] = [];
    const daySubHeaders: string[] = [];
    const weekendCols: number[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      dayHeaders.push(String(d).padStart(2, "0") + "/" + String(month).padStart(2, "0"));
      daySubHeaders.push(getDayLabel(date));
      if (isWeekend(date)) {
        weekendCols.push(d - 1 + 4); // offset: STT(0), Tuyến(1), Phường(2), KL(3)
      }
    }

    // Headers
    const headers = [
      ["STT", "Tuyến đường/CVMX", "Phường/Xã", "KL QL\n(1000 cây)",
        ...dayHeaders,
        "Số lần\ntuần tra", "KL\nthực hiện"
      ],
    ];

    // Data rows
    const body = streets.map((street, idx) => {
      const patrolDays = matrix[street] || new Set();
      const dayCells = [];
      for (let d = 1; d <= daysInMonth; d++) {
        dayCells.push(patrolDays.has(d) ? "☑" : "");
      }
      return [
        String(idx + 1),
        street,
        phuong,
        "-",
        ...dayCells,
        String(patrolDays.size),
        "-"
      ];
    });

    // Tạo bảng
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 34,
      theme: "grid",
      styles: {
        fontSize: 5.5,
        cellPadding: 1,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        halign: "center",
        valign: "middle",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 5,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },   // STT
        1: { cellWidth: 35, halign: "left" },     // Tuyến đường
        2: { cellWidth: 20, halign: "center" },   // Phường
        3: { cellWidth: 12, halign: "center" },   // KL QL
        // Cột ngày: auto
        [4 + daysInMonth]: { cellWidth: 10, halign: "center" },     // Số lần
        [4 + daysInMonth + 1]: { cellWidth: 12, halign: "center" }, // KL thực hiện
      },
      didParseCell: function(data: any) {
        // Tô màu cột cuối tuần
        if (data.section === "body" || data.section === "head") {
          const colIdx = data.column.index;
          if (weekendCols.includes(colIdx)) {
            data.cell.styles.fillColor = [255, 243, 224]; // Màu cam nhạt
          }
        }
        // Checkbox ☑ màu xanh đậm
        if (data.section === "body" && data.cell.raw === "☑") {
          data.cell.styles.textColor = [0, 100, 0];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 7;
        }
      },
      margin: { left: 8, right: 8, top: 34 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      const footerY = doc.internal.pageSize.getHeight() - 5;
      const timestamp = new Date().toLocaleString("vi-VN");
      doc.text(`${timestamp} - Trang ${i}/${pageCount}`, doc.internal.pageSize.getWidth() / 2, footerY, { align: "center" });
    }

    // Tải xuống
    const filename = `TuanTra_T${month}_${year}_${phuong.replace(/\s+/g, "_")}${goi ? `_KV${goi}` : ""}.pdf`;
    doc.save(filename);
  }

  return (
    <div style={{ overflowY: "auto", maxHeight: "85vh" }}>
      {/* Header */}
      <div className="modal-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <i className="material-icons" style={{ fontSize: 24, color: "#dc2626" }}>picture_as_pdf</i>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>Xuất Bảng Tuần Tra Cây Xanh</h2>
            <p style={{ fontSize: 12, color: "#999" }}>Theo mẫu chuẩn UBND TP.HCM — Công ty TNHH MTV CVCX</p>
          </div>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div className="modal-body">
        {/* Bộ lọc */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Tháng</label>
            <select className="form-input" value={month} onChange={e => setMonth(+e.target.value)}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Năm</label>
            <select className="form-input" value={year} onChange={e => setYear(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Phường / Xã <span style={{ color: "#dc2626" }}>*</span></label>
            <select className="form-input" value={phuong} onChange={e => setPhuong(e.target.value)}>
              <option value="">— Chọn phường —</option>
              {phuongOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Gói thầu (Khu vực)</label>
            <select className="form-input" value={goi} onChange={e => setGoi(e.target.value)}>
              <option value="">— Tất cả —</option>
              {goiOptions.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview info */}
        <div style={{ 
          marginTop: 20, padding: 16, background: "#f0f9ff", borderRadius: 8, 
          border: "1px solid #bae6fd", display: "flex", alignItems: "flex-start", gap: 12 
        }}>
          <i className="material-icons" style={{ fontSize: 20, color: "#0284c7", marginTop: 2 }}>info</i>
          <div style={{ fontSize: 13, color: "#0c4a6e", lineHeight: 1.6 }}>
            <strong>Mẫu xuất:</strong> Bảng diễn giải khối lượng tuần tra cây xanh<br/>
            <strong>Định dạng:</strong> PDF khổ A3 ngang, theo chuẩn UBND TP.HCM<br/>
            <strong>Nội dung:</strong> Lưới {getDaysInMonth(month, year)} ngày × N tuyến đường, checkbox ☑ đánh dấu ngày tuần tra<br/>
            <strong>Dữ liệu:</strong> Tự động trích xuất từ nhật ký tuần tra (patrol_logs) trong hệ thống
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>Hủy</button>
        <button 
          className="btn-primary" 
          onClick={handleExport} 
          disabled={exporting || !phuong}
          style={{ 
            background: "#dc2626", 
            display: "flex", alignItems: "center", gap: 8,
            opacity: !phuong ? 0.5 : 1,
          }}
        >
          <i className="material-icons" style={{ fontSize: 18 }}>picture_as_pdf</i>
          {exporting ? "Đang xuất..." : "Xuất PDF"}
        </button>
      </div>
    </div>
  );
}
