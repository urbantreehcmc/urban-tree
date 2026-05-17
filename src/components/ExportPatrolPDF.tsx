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
        setGoiOptions([...new Set(data.map(r => r.goi).filter(Boolean))].sort());
        setPhuongOptions([...new Set(data.map(r => r.phuong).filter(Boolean))].sort());
      }
    }
    loadOptions();
  }, []);

  function getDaysInMonth(m: number, y: number) { return new Date(y, m, 0).getDate(); }
  function getDayLabel(date: Date): string { return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()]; }

  async function handleExport() {
    setExporting(true);
    try {
      if (exportType === "daily") {
        await exportDaily();
      } else {
        await exportMonthly();
      }
      onShowAlert?.({ type: "success", title: "Xuất Excel thành công", message: "File đã tải xuống. Mở bằng Google Sheets để xem hình ảnh trong ô." });
      onClose();
    } catch (err: any) {
      console.error("Lỗi xuất:", err);
      onShowAlert?.({ type: "error", title: "Lỗi xuất file", message: err.message || "Không thể tạo file." });
    } finally {
      setExporting(false);
    }
  }

  // ===== XUẤT BÁO CÁO NGÀY =====
  async function exportDaily() {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Lấy patrol_logs trong ngày (KHÔNG lọc phường bắt buộc)
    let patrolQuery = supabase
      .from("patrol_logs")
      .select("*, trees!inner(loai_cay, hieu_so_cay, ten_duong, phuong, quan, lat, lng, phan_loai, khu_vuc)")
      .gte("created_at", dateStr + "T00:00:00")
      .lte("created_at", dateStr + "T23:59:59")
      .order("created_at", { ascending: true });

    const { data: patrols, error: patrolError } = await patrolQuery;
    if (patrolError) throw patrolError;

    // Lọc thêm nếu có chọn phường/gói
    let filtered = patrols || [];
    if (phuong) filtered = filtered.filter((p: any) => p.trees?.phuong === phuong);
    if (goi) filtered = filtered.filter((p: any) => p.trees?.goi === goi);

    // Xác định phường hiển thị
    const displayPhuong = phuong || (filtered.length > 0 ? (filtered[0] as any).trees?.phuong : "Tất cả");

    // Header rows
    const headerRows: any[][] = [
      ["ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", "", "", "", "", "", "", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"],
      ["CÔNG TY TNHH MTV CÔNG VIÊN CÂY XANH", "", "", "", "", "", "", "", "", "", "Độc lập - Tự do - Hạnh phúc"],
      [],
      [`BÁO CÁO TUẦN TRA CÂY XANH NGÀY ${day}/${month}/${year}${goi ? ` - GÓI THẦU KHU VỰC ${goi}` : ""}`],
      [`Cây xanh địa bàn phường ${displayPhuong} - Thành phố Hồ Chí Minh`],
      [],
      [
        "STT", "Thời gian", "Vị trí tọa độ", "Địa chỉ",
        "Tuyến đường/CV/MX", "Phường/Xã", "Loài cây", "Nhà số",
        "Phân loại", "Tình trạng, sự việc phát hiện",
        "Hình ảnh ghi nhận\n(tại thời điểm tuần tra)", "Đã xử lý\n(ảnh sau xử lý)",
        "Nội dung đã xử lý", "Nội dung sẽ xử lý tiếp theo"
      ]
    ];

    // Import mapping
    const CONDITION_MAP: Record<string, string> = {
      bong_goc: "Bọng gốc", chet_kho: "Chết khô", re_noi: "Rễ nổi",
      sam_muc: "Sam mục thân", nga_do: "Ngã đổ", canh_gay: "Cành gãy",
      don_trai_phep: "Bị đốn trái phép", bi_mat: "Bị mất", ha_thap: "Cần hạ thấp",
      treo_quang_cao: "Treo quảng cáo/đèn", sau_benh: "Sâu bệnh",
      cay_nghieng: "Cây nghiêng", nhom_goc: "Nhổm gốc",
    };

    // Data rows
    const dataRows: any[][] = filtered.map((p: any, idx: number) => {
      const tree = p.trees || {};
      const time = new Date(p.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const lat = p.lat || tree.lat;
      const lng = p.lng || tree.lng;
      const coords = lat && lng ? `${lat},\n${lng}` : "—";
      const conditions = (p.tinh_trang || []).map((t: string) => CONDITION_MAP[t] || t).join(", ");
      
      // Ảnh chính (phần tử đầu tiên) — dùng =IMAGE() cho Google Sheets
      const images = p.hinh_anh || [];
      const mainImage = images.length > 0 && images[0].startsWith("http") ? `=IMAGE("${images[0]}")` : (images[0] || "");
      
      return [
        idx + 1,
        time,
        coords,
        tree.khu_vuc || "Toàn tuyến",
        tree.ten_duong || "—",
        tree.phuong || "—",
        tree.loai_cay || "—",
        tree.hieu_so_cay || "—",
        tree.phan_loai || "MT 1,2,3",
        conditions || "Chưa phát hiện sự việc phát sinh hoặc thay đổi hiện trạng của cây xanh",
        mainImage,
        "", // Ảnh đã xử lý (chưa có)
        "", // Nội dung đã xử lý
        p.mo_ta || "Tiếp tục theo dõi"
      ];
    });

    if (dataRows.length === 0) {
      dataRows.push([1, "—", "—", "—", "—", displayPhuong, "—", "—", "—", "Không có dữ liệu tuần tra trong ngày này", "", "", "", ""]);
    }

    const allRows = [...headerRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Merges
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 0, c: 10 }, e: { r: 0, c: 13 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 1, c: 10 }, e: { r: 1, c: 13 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 13 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 13 } },
    ];

    // Column widths
    ws["!cols"] = [
      { wch: 5 }, { wch: 10 }, { wch: 18 }, { wch: 12 },
      { wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 8 },
      { wch: 10 }, { wch: 38 },
      { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
    ];

    // Row heights cho ảnh (từ dòng 8 trở đi)
    ws["!rows"] = [];
    for (let i = 0; i < 7; i++) ws["!rows"].push({});
    for (let i = 0; i < dataRows.length; i++) ws["!rows"].push({ hpt: 80 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Ngày ${day}-${month}-${year}`);

    const filename = `TuanTra_${day}_${month}_${year}${phuong ? `_${phuong.replace(/\s+/g, "_")}` : ""}${goi ? `_KV${goi}` : ""}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  // ===== XUẤT TỔNG HỢP THÁNG =====
  async function exportMonthly() {
    const daysInMonth = getDaysInMonth(month, year);

    // Lấy tuyến đường (không bắt buộc phường)
    let treeQ = supabase.from("trees").select("id, ten_duong, phuong");
    if (phuong) treeQ = treeQ.eq("phuong", phuong);
    if (goi) treeQ = treeQ.eq("goi", goi);
    const { data: treeData } = await treeQ;
    if (!treeData || treeData.length === 0) throw new Error("Không có dữ liệu cây xanh phù hợp.");

    const streets = [...new Set(treeData.map(r => r.ten_duong).filter(Boolean))].sort();
    const treeMap: Record<string, string> = {};
    treeData.forEach(t => { if (t.ten_duong) treeMap[t.id] = t.ten_duong; });

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { data: patrols } = await supabase
      .from("patrol_logs")
      .select("tree_id, created_at")
      .in("tree_id", Object.keys(treeMap).slice(0, 1000))
      .gte("created_at", startDate + "T00:00:00")
      .lte("created_at", endDate + "T23:59:59");

    const matrix: Record<string, Set<number>> = {};
    streets.forEach(s => { matrix[s] = new Set(); });
    (patrols || []).forEach(p => {
      const street = treeMap[p.tree_id];
      if (street && matrix[street]) matrix[street].add(new Date(p.created_at).getDate());
    });

    const dayHeaders = [];
    const daySubHeaders = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      dayHeaders.push(`${String(d).padStart(2, "0")}/${String(month).padStart(2, "0")}`);
      daySubHeaders.push(getDayLabel(date));
    }

    const displayPhuong = phuong || "Tất cả";
    const headerRows = [
      ["ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH", "", "", "", "", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"],
      ["CÔNG TY TNHH MTV CÔNG VIÊN CÂY XANH", "", "", "", "", "", "", "Độc lập - Tự do - Hạnh phúc"],
      [],
      [`BẢNG DIỄN GIẢI KHỐI LƯỢNG TUẦN TRA CÂY XANH THÁNG ${month}/${year}${goi ? ` - GÓI THẦU KHU VỰC ${goi}` : ""}`],
      [`Cây xanh địa bàn phường ${displayPhuong} - Thành phố Hồ Chí Minh`],
      [],
      ["STT", "Tuyến đường/CVMX", "Phường/Xã", "KL QL\n(1000 cây)", ...dayHeaders, "Số lần\ntuần tra", "KL\nthực hiện"],
      ["", "", "", "", ...daySubHeaders, "", ""],
    ];

    const dataRows = streets.map((street, idx) => {
      const patrolDays = matrix[street] || new Set();
      const dayCells = [];
      for (let d = 1; d <= daysInMonth; d++) dayCells.push(patrolDays.has(d) ? "☑" : "");
      // Tìm phường của tuyến đường này
      const streetPhuong = treeData.find(t => t.ten_duong === street)?.phuong || "—";
      return [idx + 1, street, streetPhuong, "-", ...dayCells, patrolDays.size, "-"];
    });

    const allRows = [...headerRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    ws["!cols"] = [
      { wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
      ...Array(daysInMonth).fill({ wch: 5 }),
      { wch: 10 }, { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Tháng ${month}-${year}`);
    XLSX.writeFile(wb, `TuanTra_Thang${month}_${year}${phuong ? `_${phuong.replace(/\s+/g, "_")}` : ""}${goi ? `_KV${goi}` : ""}.xlsx`);
  }

  return (
    <div style={{ overflowY: "auto", maxHeight: "85vh" }}>
      <div className="modal-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <i className="material-icons" style={{ fontSize: 24, color: "#16a34a" }}>table_chart</i>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>Xuất Báo Cáo Tuần Tra</h2>
            <p style={{ fontSize: 12, color: "#999" }}>Xuất Excel — mở bằng Google Sheets để xem ảnh trong ô</p>
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
              { id: "daily" as const, label: "Báo cáo Ngày", icon: "today", desc: "Chi tiết từng lần tuần tra + ảnh" },
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

        {/* Thời gian */}
        <div style={{ display: "grid", gridTemplateColumns: exportType === "daily" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 16, marginTop: 16 }}>
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
            <label style={{ fontWeight: 600 }}>Tháng</label>
            <select className="form-input" value={month} onChange={e => setMonth(+e.target.value)}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Năm</label>
            <select className="form-input" value={year} onChange={e => setYear(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Bộ lọc phụ (TÙY CHỌN) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Phường / Xã <span style={{ color: "#999", fontWeight: 400, fontSize: 12 }}>(tùy chọn)</span></label>
            <select className="form-input" value={phuong} onChange={e => setPhuong(e.target.value)}>
              <option value="">— Tất cả phường —</option>
              {phuongOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontWeight: 600 }}>Gói thầu <span style={{ color: "#999", fontWeight: 400, fontSize: 12 }}>(tùy chọn)</span></label>
            <select className="form-input" value={goi} onChange={e => setGoi(e.target.value)}>
              <option value="">— Tất cả —</option>
              {goiOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Hướng dẫn */}
        <div style={{
          marginTop: 12, padding: 14, background: "#fefce8", borderRadius: 8,
          border: "1px solid #fde68a", display: "flex", gap: 10,
        }}>
          <i className="material-icons" style={{ fontSize: 20, color: "#ca8a04", marginTop: 2 }}>tips_and_updates</i>
          <div style={{ fontSize: 12, color: "#713f12", lineHeight: 1.7 }}>
            <strong>Mẹo:</strong> Sau khi tải file .xlsx, hãy mở bằng <strong>Google Sheets</strong> (Upload lên Google Drive → Open with Google Sheets). 
            Hình ảnh tuần tra sẽ tự động hiển thị trong ô nhờ công thức <code>=IMAGE()</code>.<br/>
            Nếu mở bằng Excel desktop, cột hình ảnh sẽ hiển thị URL thay vì ảnh.
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>Hủy</button>
        <button className="btn-primary" onClick={handleExport} disabled={exporting}
          style={{ background: "#16a34a", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="material-icons" style={{ fontSize: 18 }}>file_download</i>
          {exporting ? "Đang xuất..." : "Xuất Excel (.xlsx)"}
        </button>
      </div>
    </div>
  );
}
