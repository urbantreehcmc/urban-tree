"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SpeciesRecord {
  id: string;
  name: string;
  scientific_name: string | null;
  notes: string | null;
}

export default function SpeciesManagement() {
  const [species, setSpecies] = useState<SpeciesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ scientific_name: "", notes: "" });

  useEffect(() => {
    fetchSpecies();
  }, []);

  async function fetchSpecies() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tree_species')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) setSpecies(data);
    setLoading(false);
  }

  const filteredSpecies = species.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.scientific_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (s: SpeciesRecord) => {
    setEditingId(s.id);
    setEditForm({ 
      scientific_name: s.scientific_name || "", 
      notes: s.notes || "" 
    });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from('tree_species')
      .update({
        scientific_name: editForm.scientific_name,
        notes: editForm.notes
      })
      .eq('id', id);

    if (!error) {
      setSpecies(prev => prev.map(s => s.id === id ? { ...s, ...editForm } : s));
      setEditingId(null);
    }
  };

  return (
    <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 4 }}>Danh mục Loài cây</h2>
          <p style={{ fontSize: 13, color: "#999" }}>Quản lý thông tin chủng loại và tên khoa học</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <i className="material-icons" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#bbb" }}>search</i>
            <input 
              type="text" 
              placeholder="Tìm tên loài..." 
              className="form-input"
              style={{ width: 240, paddingLeft: 36 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={fetchSpecies}>
            <i className="material-icons" style={{ fontSize: 18 }}>refresh</i>
            Làm mới
          </button>
        </div>
      </div>

      <div className="card" style={{ flex: 1, overflow: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>STT</th>
              <th style={{ width: 250 }}>Loài cây</th>
              <th style={{ width: 300 }}>Tên khoa học</th>
              <th>Ghi chú</th>
              <th style={{ width: 100, textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                  <div className="loader-spinner" style={{ margin: "0 auto" }} />
                </td>
              </tr>
            ) : filteredSpecies.map((s, index) => (
              <tr key={s.id}>
                <td style={{ color: "#999" }}>{index + 1}</td>
                <td style={{ fontWeight: 600, color: "#2563eb" }}>{s.name}</td>
                <td>
                  {editingId === s.id ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input 
                        type="text" 
                        className="form-input"
                        style={{ padding: "6px 10px" }}
                        value={editForm.scientific_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, scientific_name: e.target.value }))}
                        placeholder="Nhập tên khoa học..."
                      />
                      <button 
                        className="btn-secondary" 
                        style={{ padding: "4px" }}
                        onClick={() => window.open(`https://www.google.com/search?q=Tên+khoa+học+của+cây+${s.name}`, "_blank")}
                        title="Tra cứu Google"
                      >
                        <i className="material-icons" style={{ fontSize: 18 }}>public</i>
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontStyle: "italic", color: s.scientific_name ? "#333" : "#ccc" }}>
                      {s.scientific_name || "Chưa cập nhật"}
                    </span>
                  )}
                </td>
                <td>
                  {editingId === s.id ? (
                    <input 
                      type="text" 
                      className="form-input"
                      style={{ padding: "6px 10px" }}
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Ghi chú..."
                    />
                  ) : (
                    <span style={{ color: "#666" }}>{s.notes || "—"}</span>
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  {editingId === s.id ? (
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button className="btn-primary" style={{ padding: "4px 8px" }} onClick={() => saveEdit(s.id)}>
                        Lưu
                      </button>
                      <button className="btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setEditingId(null)}>
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button className="btn-secondary" style={{ padding: "4px 8px" }} onClick={() => startEdit(s)}>
                      Sửa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
