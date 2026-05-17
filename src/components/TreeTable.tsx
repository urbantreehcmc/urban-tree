"use client";

import { useState, useMemo } from "react";
import { useFilteredTrees } from "@/lib/hooks/useFilteredTrees";
import { useFilterOptions } from "@/lib/hooks/useFilterOptions";
import SearchableSelect from "./SearchableSelect";

interface TreeTableProps {
  onManageTree?: (id: string) => void;
}

const PAGE_SIZE = 50;

export default function TreeTable({ onManageTree }: TreeTableProps) {
  const [tempFilters, setTempFilters] = useState({
    loaiCay: "",
    soCay: "",
    phanLoai: "",
    diaChi: "",
    tenDuong: "",
    phuong: "",
    quan: ""
  });
  const [activeFilters, setActiveFilters] = useState({
    loaiCay: "",
    soCay: "",
    phanLoai: "",
    diaChi: "",
    tenDuong: "",
    phuong: "",
    quan: ""
  });
  const [page, setPage] = useState(1);

  const { trees, loading, totalCount } = useFilteredTrees(activeFilters, page, PAGE_SIZE);
  const { options, loading: loadingOptions } = useFilterOptions();

  // Cascading Logic (Flexible)
  const availableWards = useMemo(() => {
    if (!tempFilters.quan) return options.wards;
    const district = options.hierarchy.find(h => String(h.name) === String(tempFilters.quan));
    return district ? district.wards.map(w => w.name) : options.wards;
  }, [tempFilters.quan, options.hierarchy, options.wards]);

  const availableStreets = useMemo(() => {
    if (tempFilters.quan && tempFilters.phuong) {
      const district = options.hierarchy.find(h => String(h.name) === String(tempFilters.quan));
      const ward = district?.wards.find(w => w.name === tempFilters.phuong);
      if (ward) return ward.streets;
    }
    return options.streets;
  }, [tempFilters.quan, tempFilters.phuong, options.hierarchy, options.streets]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasFilter = Object.values(activeFilters).some(v => v !== "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters(tempFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    const empty = { loaiCay: "", soCay: "", phanLoai: "", diaChi: "", tenDuong: "", phuong: "", quan: "" };
    setTempFilters(empty);
    setActiveFilters(empty);
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };


  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      khoe: { label: "Khỏe", cls: "status-healthy" },
      sauBenh: { label: "Sâu bệnh", cls: "status-sick" },
      canDonHa: { label: "Cần đốn hạ", cls: "status-fell" },
      moi: { label: "Mới trồng", cls: "status-new" },
      dangXuLy: { label: "Đang xử lý", cls: "status-processing" },
    };
    const s = map[status] || map.khoe;
    return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 4 }}>Danh sách Cây xanh</h2>
          <p style={{ fontSize: 13, color: "#999" }}>
            Tổng cộng <strong style={{ color: "#2563eb" }}>{totalCount.toLocaleString()}</strong> bản ghi
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {hasFilter && (
            <button
              onClick={handleClearFilters}
              className="btn-danger"
              style={{ padding: "6px 12px", fontSize: 13 }}
            >
              <i className="material-icons" style={{ fontSize: 16 }}>close</i>
              Xóa bộ lọc
            </button>
          )}
          <button 
            className="btn-primary" 
            style={{ padding: "6px 16px", fontSize: 13 }}
            onClick={() => onManageTree?.("NEW")}
          >
            <i className="material-icons" style={{ fontSize: 18 }}>add</i>
            Thêm cây mới
          </button>
        </div>
      </div>

      {/* Advanced Search Form (Single Row Responsive) */}
      <div className="card" style={{ padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", overflow: "visible", zIndex: 30, position: "relative", marginBottom: 12 }}>
        <form onSubmit={handleSearch} className="search-form-row">
          <div className="search-item" style={{ flex: 1.2 }}>
            <SearchableSelect
              options={options.species.sort((a, b) => a.localeCompare(b, 'vi'))}
              value={tempFilters.loaiCay}
              onChange={(val) => handleFilterChange("loaiCay", val)}
              placeholder="Loài cây..."
            />
          </div>
          <div className="search-item" style={{ flex: 0.8 }}>
            <input 
              type="text" 
              placeholder="Số hiệu..." 
              className="form-input"
              value={tempFilters.soCay}
              onChange={(e) => handleFilterChange("soCay", e.target.value)}
              style={{ padding: "8px 10px", background: "#fff", fontSize: "13px" }}
            />
          </div>
          <div className="search-item" style={{ flex: 1 }}>
            <SearchableSelect
              options={["Mới trồng", "Loại 1", "Loại 2", "Loại 3"]}
              value={tempFilters.phanLoai}
              onChange={(val) => handleFilterChange("phanLoai", val)}
              placeholder="Phân loại..."
            />
          </div>
          <div className="search-item" style={{ flex: 1 }}>
            <input 
              type="text" 
              placeholder="Địa chỉ..." 
              className="form-input"
              value={tempFilters.diaChi}
              onChange={(e) => handleFilterChange("diaChi", e.target.value)}
              style={{ padding: "8px 10px", background: "#fff", fontSize: "13px" }}
            />
          </div>
          <div className="search-item" style={{ flex: 1.8 }}>
            <SearchableSelect
              options={availableStreets}
              value={tempFilters.tenDuong}
              onChange={(val) => handleFilterChange("tenDuong", val)}
              placeholder="Tuyến đường..."
            />
          </div>
          <div className="search-item" style={{ flex: 1.5 }}>
            <SearchableSelect
              options={availableWards}
              value={tempFilters.phuong}
              onChange={(val) => {
                handleFilterChange("phuong", val);
                if (val && !tempFilters.quan) {
                  const district = options.hierarchy.find(d => d.wards.some(w => w.name === val));
                  if (district) handleFilterChange("quan", district.name);
                }
                handleFilterChange("tenDuong", "");
              }}
              placeholder="Phường xã..."
            />
          </div>
          <div className="search-item" style={{ flex: 1.2 }}>
            <SearchableSelect
              options={options.districts.map(d => `Quận ${d}`)}
              value={tempFilters.quan ? `Quận ${tempFilters.quan}` : ""}
              onChange={(val) => {
                const q = val.replace("Quận ", "");
                handleFilterChange("quan", q);
                handleFilterChange("phuong", "");
                handleFilterChange("tenDuong", "");
              }}
              placeholder="Quận huyện..."
            />
          </div>
          <div className="search-item-btn">
            <button type="submit" className="btn-primary" style={{ width: "100%", height: 36, justifyContent: "center", padding: "0 12px" }}>
              <i className="material-icons" style={{ fontSize: 18 }}>search</i>
              Tìm
            </button>
          </div>
        </form>
      </div>



      {/* Table */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Loading overlay */}
        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="loader-spinner" />
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", position: "relative", border: "1px solid #eee", borderRadius: 8 }}>
          <table className="data-table" style={{ minWidth: 1100, borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 120, position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>LOÀI CÂY</th>
                <th style={{ width: 80, position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>SỐ HIỆU</th>
                <th style={{ width: 100, position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>PHÂN LOẠI</th>
                <th style={{ width: 180, position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>ĐỊA CHỈ</th>
                <th style={{ width: 150, position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>ĐƯỜNG/CV/MX</th>
                <th style={{ width: 130, position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>PHƯỜNG XÃ</th>
                <th style={{ width: 100, textAlign: "center", position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>QUẬN HUYỆN</th>
                <th style={{ width: 100, position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>TRẠNG THÁI</th>
                <th style={{ width: 80, textAlign: "center", position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, borderBottom: "2px solid #eee" }}>TỌA ĐỘ</th>
              </tr>
            </thead>
            <tbody>
              {!hasFilter ? (
                <tr>
                  <td colSpan={9} style={{ padding: "60px 16px", textAlign: "center" }}>
                    <i className="material-icons" style={{ fontSize: 48, color: "#ddd", marginBottom: 16, display: "block" }}>search</i>
                    <h3 style={{ fontSize: 16, color: "#555", fontWeight: 500, marginBottom: 8 }}>Sẵn sàng tra cứu dữ liệu</h3>
                    <p style={{ color: "#999", fontSize: 13 }}>Sử dụng các bộ lọc ở trên để bắt đầu truy vấn trong tổng số {totalCount.toLocaleString()} bản ghi cây xanh.</p>
                  </td>
                </tr>
              ) : trees.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onManageTree?.(t.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ color: "#444", fontSize: 13, whiteSpace: "normal", wordBreak: "break-word" }}>{t.loaiCay}</td>
                  <td style={{ color: "#444", fontSize: 13, whiteSpace: "normal" }}>{t.soCay}</td>
                  <td style={{ color: "#444", fontSize: 13, whiteSpace: "normal" }}>
                    {t.phanLoai || "—"}
                  </td>
                  <td style={{ color: "#444", fontSize: 13, whiteSpace: "normal", wordBreak: "break-word" }}>{t.diaChi || "—"}</td>
                  <td style={{ color: "#444", fontSize: 13, whiteSpace: "normal", wordBreak: "break-word" }}>{t.tenDuong}</td>
                  <td style={{ color: "#444", fontSize: 13, whiteSpace: "normal" }}>{t.phuong}</td>
                  <td style={{ color: "#444", fontSize: 13, textAlign: "center", whiteSpace: "normal" }}>Quận {t.quan}</td>
                  <td>{statusBadge(t.trangThai)}</td>
                  <td style={{ textAlign: "center" }}>
                    {t.lat ? (
                      <span className="status-badge status-healthy" style={{ fontSize: 11, fontWeight: 400 }}>
                        GPS
                      </span>
                    ) : (
                      <span style={{ color: "#ccc", fontSize: 13 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {hasFilter && trees.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: "#bbb", fontStyle: "italic" }}>
                    Không tìm thấy kết quả phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

            {hasFilter && (
              <div className="pagination">
                <div className="pagination-info">
                  Đang xem <strong>{trees.length}</strong> trên {totalCount.toLocaleString()} bản ghi · Trang <strong>{page}</strong> / {totalPages}
                </div>
                <div className="pagination-buttons">
                  <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <i className="material-icons" style={{ fontSize: 18 }}>chevron_left</i>
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let p = page;
                    if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)} className={`pagination-btn ${page === p ? "active" : ""}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <i className="material-icons" style={{ fontSize: 18 }}>chevron_right</i>
                  </button>
                </div>
              </div>
            )}
          </div>
    </div>
  );
}
