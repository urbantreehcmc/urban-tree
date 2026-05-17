"use client";

import { useState } from "react";
import { ContractorRecord } from "@/lib/types";

export default function ContractorManager() {
  const [search, setSearch] = useState("");
  const allContractors: ContractorRecord[] = [];
  const filtered = allContractors.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.taxCode.includes(search));

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px", backgroundColor: "#f5f7fa" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "500", color: "#333", margin: "0 0 5px 0" }}>Quản lý Nhà thầu</h2>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>Quản lý thông tin pháp lý, năng lực và đánh giá chất lượng</p>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <div style={{ position: "relative", width: "350px" }}>
          <i className="material-icons" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "20px" }}>search</i>
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc MST..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="form-input"
            style={{ paddingLeft: "38px", margin: 0 }}
          />
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px" }}>
          <i className="material-icons" style={{ fontSize: "18px" }}>add_business</i>
          Đăng ký nhà thầu
        </button>
      </div>

      {/* TABLE */}
      <div className="card" style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nhà thầu</th>
              <th>Mã số thuế</th>
              <th>Liên hệ</th>
              <th>Lĩnh vực</th>
              <th style={{ textAlign: "center" }}>Đánh giá</th>
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: "500", color: "#333", fontSize: "14px", marginBottom: "2px" }}>{c.name}</div>
                  <div style={{ color: "#777", fontSize: "12px" }}>{c.address}</div>
                </td>
                <td>
                  <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#555", backgroundColor: "#f5f5f5", padding: "2px 6px", borderRadius: "4px" }}>
                    {c.taxCode}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: "13px", color: "#333", marginBottom: "2px" }}>{c.representative}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{c.phone}</div>
                </td>
                <td>
                  <span style={{ fontSize: "13px", color: "#666" }}>{c.specialization}</span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "2px", backgroundColor: "#fffbeb", color: "#d97706", padding: "2px 8px", borderRadius: "12px", fontWeight: "600", fontSize: "12px" }}>
                    <span>{c.rating}</span>
                    <i className="material-icons" style={{ fontSize: "14px" }}>star</i>
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: "4px" }} title="Chỉnh sửa">
                    <i className="material-icons" style={{ fontSize: "20px" }}>edit</i>
                  </button>
                  <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }} title="Xóa">
                    <i className="material-icons" style={{ fontSize: "20px" }}>delete</i>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>Chưa có dữ liệu nhà thầu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
