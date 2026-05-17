"use client";

import { useState } from "react";
import type { ParkRecord, ParkAsset, GreenAreaRecord } from "@/lib/types";

interface ParkManagerProps {
  showMode?: "all" | "parks" | "greenAreas";
}

export default function ParkManager({ showMode = "all" }: ParkManagerProps) {
  const [search, setSearch] = useState("");
  
  // TODO: Kết nối dữ liệu công viên và mảng xanh từ Supabase
  const PARKS: ParkRecord[] = [];
  const PARK_ASSETS: ParkAsset[] = [];
  const GREEN_AREAS: GreenAreaRecord[] = [];

  const filteredParks = PARKS.filter(p => p.ten.toLowerCase().includes(search.toLowerCase()) || String(p.quan).toLowerCase().includes(search.toLowerCase()));
  const filteredGreenAreas = GREEN_AREAS.filter(g => g.ten.toLowerCase().includes(search.toLowerCase()) || String(g.quan).toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px", backgroundColor: "#f5f7fa" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "500", color: "#333", margin: "0 0 5px 0" }}>
            {showMode === "parks" ? "Quản lý Công viên" : showMode === "greenAreas" ? "Quản lý Mảng xanh" : "Công viên & Mảng xanh"}
          </h2>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            {showMode !== "greenAreas" && `${PARKS.length} công viên`}
            {showMode === "all" && " · "}
            {showMode !== "parks" && `${GREEN_AREAS.length} mảng xanh`} đang được quản lý
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ position: "relative", width: "350px" }}>
          <i className="material-icons" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "20px" }}>search</i>
          <input 
            type="text" 
            placeholder={showMode === "parks" ? "Tìm kiếm công viên..." : showMode === "greenAreas" ? "Tìm kiếm mảng xanh..." : "Tìm kiếm..."}
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="form-input"
            style={{ paddingLeft: "38px", margin: 0 }}
          />
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px" }}>
          <i className="material-icons" style={{ fontSize: "18px" }}>add_circle_outline</i>
          {showMode === "parks" ? "Thêm công viên" : showMode === "greenAreas" ? "Thêm mảng xanh" : "Thêm mới"}
        </button>
      </div>

      {/* PARKS TABLE */}
      {showMode !== "greenAreas" && (
        <div style={{ marginBottom: "30px" }}>
          {showMode === "all" && (
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="material-icons" style={{ color: "#2563eb" }}>park</i> Danh sách Công viên
            </h3>
          )}
          <div className="card" style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên công viên</th>
                  <th>Địa điểm</th>
                  <th style={{ textAlign: "center" }}>Cấp độ</th>
                  <th style={{ textAlign: "right" }}>Tổng diện tích (m²)</th>
                  <th style={{ textAlign: "right" }}>Diện tích duy tu (m²)</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredParks.map((park) => (
                  <tr key={park.id}>
                    <td>
                      <div style={{ fontWeight: "600", color: "#2563eb", fontSize: "14px" }}>{park.ten}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "#555" }}>{park.phuong}, Quận {park.quan}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ backgroundColor: "#f3f4f6", color: "#4b5563", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                        Cấp {park.capDo}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>{park.tongDienTich.toLocaleString()}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", color: "#059669", fontWeight: "500" }}>{park.dienTichDuyTu.toLocaleString()}</span>
                      <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                        Không DT: {park.dienTichKhongDuyTu.toLocaleString()} m²
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: "4px" }} title="Chi tiết tài sản">
                        <i className="material-icons" style={{ fontSize: "20px" }}>inventory_2</i>
                      </button>
                      <button style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px" }} title="Chỉnh sửa">
                        <i className="material-icons" style={{ fontSize: "20px" }}>edit</i>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredParks.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>Chưa có dữ liệu công viên.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GREEN AREAS TABLE */}
      {showMode !== "parks" && (
        <div>
          {showMode === "all" && (
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="material-icons" style={{ color: "#059669" }}>nature</i> Danh sách Mảng xanh
            </h3>
          )}
          <div className="card" style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên mảng xanh</th>
                  <th>Địa điểm</th>
                  <th style={{ textAlign: "right" }}>Diện tích (m²)</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredGreenAreas.map((ga) => (
                  <tr key={ga.id}>
                    <td>
                      <div style={{ fontWeight: "600", color: "#059669", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", backgroundColor: "#10b981", borderRadius: "50%" }}></div>
                        {ga.ten}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "#555" }}>{ga.phuong}, Quận {ga.quan}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>{ga.dienTich.toLocaleString()}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: "4px" }} title="Định vị">
                        <i className="material-icons" style={{ fontSize: "20px" }}>place</i>
                      </button>
                      <button style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px" }} title="Chỉnh sửa">
                        <i className="material-icons" style={{ fontSize: "20px" }}>edit</i>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredGreenAreas.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>Chưa có dữ liệu mảng xanh.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
