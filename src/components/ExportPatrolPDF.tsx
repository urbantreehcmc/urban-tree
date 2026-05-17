"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

interface ExportPatrolPDFProps {
  onClose: () => void;
  onShowAlert?: (config: {
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }) => void;
}

export default function ExportPatrolPDF({ onClose, onShowAlert }: ExportPatrolPDFProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [day, setDay] = useState(now.getDate());
  const [exportType, setExportType] = useState<"daily" | "monthly">("daily");
  const [goi, setGoi] = useState("");
  const [phuong, setPhuong] = useState("");
  const [exporting, setExporting] = useState(false);

  const [goiOptions, setGoiOptions] = useState<string[]>([]);
  const [phuongOptions, setPhuongOptions] = useState<string[]>([]);

  useEffect(() => {
    async function loadOptions() {
      const { data } = await supabase.from("trees").select("goi, phuong").not("phuong", "is", null);
      if (data) {
        const gois = [...new Set(data.map(r => r.goi).filter(Boolean))].sort();
        const phuongs = [...new Set(data.map(r => r.phuong).filter(Boolean))].sort();
        setGoiOptions(gois);
        setPhuongOptions(phuongs);
      }
    }
    loadOptions();
  }, []);

  function getDaysInMonth(m: number, y: number) { return new Date(y, m, 0).getDate(); }
  function getDayLabel(date: Date): string {
    return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()];
  }
  function isWeekend(date: Date): boolean {
    const d = date.getDay(); return d === 0 || d === 6;
  }

  async function handleExport() {
    if (!phuong) {
      onShowAlert?.({ type: "warning", title: "Thiếu thông tin", message: "Vui lòng chọn Phường/Xã." });
      return;
    }
    setExporting(true);
    try {
      if (exportType === "daily") {
        await exportDaily();
      } else {
        await exportMonthly();
      }
      onShowAlert?.({ type: "success", title: "Xuất Excel thành công", message: `File Excel đã được tải xuống.` });
      onClose();
    } catch (err: any) {
      console.error("Lỗi xuất Excel:", err);
      onShowAlert?.({ type: "error", title: "Lỗi xuất file", message: err.message || "Không thể tạo Excel." });
    } finally {
      setExporting(false);
    }
  }

  // ===== XUẤT BÁO CÁO NGÀY =====
  async function exportDaily() {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Lấy tree_ids trong phường (+ gói nếu có)
    let treeQ = supabase.from("trees").select("id, ten_duong, phuong, loai_cay, hieu_so_cay, phan_loai, lat, lng, khu_vuc").eq("phuong", phuong);
    if (goi) treeQ = treeQ.eq("goi", goi);
    const { data: trees } = await treeQ;
    if (!trees || trees.length === 0) throw new Error("Không có cây xanh trong phường đã chọn.");

    const treeMap: Record<string, any> = {};
    trees.forEach(t => { treeMap[t.id] = t; });

    // Lấy patrol_logs trong ngày
    const { data: patrols } = await supabase
      .from("patrol_logs")
      .select("*")
      .in("tree_id", Object.keys(treeMap).slice(0, 500))
      .gte("created_at", dateStr + "T00:00:00")
      .lte("created_at", dateStr + "T23:59:59")
      .order("created_at", { ascending: true });

    // Header rows
    const headerRows = [
      ["ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", "", "", "", "", "", "", "", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"],
      ["CÔNG TY TNHH MTV CÔNG VIÊN CÂY XANH", "", "", "", "", "", "", "", "", "", "", "Độc lập - Tự do - Hạnh phúc"],
      [],
      [`BÁO CÁO TUẦN TRA CÂY XANH NGÀY ${day}/${month}/${year}${goi ? ` - GÓI THẦU KHU VỰC ${goi}` : ""}`],
      [`Cây xanh địa bàn phường ${phuong} - Thành phố Hồ Chí Minh`],
      [],
      // Table headers
      [
        "STT", "Thời gian", "Vị trí tọa độ", "Địa chỉ",
        "Tuyến đường/CV/MX", "Phường/Xã", "Loài cây", "Nhà số",
        "Phân loại", "Tình trạng, sự việc phát hiện",
        "Hình ảnh ghi nhận", "Đã xử lý",
        "Nội dung đã xử lý", "Nội dung sẽ xử lý tiếp theo"
      ]
    ];

    // Data rows
    const dataRows = (patrols || []).map((p: any, idx: number) => {
      const tree = treeMap[p.tree_id] || {};
      const time = new Date(p.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const coords = p.lat && p.lng ? `${p.lat}, ${p.lng}` : (tree.lat && tree.lng ? `${tree.lat}, ${tree.lng}` : "—");
      const conditions = (p.tinh_trang || []).join(", ");
      const images = (p.hinh_anh || []).join("\n");
      
      return [
        idx + 1,
        time,
        coords,
        tree.khu_vuc || "Toàn tuyến",
        tree.ten_duong || "—",
        tree.phuong || phuong,
        tree.loai_cay || "—",
        tree.hieu_so_cay || "—",
        tree.phan_loai || "—",
        conditions || "Chưa phát hiện sự việc phát sinh hoặc thay đổi hiện trạng của cây xanh",
        images || "",
        "",
        "",
        p.mo_ta || "Tiếp tục theo dõi"
      ];
    });

    if (dataRows.length === 0) {
      // Nếu không có patrol log, tạo 1 dòng trống
      dataRows.push([1, "—", "—", "—", "—", phuong, "—", "—", "—", "Không có dữ liệu tuần tra trong ngày này", "", "", "", ""]);
    }

    const allRows = [...headerRows, ...dataRows];

    // Tạo workbook
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Merge cells cho header
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },  // UBND
      { s: { r: 0, c: 11 }, e: { r: 0, c: 13 } }, // CHXHCN
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },   // Cty
      { s: { r: 1, c: 11 }, e: { r: 1, c: 13 } },  // Độc lập
      { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } },  // Title
      { s: { r: 4, c: 0 }, e: { r: 4, c: 13 } },  // Subtitle
    ];

    // Đặt chiều rộng cột
    ws["!cols"] = [
      { wch: 5 },   // STT
      { wch: 10 },  // Thời gian
      { wch: 20 },  // Tọa độ
      { wch: 12 },  // Địa chỉ
      { wch: 22 },  // Tuyến đường
      { wch: 12 },  // Phường
      { wch: 18 },  // Loài cây
      { wch: 8 },   // Nhà số
      { wch: 8 },   // Phân loại
      { wch: 35 },  // Tình trạng
      { wch: 20 },  // Hình ảnh ghi nhận
      { wch: 15 },  // Đã xử lý
      { wch: 18 },  // Nội dung đã xử lý
      { wch: 20 },  // Nội dung tiếp theo
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Ngày ${day}-${month}-${year}`);
    XLSX.writeFile(wb, `TuanTra_${day}_${month}_${year}_${phuong.replace(/\s+/g, "_")}${goi ? `_KV${goi}` : ""}.xlsx`);
  }

  // ===== XUẤT BÁO CÁO THÁNG (Tổng hợp lưới checkbox) =====
  async function exportMonthly() {
    const daysInMonth = getDaysInMonth(month, year);

    // Lấy danh sách tuyến đường
    let treeQ = supabase.from("trees").select("id, ten_duong, phuong").eq("phuong", phuong);
    if (goi) treeQ = treeQ.eq("goi", goi);
    const { data: treeData } = await treeQ;
    if (!treeData || treeData.length === 0) throw new Error("Không có cây xanh trong phường đã chọn.");

    const streets = [...new Set(treeData.map(r => r.ten_duong).filter(Boolean))].sort();
    const treeMap: Record<string, string> = {};
    treeData.forEach(t => { if (t.ten_duong) treeMap[t.id] = t.ten_duong; });

    // Lấy patrol_logs trong tháng
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { data: patrols } = await supabase
      .from("patrol_logs")
      .select("tree_id, created_at")
      .in("tree_id", Object.keys(treeMap).slice(0, 500))
      .gte("created_at", startDate + "T00:00:00")
      .lte("created_at", endDate + "T23:59:59");

    // Ma trận: tuyến đường × ngày
    const matrix: Record<string, Set<number>> = {};
    streets.forEach(s => { matrix[s] = new Set(); });
    (patrols || []).forEach(p => {
      const street = treeMap[p.tree_id];
      if (street && matrix[street]) {
        matrix[street].add(new Date(p.created_at).getDate());
      }
    });

    // Header
    const dayHeaders = [];
    const daySubHeaders = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      dayHeaders.push(`${String(d).padStart(2, "0")}/${String(month).padStart(2, "0")}`);
      daySubHeaders.push(getDayLabel(date));
    }

    const headerRows = [
      ["ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", "", "", "", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"],
      ["CÔNG TY TNHH MTV CÔNG VIÊN CÂY XANH", "", "", "", "", "", "", "Độc lập - Tự do - Hạnh phúc"],
      [],
      [`BẢNG DIỄN GIẢI KHỐI LƯỢNG TUẦN TRA CÂY XANH THÁNG ${month}/${year}${goi ? ` - GÓI THẦU KHU VỰC ${goi}` : ""}`],
      [`Cây xanh địa bàn phường ${phuong} - Thành phố Hồ Chí Minh`],
      [],
      ["STT", "Tuyến đường/CVMX", "Phường/Xã", "KL QL (1000 cây)", ...dayHeaders, "Số lần tuần tra", "KL thực hiện"],
      ["", "", "", "", ...daySubHeaders, "", ""],
    ];

    // Data rows
    const dataRows = streets.map((street, idx) => {
      const patrolDays = matrix[street] || new Set();
      const dayCells = [];
      for (let d = 1; d <= daysInMonth; d++) {
        dayCells.push(patrolDays.has(d) ? "☑" : "");
      }
      return [idx + 1, street, phuong, "-", ...dayCells, patrolDays.size, "-"];
    });

    const allRows = [...headerRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Column widths
    const colWidths = [
      { wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
      ...Array(daysInMonth).fill({ wch: 5 }),
      { wch: 10 }, { wch: 10 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Tháng ${month}-${year}`);
    XLSX.writeFile(wb, `TuanTra_Thang${month}_${year}_${phuong.replace(/\s+/g, "_")}${goi ? `_KV${goi}` : ""}.xlsx`);
  }

  return (
    <div style={{ overflowY: "auto", maxHeight: "85vh" }}>
      {/* Header */}
      <div className="modal-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <i className="material-icons" style={{ fontSize: 24, color: "#16a34a" }}>table_chart</i>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>Xuất Báo Cáo Tuần Tra</h2>
            <p style={{ fontSize: 12, color: "#999" }}>Xuất Excel theo mẫu chuẩn UBND TP.HCM</p>
          </div>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div className="modal-body">
        {/* Loại báo cáo */}
        <div className="form-group">
          <label style={{ fontWeight: 600 }}>Loại báo cáo</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {([
              { id: "daily" as const, label: "Báo cáo Ngày", icon: "today", desc: "Chi tiết từng lần tuần tra" },
              { id: "monthly" as const, label: "Tổng hợp Tháng", icon: "date_range", desc: "Lưới checkbox 31 ngày" },
            ]).map(opt => (
              <button key={opt.id} onClick={() => setExportType(opt.id)} style={{
                flex: 1, padding: "14px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                fontSize: 13, fontWeight: 600, transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                border: exportType === opt.id ? "2px solid #2563eb" : "2px solid #e0e0e0",
                background: exportType === opt.id ? "#dbeafe" : "white",
                color: exportType === opt.id ? "#1d4ed8" : "#666",
              }}>
                <i className="material-icons" style={{ fontSize: 24 }}>{opt.icon}</i>
                {opt.label}
                <span style={{ fontSize: 11, fontWeight: 400, color: "#999" }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bộ lọc */}
        <div style={{ display: "grid", gridTemplateColumns: exportType === "daily" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Tháng</label>
            <select className="form-input" value={month} onChange={e => setMonth(+e.target.value)}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
          {exportType === "daily" && (
            <div className="form-group">
              <label style={{ fontWeight: 600 }}>Ngày</label>
              <select className="form-input" value={day} onChange={e => setDay(+e.target.value)}>
                {Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Ngày {d}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Năm</label>
            <select className="form-input" value={year} onChange={e => setYear(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

        {/* Preview */}
        <div style={{ 
          marginTop: 16, padding: 16, background: "#f0fdf4", borderRadius: 8, 
          border: "1px solid #bbf7d0", display: "flex", alignItems: "flex-start", gap: 12 
        }}>
          <i className="material-icons" style={{ fontSize: 20, color: "#16a34a", marginTop: 2 }}>info</i>
          <div style={{ fontSize: 13, color: "#14532d", lineHeight: 1.6 }}>
            <strong>Định dạng:</strong> Excel (.xlsx) — mở được trên Google Sheets, LibreOffice, Excel<br/>
            <strong>Mẫu:</strong> {exportType === "daily" 
              ? `Báo cáo tuần tra ngày ${day}/${month}/${year} — chi tiết tọa độ, loài cây, tình trạng` 
              : `Tổng hợp tháng ${month}/${year} — lưới ${getDaysInMonth(month, year)} ngày × N tuyến đường`
            }<br/>
            <strong>Dữ liệu:</strong> Tự động từ patrol_logs trong hệ thống
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
            background: "#16a34a", 
            display: "flex", alignItems: "center", gap: 8,
            opacity: !phuong ? 0.5 : 1,
          }}
        >
          <i className="material-icons" style={{ fontSize: 18 }}>file_download</i>
          {exporting ? "Đang xuất..." : "Xuất Excel (.xlsx)"}
        </button>
      </div>
    </div>
  );
}
