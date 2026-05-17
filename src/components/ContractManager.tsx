"use client";

import { useState } from "react";
import { ContractRecord, ContractorRecord } from "@/lib/types";

export default function ContractManager() {
  const [search, setSearch] = useState("");
  const allContracts: ContractRecord[] = [];
  const allContractors: ContractorRecord[] = [];
  const filtered = allContracts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Đang thực hiện", color: "#10b981", bg: "#dcfce7" },
    completed: { label: "Hoàn thành", color: "#3b82f6", bg: "#dbeafe" },
    suspended: { label: "Tạm ngưng", color: "#ef4444", bg: "#fee2e2" },
    bidding: { label: "Đang đấu thầu", color: "#f59e0b", bg: "#fef3c7" },
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px", backgroundColor: "#f5f7fa" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "500", color: "#333", margin: "0 0 5px 0" }}>Quản lý Gói thầu</h2>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>Theo dõi tiến độ, giá trị và đơn vị thực hiện</p>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <div style={{ position: "relative", width: "350px" }}>
          <i className="material-icons" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "20px" }}>search</i>
          <input 
            type="text" 
            placeholder="Tìm kiếm gói thầu..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="form-input"
            style={{ paddingLeft: "38px", margin: 0 }}
          />
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px" }}>
          <i className="material-icons" style={{ fontSize: "18px" }}>post_add</i>
          Tạo gói thầu
        </button>
      </div>

      {/* TABLE */}
      <div className="card" style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã gói thầu</th>
              <th>Tên gói thầu</th>
              <th>Nhà thầu</th>
              <th>Giá trị</th>
              <th>Thời gian</th>
              <th style={{ textAlign: "center" }}>Trạng thái</th>
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contract) => {
              const contractor = allContractors.find(c => c.id === contract.contractorId);
              const status = statusMap[contract.status];
              return (
                <tr key={contract.id}>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#2563eb", fontWeight: "600", backgroundColor: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}>
                      {contract.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "500", color: "#333", fontSize: "14px", marginBottom: "2px", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={contract.name}>
                      {contract.name}
                    </div>
                    <div style={{ color: "#777", fontSize: "12px", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {contract.description}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "13px", color: "#333", fontWeight: "500" }}>{contractor?.name || "N/A"}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#059669" }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.value)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>Bắt đầu: <span style={{ color: "#333" }}>{contract.startDate}</span></div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Kết thúc: <span style={{ color: "#333" }}>{contract.endDate}</span></div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ backgroundColor: status.bg, color: status.color, padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: "4px" }} title="Xem chi tiết">
                      <i className="material-icons" style={{ fontSize: "20px" }}>visibility</i>
                    </button>
                    <button style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px" }} title="Chỉnh sửa">
                      <i className="material-icons" style={{ fontSize: "20px" }}>edit</i>
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>Chưa có dữ liệu gói thầu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
