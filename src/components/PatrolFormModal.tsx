"use client";

import { useState, useRef } from "react";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PatrolFormModal({ treeId, treeName, treeLocation, lat, lng, onClose, onSuccess }: Props) {
  const [urgency, setUrgency] = useState<UrgencyLevel>("thuong");
  const [conditions, setConditions] = useState<FieldCondition[]>([]);
  const [description, setDescription] = useState("");
  const [inspector, setInspector] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Ảnh chính (1 ảnh — hiển thị trong báo cáo tuần tra)
  const [mainImage, setMainImage] = useState<{ file: File; preview: string } | null>(null);
  // Ảnh phụ (tối đa 4 ảnh — đính kèm phiếu đề xuất)
  const [subImages, setSubImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");
  
  const mainInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  const toggleCondition = (c: FieldCondition) => {
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  function validateFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE) return `"${file.name}" quá lớn (tối đa 5MB).`;
    if (!file.type.startsWith("image/")) return `"${file.name}" không phải hình ảnh.`;
    return null;
  }

  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setError(err); return; }
    if (mainImage) URL.revokeObjectURL(mainImage.preview);
    setMainImage({ file, preview: URL.createObjectURL(file) });
    setError("");
    if (mainInputRef.current) mainInputRef.current.value = "";
  };

  const handleSubImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - subImages.length;
    if (remaining <= 0) { setError("Tối đa 4 ảnh phụ."); return; }
    
    const valid = files.slice(0, remaining).filter(f => {
      const err = validateFile(f);
      if (err) { setError(err); return false; }
      return true;
    });
    
    setSubImages(prev => [...prev, ...valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
    setError("");
    if (subInputRef.current) subInputRef.current.value = "";
  };

  const removeSubImage = (idx: number) => {
    setSubImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  async function uploadAllImages(): Promise<string[]> {
    const allFiles: File[] = [];
    if (mainImage) allFiles.push(mainImage.file);
    subImages.forEach(img => allFiles.push(img.file));
    
    if (allFiles.length === 0) return [];

    const urls: string[] = [];
    
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      setUploadProgress(`Đang tải ảnh ${i + 1}/${allFiles.length}...`);
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `patrol/${treeId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      
      const { data, error: uploadErr } = await supabase.storage
        .from("patrol-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      
      if (uploadErr) {
        console.warn("Upload error (sẽ lưu tên file):", uploadErr.message);
        urls.push(`[local] ${file.name}`);
      } else {
        const { data: urlData } = supabase.storage.from("patrol-images").getPublicUrl(data.path);
        urls.push(urlData.publicUrl);
      }
    }
    
    setUploadProgress("");
    return urls;
  }

  const handleSubmit = async () => {
    if (conditions.length === 0 && !description.trim()) {
      setError("Vui lòng chọn ít nhất 1 tình trạng hoặc nhập mô tả.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const imageUrls = await uploadAllImages();
      
      const { error: dbError } = await supabase.from("patrol_logs").insert({
        tree_id: treeId,
        lat: lat || null,
        lng: lng || null,
        muc_do_khan_cap: urgency,
        tinh_trang: conditions,
        mo_ta: description.trim() || null,
        nguoi_tuan_tra: inspector.trim() || null,
        hinh_anh: imageUrls.length > 0 ? imageUrls : null,
      });
      if (dbError) throw dbError;
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Lỗi khi lưu dữ liệu.");
    } finally {
      setSaving(false);
      setUploadProgress("");
    }
  };

  return (
    <div style={{ overflowY: "auto", maxHeight: "85vh" }}>
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

        {/* ẢNH CHÍNH — 1 ảnh, hiển thị trong báo cáo tuần tra */}
        <div className="form-group">
          <label style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="material-icons" style={{ fontSize: 18, color: "#2563eb" }}>photo_camera</i>
            Ảnh chính
            <span style={{ color: "#999", fontWeight: 400, fontSize: 12 }}>— hiển thị trong Báo cáo tuần tra</span>
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "flex-start" }}>
            {mainImage ? (
              <div style={{ width: 120, height: 120, borderRadius: 8, overflow: "hidden", position: "relative", border: "3px solid #2563eb" }}>
                <img src={mainImage.preview} alt="Ảnh chính" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => { URL.revokeObjectURL(mainImage.preview); setMainImage(null); }}
                  style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.7)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, lineHeight: 1 }}>×</button>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(37,99,235,0.9)", color: "white", fontSize: 9, textAlign: "center", padding: "2px 0", fontWeight: 600 }}>ẢNH CHÍNH</div>
              </div>
            ) : (
              <button onClick={() => mainInputRef.current?.click()} style={{
                width: 120, height: 120, borderRadius: 8, border: "3px dashed #2563eb", background: "#eff6ff",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "#2563eb", fontFamily: "inherit",
              }}>
                <i className="material-icons" style={{ fontSize: 32 }}>add_a_photo</i>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Chọn ảnh chính</span>
              </button>
            )}
          </div>
          <input ref={mainInputRef} type="file" accept="image/*" onChange={handleMainImage} style={{ display: "none" }} />
        </div>

        {/* ẢNH PHỤ — tối đa 4 ảnh, đính kèm phiếu đề xuất */}
        <div className="form-group">
          <label style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="material-icons" style={{ fontSize: 18, color: "#7c3aed" }}>collections</i>
            Ảnh phụ
            <span style={{ color: "#999", fontWeight: 400, fontSize: 12 }}>— đính kèm Phiếu đề xuất (tối đa 4)</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {subImages.map((img, idx) => (
              <div key={idx} style={{ width: 90, height: 90, borderRadius: 8, overflow: "hidden", position: "relative", border: "2px solid #7c3aed" }}>
                <img src={img.preview} alt={`Ảnh phụ ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => removeSubImage(idx)}
                  style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1 }}>×</button>
              </div>
            ))}
            {subImages.length < 4 && (
              <button onClick={() => subInputRef.current?.click()} style={{
                width: 90, height: 90, borderRadius: 8, border: "2px dashed #c4b5fd", background: "#faf5ff",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "#7c3aed", fontFamily: "inherit",
              }}>
                <i className="material-icons" style={{ fontSize: 24 }}>add_photo_alternate</i>
                <span style={{ fontSize: 9, fontWeight: 500 }}>Thêm ảnh phụ</span>
              </button>
            )}
          </div>
          <input ref={subInputRef} type="file" accept="image/*" multiple onChange={handleSubImages} style={{ display: "none" }} />
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
          {uploadProgress || (saving ? "Đang lưu..." : "Ghi nhận sự cố")}
        </button>
      </div>
    </div>
  );
}
