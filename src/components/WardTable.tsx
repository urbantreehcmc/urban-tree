"use client";

import { useState } from "react";
import { useWards } from "@/lib/hooks/useWards";

export default function WardTable() {
  const [filters, setFilters] = useState({
    search: ""
  });

  const { wards, loading, totalCount } = useWards(filters);

  return (
    <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 4 }}>Danh mục Phường xã</h2>
          <p style={{ fontSize: 13, color: "#999" }}>
            Tổng cộng <strong style={{ color: "#2563eb" }}>{totalCount.toLocaleString()}</strong> đơn vị hành chính
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: 300, position: "relative" }}>
          <i className="material-icons" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: "#bbb" }}>search</i>
          <input
            type="text"
            placeholder="Tìm theo tên phường xã hoặc quận cũ..."
            style={{ width: "100%", paddingLeft: 36 }}
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="loader-spinner" />
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên đơn vị</th>
                <th>Phân loại</th>
                <th style={{ textAlign: "right" }}>Diện tích (km²)</th>
                <th style={{ textAlign: "right" }}>Dân số (người)</th>
                <th>Quận/Huyện cũ</th>
                <th>Tỉnh/Thành cũ</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => (
                <tr key={w.id}>
                  <td style={{ fontWeight: 600, color: "#333" }}>{w.type} {w.name}</td>

                  <td>
                    <span className={`status-badge ${w.type === 'Phường' ? 'status-processing' : 'status-new'}`} style={{ fontSize: 11 }}>
                      {w.type}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>{w.area_km2?.toFixed(2)}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>{w.population?.toLocaleString()}</td>
                  <td style={{ color: "#2563eb", fontWeight: 500 }}>{w.old_district}</td>
                  <td style={{ color: "#666" }}>{w.old_province}</td>
                </tr>
              ))}
              {wards.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "#bbb", fontStyle: "italic" }}>
                    Không tìm thấy kết quả phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
