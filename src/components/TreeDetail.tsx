"use client";

import { useState, useEffect } from "react";
import { TreeRecord } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import proj4 from "proj4";

// Cấu hình hệ tọa độ VN2000 múi chiếu 3 độ, kinh tuyến trục 105.75 (Hồ Chí Minh)
const VN2000_HCM = '+proj=tmerc +lat_0=0 +lon_0=105.75 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-191.90441429,-39.30318279,-111.45032835,0.00928836,-0.01975479,0.00427372,0.252906278 +units=m +no_defs';


interface TreeDetailProps {
  tree: TreeRecord;
  onBack: () => void;
  onCreatePatrol?: (treeInfo: { id: string; name: string; location: string; lat: number | null; lng: number | null }) => void;
}

export default function TreeDetail({ tree, onBack, onCreatePatrol }: TreeDetailProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [showRawData, setShowRawData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(tree);

  useEffect(() => {
    setFormData(tree);
  }, [tree]);

  const handleInputChange = (field: keyof TreeRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Mock save logic - in real app, update Supabase here
    console.log("Saving tree data:", formData);
    setIsEditing(false);
    // You could call an onSave callback here if provided
  };

  const TABS = [
    { id: "general", label: "Thông tin chung", icon: "info" },
    { id: "maintenance", label: "Lịch sử duy tu", icon: "history" },
    { id: "incidents", label: "Lịch sử sự cố", icon: "report_problem" },
  ];

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string; icon: string }> = {
      khoe: { label: "Khỏe mạnh", color: "#16a34a", bg: "#dcfce7", icon: "check_circle" },
      sauBenh: { label: "Sâu bệnh", color: "#d97706", bg: "#fef3c7", icon: "error" },
      canDonHa: { label: "Cần đốn hạ", color: "#dc2626", bg: "#fee2e2", icon: "dangerous" },
      moi: { label: "Mới trồng", color: "#2563eb", bg: "#dbeafe", icon: "add_circle" },
      dangXuLy: { label: "Đang xử lý", color: "#7c3aed", bg: "#f3e8ff", icon: "engineering" },
    };
    return map[status] || map.khoe;
  };

  const status = getStatusInfo(tree.trangThai);

  return (
    <div className="fade-in" style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      {/* HEADER - Style consistent with TicketDetailModal */}
      <div className="modal-header" style={{ background: "white", padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} className="modal-close" style={{ background: "#f1f5f9", fontSize: 18 }}>
            <i className="material-icons">arrow_back</i>
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                {tree.loaiCay} — {tree.soCay} — {tree.phanLoai || "Loại 1"}
              </h2>
              <span className="status-badge" style={{ background: status.bg, color: status.color, padding: "4px 12px", fontWeight: 600 }}>
                <i className="material-icons" style={{ fontSize: 14 }}>{status.icon}</i> {status.label}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {tree.diaChi ? `${tree.diaChi}, ` : ""}{tree.tenDuong}, Phường {tree.phuong}, Quận {tree.quan} cũ
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ 
                fontSize: 11, 
                color: "#2563eb", 
                background: "#eff6ff", 
                padding: "2px 8px", 
                borderRadius: 4, 
                fontFamily: "monospace", 
                fontWeight: 600,
                border: "1px solid #dbeafe"
              }}>
                {tree.id}
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(tree.id);
                  // Optional: Show a brief "copied" state if needed
                }}
                className="copy-btn"
                style={{ 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer", 
                  color: "#94a3b8", 
                  display: "flex", 
                  alignItems: "center",
                  padding: "4px",
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
                title="Sao chép ID"
                onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <i className="material-icons" style={{ fontSize: 14 }}>content_copy</i>
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Quick Actions Group */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: 4, borderRadius: 8, gap: 4 }}>
            <button 
              className="btn-secondary" 
              style={{ padding: "6px 12px", fontSize: 12, border: "none", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              onClick={() => onCreatePatrol?.({
                id: tree.id,
                name: tree.loaiCay,
                location: `${tree.tenDuong} · P.${tree.phuong} · Q.${tree.quan}`,
                lat: tree.lat,
                lng: tree.lng
              })}
            >
              <i className="material-icons" style={{ fontSize: 16, color: "#2563eb" }}>directions_walk</i>
              Tuần tra
            </button>
            <button 
              className="btn-secondary" 
              style={{ padding: "6px 12px", fontSize: 12, border: "none", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              onClick={() => onCreatePatrol?.({
                id: tree.id,
                name: tree.loaiCay,
                location: `${tree.tenDuong} · P.${tree.phuong} · Q.${tree.quan}`,
                lat: tree.lat,
                lng: tree.lng
              })}
            >
              <i className="material-icons" style={{ fontSize: 16, color: "#dc2626" }}>report_problem</i>
              Sự cố
            </button>
            <button 
              className="btn-secondary" 
              style={{ padding: "6px 12px", fontSize: 12, border: "none", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              <i className="material-icons" style={{ fontSize: 16, color: "#d97706" }}>description</i>
              Đề xuất
            </button>
          </div>

          <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 4px" }}></div>

          <button className="btn-secondary" style={{ padding: "8px 12px" }} title="Xem Street View" onClick={() => {
            onBack();
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('START_STREET_VIEW', { detail: { lat: tree.lat, lng: tree.lng } }));
            }, 10);
          }}>
            <i className="material-icons" style={{ fontSize: 20, color: "#7e3af2" }}>streetview</i>
          </button>
          <button className="btn-secondary" style={{ padding: "8px 12px" }} title="Dời vị trí cây" onClick={() => {
            onBack();
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('START_MOVE_TREE', { detail: { id: tree.id, lat: tree.lat, lng: tree.lng } }));
            }, 10);
          }}>
            <i className="material-icons" style={{ fontSize: 20, color: "#16a34a" }}>open_with</i>
          </button>
          <button className="btn-secondary" style={{ padding: "8px 12px" }} title="In lý lịch cây">
            <i className="material-icons" style={{ fontSize: 20, color: "#64748b" }}>print</i>
          </button>

          <button 
            className="btn-secondary" 
            style={{ 
              padding: "8px 16px", 
              background: isEditing ? "#2563eb" : "white", 
              color: isEditing ? "white" : "#64748b", 
              borderColor: isEditing ? "#2563eb" : "#e2e8f0" 
            }} 
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            title="Chỉnh sửa thông tin"
          >
            <i className="material-icons" style={{ fontSize: 20 }}>{isEditing ? "check" : "edit"}</i>
            <span style={{ marginLeft: 4 }}>{isEditing ? "Lưu lại" : "Chỉnh sửa"}</span>
          </button>

          <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 4px" }}></div>

          <button onClick={onBack} className="modal-close" style={{ background: "#f1f5f9", fontSize: 18, width: 36, height: 36 }}>
            <i className="material-icons">close</i>
          </button>
        </div>
      </div>

      {/* TABS - Modern professional look */}
      <div style={{ background: "white", padding: "0 24px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "14px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? "#2563eb" : "#64748b",
              borderBottom: activeTab === tab.id ? "3px solid #2563eb" : "3px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            <i className="material-icons" style={{ fontSize: 18 }}>{tab.icon}</i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* BODY */}
      <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: 24, minHeight: 480 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {activeTab === "general" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Top Section: Photo & Header Actions */}
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {/* Photo Card */}
                <div className="card" style={{ flex: "0 0 240px", overflow: "hidden", position: "relative" }}>
                  <img 
                    src={tree.image || "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&h=300&fit=crop"} 
                    alt={tree.loaiCay}
                    style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "white", fontSize: 11, fontWeight: 500 }}>Ảnh đại diện</span>
                    <button style={{ background: "white", border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <i className="material-icons" style={{ fontSize: 16, color: "#1e293b" }}>camera_alt</i>
                    </button>
                  </div>
                </div>

                {/* Quick Stats or Welcome Message */}
                <div style={{ flex: 1 }}>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px dashed #cbd5e1" }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" }}>Thông tin chi tiết</h3>
                    <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
                      Đây là bảng quản lý hồ sơ cây xanh chuyên sâu. Bạn có thể xem lịch sử duy tu, báo cáo sự cố hoặc thực hiện chỉnh sửa các thông số kỹ thuật bên dưới. 
                      Sử dụng chế độ <strong>Chỉnh sửa</strong> ở trên để cập nhật dữ liệu.
                    </p>
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      <div style={{ background: "white", padding: "8px 16px", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Ngày cập nhật</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>05/05/2026</div>
                      </div>
                      <div style={{ background: "white", padding: "8px 16px", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Người phụ trách</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Nguyễn Văn A</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toggle Button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowRawData(!showRawData)}
                    style={{ 
                      padding: "10px 16px", 
                      borderRadius: "8px", 
                      background: showRawData ? "#eff6ff" : "white",
                      borderColor: showRawData ? "#2563eb" : "#e2e8f0",
                      color: showRawData ? "#2563eb" : "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                  >
                    <i className="material-icons" style={{ fontSize: 20 }}>{showRawData ? "visibility_off" : "compare"}</i>
                    {showRawData ? "Đóng so sánh" : "Dữ liệu gốc"}
                  </button>
                </div>
              </div>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: showRawData ? "repeat(4, 1fr)" : "repeat(3, 1fr)", 
                gap: 16,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                width: "100%"
              }}>
                {/* 1. Vị trí */}
                <div style={{ minWidth: 0 }}>
                  <div className="card">
                    <div className="card-header-bar" style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="material-icons" style={{ color: "#2563eb", fontSize: 18 }}>place</i>
                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Vị trí & Địa chỉ</span>
                      </div>
                    </div>
                    <div className="card-body" style={{ padding: 16 }}>
                      <div className="info-grid-modern">
                        <InfoRow 
                          label="Số nhà/Địa chỉ" 
                          value={formData.diaChi || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("diaChi", val)}
                        />
                        <InfoRow 
                          label="Tên đường" 
                          value={formData.tenDuong} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("tenDuong", val)}
                        />
                        <InfoRow 
                          label="Phường/Xã" 
                          value={formData.phuong} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("phuong", val)}
                        />
                        <InfoRow 
                          label="Quận/Huyện" 
                          value={formData.quan?.toString()} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("quan", parseInt(val))}
                        />
                        <InfoRow 
                          label="Khu vực" 
                          value={formData.kv || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("kv", val)}
                        />
                        <InfoRow 
                          label="Vị trí chi tiết" 
                          value={formData.le || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("le", val)}
                        />
                        <div style={{ height: 1, background: "#f1f5f9", gridColumn: "span 2", margin: "8px 0" }}></div>
                        {isEditing ? (
                          <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#f0fdf4", padding: "10px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                               <input 
                                 type="text"
                                 placeholder="Dán nhanh tọa độ (vd: 10.756, 106.685)"
                                 className="form-input"
                                 style={{ flex: 1, fontSize: 13, background: "white", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, margin: 0 }}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   if (val.includes(",")) {
                                     const parts = val.split(",");
                                     const lat = parseFloat(parts[0].trim());
                                     const lng = parseFloat(parts[1].trim());
                                     if (!isNaN(lat) && !isNaN(lng)) {
                                       handleInputChange("lat", lat);
                                       handleInputChange("lng", lng);
                                     }
                                   }
                                 }}
                               />
                               <button 
                                 className="btn-secondary" 
                                 style={{ padding: "8px 12px", background: "white", borderColor: "#cbd5e1", display: "flex", alignItems: "center", gap: 6 }}
                                 onClick={() => {
                                   if (navigator.geolocation) {
                                     navigator.geolocation.getCurrentPosition((position) => {
                                       handleInputChange("lat", position.coords.latitude);
                                       handleInputChange("lng", position.coords.longitude);
                                     }, (err) => {
                                       alert("Không thể lấy vị trí GPS: " + err.message);
                                     }, { enableHighAccuracy: true });
                                   } else {
                                     alert("Trình duyệt không hỗ trợ định vị GPS.");
                                   }
                                 }}
                                 title="Lấy vị trí GPS hiện tại"
                               >
                                 <i className="material-icons" style={{ fontSize: 18, color: "#16a34a" }}>my_location</i>
                                 <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>GPS</span>
                               </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                              <InfoRow label="Vĩ độ (Lat)" value={formData.lat?.toFixed(6) || ""} editable={true} onChange={(v) => handleInputChange("lat", parseFloat(v) || null)} />
                              <InfoRow label="Kinh độ (Lng)" value={formData.lng?.toFixed(6) || ""} editable={true} onChange={(v) => handleInputChange("lng", parseFloat(v) || null)} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <InfoRow label="Vĩ độ (Lat)" value={formData.lat?.toFixed(6) || "—"} />
                            <InfoRow label="Kinh độ (Lng)" value={formData.lng?.toFixed(6) || "—"} />
                          </>
                        )}
                        <InfoRow label="VN2000 (X)" value={formData.lat && formData.lng ? proj4('WGS84', VN2000_HCM, [formData.lng, formData.lat])[0].toFixed(2) : "—"} />
                        <InfoRow label="VN2000 (Y)" value={formData.lat && formData.lng ? proj4('WGS84', VN2000_HCM, [formData.lng, formData.lat])[1].toFixed(2) : "—"} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Sinh trưởng */}
                <div style={{ minWidth: 0 }}>
                  <div className="card">
                    <div className="card-header-bar" style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="material-icons" style={{ color: "#16a34a", fontSize: 18 }}>trending_up</i>
                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Thông số Sinh trưởng</span>
                      </div>
                    </div>
                    <div className="card-body" style={{ padding: 16 }}>
                      <div className="info-grid-modern">
                        <InfoRow 
                          label="Loài cây" 
                          value={formData.loaiCay} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("loaiCay", val)}
                        />
                        <InfoRow 
                          label="Số hiệu" 
                          value={formData.soCay} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("soCay", val)}
                        />
                        <InfoRow 
                          label="Phân loại" 
                          value={formData.phanLoai || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("phanLoai", val)}
                        />
                        <InfoRow 
                          label="Chiều cao (Hvn)" 
                          value={formData.hvn?.toString()} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("hvn", parseFloat(val))}
                        />
                        <InfoRow 
                          label="Đường kính (C1.3)" 
                          value={formData.c13?.toString()} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("c13", parseFloat(val))}
                        />
                        <InfoRow 
                          label="Độ rộng tán" 
                          value={formData.phanTan ? "Có độ phủ" : "Không"} 
                          editable={isEditing}
                          type="boolean"
                          onChange={(val) => handleInputChange("phanTan", val)}
                        />
                        <InfoRow 
                          label="Kích thước bồn" 
                          value={formData.bon ? "Có bồn" : "Không"} 
                          editable={isEditing}
                          type="boolean"
                          onChange={(val) => handleInputChange("bon", val)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Quản lý */}
                <div style={{ minWidth: 0 }}>
                  <div className="card">
                    <div className="card-header-bar" style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="material-icons" style={{ color: "#6366f1", fontSize: 18 }}>assignment</i>
                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>Thông tin Quản lý</span>
                      </div>
                    </div>
                    <div className="card-body" style={{ padding: 16 }}>
                      <div className="info-grid-modern">
                        <InfoRow 
                          label="Mã số (Legacy)" 
                          value={formData.ma?.toString() || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("ma", parseInt(val))}
                        />
                        <InfoRow 
                          label="Công ty duy trì" 
                          value={formData.cty || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("cty", val)}
                        />
                        <InfoRow 
                          label="Xí nghiệp" 
                          value={formData.xn || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("xn", val)}
                        />
                        <InfoRow 
                          label="Gói thầu" 
                          value={formData.goi?.toString() || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("goi", parseInt(val))}
                        />
                        <InfoRow 
                          label="Giám sát" 
                          value={formData.giamSat || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("giamSat", val)}
                        />
                        <InfoRow 
                          label="Năm trồng" 
                          value={formData.namTrong?.toString() || "—"} 
                          editable={isEditing}
                          onChange={(val) => handleInputChange("namTrong", parseInt(val))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Dữ liệu gốc (JSON Panel) */}
                {showRawData && (
                  <div className="fade-in" style={{ minWidth: 0 }}>
                    <div className="card" style={{ background: "#0f172a", border: "none", height: "100%", overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="material-icons" style={{ color: "#3b82f6", fontSize: 16 }}>storage</i>
                        <span style={{ color: "#f8fafc", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Dữ liệu gốc</span>
                      </div>
                      <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 600 }}>
                        <pre className="json-code" style={{ fontSize: "11px", padding: 16, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {JSON.stringify(tree, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="card">
              <div className="empty-state">
                <i className="material-icons" style={{ fontSize: 48, color: "#cbd5e1" }}>history</i>
                <p>Chưa có lịch sử duy tu bảo dưỡng cho cây này.</p>
              </div>
            </div>
          )}

          {activeTab === "incidents" && (
            <div className="card">
              <div className="empty-state">
                <i className="material-icons" style={{ fontSize: 48, color: "#cbd5e1" }}>report_problem</i>
                <p>Chưa có lịch sử sự cố cho cây này.</p>
              </div>
            </div>
          )}


        </div>
      </div>

      <style jsx>{`
        .info-grid-modern {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .json-code {
          margin: 0;
          padding: 16px;
          color: #38bdf8;
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          line-height: 1.6;
          overflow: auto;
          max-height: 500px;
        }
        .json-code::-webkit-scrollbar { width: 4px; }
        .json-code::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  editable, 
  type = "text", 
  onChange 
}: { 
  label: string; 
  value: string; 
  editable?: boolean;
  type?: "text" | "number" | "boolean";
  onChange?: (val: any) => void;
}) {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: editable ? "center" : "flex-start", 
      padding: "6px 0", 
      borderBottom: "1px solid #f1f5f9",
      gap: 8
    }}>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
      {editable ? (
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          {type === "boolean" ? (
            <select 
              value={value === "Có độ phủ" || value === "Có bồn" || value === "true" || value === "Có" ? "true" : "false"}
              onChange={(e) => onChange?.(e.target.value === "true")}
              style={{ 
                fontSize: 13, 
                padding: "3px 8px", 
                borderRadius: 4, 
                border: "1px solid #cbd5e1", 
                background: "white",
                maxWidth: "120px"
              }}
            >
              <option value="true">Có</option>
              <option value="false">Không</option>
            </select>
          ) : (
            <input 
              type={type}
              value={value === "—" ? "" : value}
              onChange={(e) => onChange?.(e.target.value)}
              style={{ 
                fontSize: 13, 
                padding: "3px 8px", 
                borderRadius: 4, 
                border: "1px solid #cbd5e1", 
                outline: "none",
                textAlign: "right",
                width: "100%",
                maxWidth: "180px"
              }}
            />
          )}
        </div>
      ) : (
        <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{value}</span>
      )}
    </div>
  );
}
