"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  FieldCondition, UrgencyLevel,
  FIELD_CONDITION_MAP, URGENCY_MAP,
} from "@/lib/types/ticket";

interface Props {
  treeId: string;
  treeName: string;
  treeLocation: string;
  lat?: number | null;
  lng?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ALL_CONDITIONS: FieldCondition[] = [
  "bong_goc", "chet_kho", "re_noi", "sam_muc", "nga_do", "canh_gay",
  "don_trai_phep", "bi_mat", "ha_thap", "treo_quang_cao", "sau_benh",
  "cay_nghieng", "nhom_goc",
];

export default function PatrolFormModal({ treeId, treeName, treeLocation, lat, lng, onClose, onSuccess }: Props) {
  const [urgency, setUrgency] = useState<UrgencyLevel>("thuong");
  const [conditions, setConditions] = useState<FieldCondition[]>([]);
  const [description, setDescription] = useState("");
  const [inspector, setInspector] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleCondition = (c: FieldCondition) => {
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleSubmit = async () => {
    if (conditions.length === 0 && !description.trim()) {
      setError("Vui lòng chọn ít nhất 1 tình trạng hoặc nhập mô tả.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error: dbError } = await supabase.from("patrol_logs").insert({
        tree_id: treeId,
        lat: lat || null,
        lng: lng || null,
        muc_do_khan_cap: urgency,
        tinh_trang: conditions,
        mo_ta: description.trim() || null,
        nguoi_tuan_tra: inspector.trim() || null,
      });
      if (dbError) throw dbError;
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Lỗi khi lưu dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ overflowY: "auto", maxHeight: "85vh" }}>
      {/* Header */}
      <div className="modal-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <i className="material-icons" style={{ fontSize: 24, color: "#2563eb" }}>directions_walk</i>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>Ghi nhận Tuần tra / Sự cố</h2>
            <p style={{ fontSize: 12, color: "#999" }}>{treeName} · {treeLocation}</p>
          </div>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div className="modal-body">
        {error && (
          <div style={{ padding: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 4, marginBottom: 16, fontSize: 13, border: "1px solid #fee2e2" }}>
            <i className="material-icons" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 8 }}>error</i>{error}
          </div>
        )}

        {/* Mức độ khẩn cấp */}
        <div className="form-group">
          <label style={{ fontWeight: 600 }}>Mức độ khẩn cấp</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {(Object.entries(URGENCY_MAP) as [UrgencyLevel, typeof URGENCY_MAP["thuong"]][]).map(([key, val]) => (
              <button key={key} onClick={() => setUrgency(key)} style={{
                flex: 1, padding: "10px 12px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                fontSize: 14, fontWeight: 600, transition: "all 0.2s",
                border: urgency === key ? `2px solid ${val.color}` : "2px solid #e0e0e0",
                background: urgency === key ? val.bg : "white",
                color: urgency === key ? val.color : "#999",
              }}>
                {key === "khan_cap" && <i className="material-icons" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>warning</i>}
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tình trạng hiện trường */}
        <div className="form-group">
          <label style={{ fontWeight: 600 }}>Tình trạng hiện trường <span style={{ color: "#999", fontWeight: 400 }}>(chọn nhiều)</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {ALL_CONDITIONS.map(c => {
              const active = conditions.includes(c);
              return (
                <button key={c} onClick={() => toggleCondition(c)} style={{
                  padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: 500, transition: "all 0.15s",
                  border: active ? "2px solid #2563eb" : "1px solid #e0e0e0",
                  background: active ? "#dbeafe" : "white",
                  color: active ? "#1d4ed8" : "#666",
                }}>
                  {active && <i className="material-icons" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 4 }}>check</i>}
                  {FIELD_CONDITION_MAP[c]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mô tả */}
        <div className="form-group">
          <label style={{ fontWeight: 600 }}>Mô tả chi tiết</label>
          <textarea className="form-input" rows={3} placeholder="Mô tả tình trạng cụ thể tại hiện trường..."
            value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "vertical", marginTop: 4 }} />
        </div>

        {/* Người tuần tra */}
        <div className="form-group">
          <label style={{ fontWeight: 600 }}>Người tuần tra</label>
          <input className="form-input" placeholder="Nhập tên người tuần tra..." value={inspector}
            onChange={e => setInspector(e.target.value)} style={{ marginTop: 4 }} />
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button className="btn-secondary" onClick={onClose}>Hủy</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
          <i className="material-icons" style={{ fontSize: 16 }}>save</i>
          {saving ? "Đang lưu..." : "Ghi nhận sự cố"}
        </button>
      </div>
    </div>
  );
}
