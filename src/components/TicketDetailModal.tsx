"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Ticket, PatrolLog, Proposal, AsBuiltLog, TicketStatus, ProcessType,
  TICKET_STATUS_MAP, PROCESS_TYPE_MAP, URGENCY_MAP, FIELD_CONDITION_MAP,
} from "@/lib/types/ticket";

interface Props {
  ticketId: string;
  onClose: () => void;
  onCancelTicket?: () => void; // Gọi khi hủy phiếu, trả về Tab Tuần tra
  onShowAlert?: (config: { 
    type: "success" | "error" | "warning" | "info" | "question"; 
    title: string; 
    message: string; 
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
  }) => void;
}

const STEPS: { key: string; label: string; icon: string; statuses: TicketStatus[] }[] = [
  { key: "patrol", label: "Tuần tra", icon: "directions_walk", statuses: ["moi"] },
  { key: "propose", label: "Đề xuất", icon: "description", statuses: ["cho_duyet"] },
  { key: "approve", label: "Phê duyệt", icon: "verified", statuses: ["da_duyet", "tu_choi"] },
  { key: "process", label: "Thi công", icon: "engineering", statuses: ["dang_thi_cong"] },
  { key: "asbuilt", label: "Hoàn công", icon: "task_alt", statuses: ["hoan_thanh"] },
];

function getStepIndex(status: TicketStatus): number {
  const idx = STEPS.findIndex(s => s.statuses.includes(status));
  return idx >= 0 ? idx : 0;
}

export default function TicketDetailModal({ ticketId, onClose, onCancelTicket, onShowAlert }: Props) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [patrol, setPatrol] = useState<PatrolLog | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [asBuilt, setAsBuilt] = useState<AsBuiltLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editable form states
  const [loaiXuLy, setLoaiXuLy] = useState<ProcessType | "">("");
  const [goM3, setGoM3] = useState(0);
  const [cuiSter, setCuiSter] = useState(0);
  const [anToan, setAnToan] = useState("");
  const [trongLai, setTrongLai] = useState(false);
  const [loaiTrongLai, setLoaiTrongLai] = useState("");
  const [lyDoKhong, setLyDoKhong] = useState("");
  // As-built
  const [goThucTe, setGoThucTe] = useState(0);
  const [cuiThucTe, setCuiThucTe] = useState(0);
  const [giaiTrinh, setGiaiTrinh] = useState("");
  const [lyDoTuChoi, setLyDoTuChoi] = useState("");

  useEffect(() => { fetchTicket(); }, [ticketId]);

  async function fetchTicket() {
    setLoading(true);
    try {
      const { data: t } = await supabase.from("tickets")
        .select("*, trees!inner(loai_cay, hieu_so_cay, ten_duong, phuong, quan)")
        .eq("id", ticketId).single();
      if (!t) return;
      const mapped: Ticket = {
        ...t, loai_cay: t.trees?.loai_cay, hieu_so_cay: t.trees?.hieu_so_cay,
        ten_duong: t.trees?.ten_duong, phuong: t.trees?.phuong,
        quan: t.trees?.quan,
      };
      setTicket(mapped);
      setLoaiXuLy(t.loai_xu_ly || "");

      if (t.patrol_log_id) {
        const { data: p } = await supabase.from("patrol_logs").select("*").eq("id", t.patrol_log_id).single();
        if (p) setPatrol({ ...p, tinh_trang: p.tinh_trang || [], hinh_anh: p.hinh_anh || [] });
      }
      const { data: pr } = await supabase.from("proposals").select("*").eq("ticket_id", ticketId).single();
      if (pr) {
        setProposal(pr);
        setGoM3(pr.the_tich_go_m3 || 0); setCuiSter(pr.cui_nhanh_ster || 0);
        setAnToan(pr.phuong_an_an_toan || ""); setTrongLai(pr.trong_lai || false);
        setLoaiTrongLai(pr.loai_cay_trong_lai || ""); setLyDoKhong(pr.ly_do_khong_trong || "");
      }
      const { data: ab } = await supabase.from("as_built_logs").select("*").eq("ticket_id", ticketId).single();
      if (ab) {
        setAsBuilt(ab);
        setGoThucTe(ab.the_tich_go_thuc_te || 0); setCuiThucTe(ab.cui_nhanh_thuc_te || 0);
        setGiaiTrinh(ab.giai_trinh_chenh_lech || "");
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // Hủy phiếu và trả sự cố về hàng đợi Tuần tra
  async function handleCancelTicket() {
    if (!ticket) return;
    setSaving(true); setError("");
    try {
      // 1. Reset patrol_log.ticket_id = null
      if (ticket.patrol_log_id) {
        await supabase.from("patrol_logs").update({ ticket_id: null }).eq("id", ticket.patrol_log_id);
      }
      // 2. Xóa proposal liên kết
      await supabase.from("proposals").delete().eq("ticket_id", ticket.id);
      // 3. Xóa ticket
      await supabase.from("tickets").delete().eq("id", ticket.id);
      // 4. Đóng modal và thông báo
      onCancelTicket?.();
      onClose();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  async function saveProposal() {
    if (!ticket || !proposal) return;
    setSaving(true); setError("");
    try {
      await supabase.from("proposals").update({
        phuong_an_xu_ly: loaiXuLy || null, the_tich_go_m3: goM3, cui_nhanh_ster: cuiSter,
        phuong_an_an_toan: anToan || null, trong_lai: trongLai,
        loai_cay_trong_lai: loaiTrongLai || null, ly_do_khong_trong: lyDoKhong || null,
      }).eq("id", proposal.id);
      await supabase.from("tickets").update({ loai_xu_ly: loaiXuLy || null }).eq("id", ticket.id);
      fetchTicket();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  async function updateStatus(newStatus: TicketStatus) {
    if (!ticket) return;
    setSaving(true); setError("");
    try {
      const updates: any = { trang_thai: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === "dang_thi_cong") updates.ngay_bat_dau_thi_cong = new Date().toISOString();
      if (newStatus === "hoan_thanh") updates.ngay_hoan_thanh = new Date().toISOString();
      if (newStatus === "tu_choi") updates.ly_do_tu_choi = lyDoTuChoi;
      if (newStatus === "da_duyet") updates.ngay_duyet = new Date().toISOString();
      await supabase.from("tickets").update(updates).eq("id", ticket.id);
      if (newStatus === "dang_thi_cong" && !asBuilt) {
        await supabase.from("as_built_logs").insert({ ticket_id: ticket.id });
      }
      fetchTicket();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  async function saveAsBuilt() {
    if (!asBuilt) return;
    setSaving(true); setError("");
    try {
      const deviation = goM3 > 0 ? Math.abs((goThucTe - goM3) / goM3 * 100) : 0;
      if (deviation > 10 && !giaiTrinh.trim()) {
        setError("Chênh lệch > 10%. Bắt buộc nhập giải trình."); setSaving(false); return;
      }
      await supabase.from("as_built_logs").update({
        the_tich_go_thuc_te: goThucTe, cui_nhanh_thuc_te: cuiThucTe, giai_trinh_chenh_lech: giaiTrinh || null,
      }).eq("id", asBuilt.id);
      fetchTicket();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div className="loader-spinner" style={{ margin: "0 auto 12px" }} />
      <p style={{ color: "#999", fontSize: 13 }}>Đang tải hồ sơ...</p>
    </div>
  );
  if (!ticket) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Không tìm thấy phiếu.</div>;

  const currentStep = getStepIndex(ticket.trang_thai);
  const st = TICKET_STATUS_MAP[ticket.trang_thai];
  const isLocked = ticket.trang_thai === "hoan_thanh";
  const deviation = goM3 > 0 ? Math.round(Math.abs((goThucTe - goM3) / goM3 * 100)) : 0;

  return (
    <div style={{ overflowY: "auto", maxHeight: "85vh" }}>
      {/* Header */}
      <div className="modal-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <i className="material-icons" style={{ fontSize: 24, color: st.color }}>{st.icon}</i>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>
              Phiếu đề xuất: {ticket.loai_cay} — {ticket.hieu_so_cay || "N/A"}
            </h2>
            <p style={{ fontSize: 12, color: "#999" }}>
              {ticket.ten_duong} · P.{ticket.phuong} · Q.{ticket.quan} · Mã: {ticket.id.substring(0, 8)}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="status-badge" style={{ background: st.bg, color: st.color, fontSize: 13, padding: "4px 12px" }}>
            <i className="material-icons" style={{ fontSize: 14 }}>{st.icon}</i> {st.label}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="modal-body">
        {error && (
          <div style={{ padding: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 4, marginBottom: 16, fontSize: 13, border: "1px solid #fee2e2" }}>
            <i className="material-icons" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 8 }}>error</i>{error}
          </div>
        )}

        {/* Timeline Steps */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#f9fafb", borderRadius: 4, padding: 16, border: "1px solid #eee" }}>
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                {i > 0 && <div style={{ position: "absolute", top: 16, left: -1, right: "50%", height: 3, background: done || active ? "#2563eb" : "#e0e0e0", zIndex: 0 }} />}
                {i < STEPS.length - 1 && <div style={{ position: "absolute", top: 16, left: "50%", right: -1, height: 3, background: done ? "#2563eb" : "#e0e0e0", zIndex: 0 }} />}
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "#2563eb" : active ? "white" : "#f0f0f0",
                  border: active ? "3px solid #2563eb" : "3px solid transparent",
                  color: done ? "white" : active ? "#2563eb" : "#bbb", zIndex: 1, transition: "all 0.3s",
                }}>
                  <i className="material-icons" style={{ fontSize: 18 }}>{done ? "check" : step.icon}</i>
                </div>
                <span style={{ fontSize: 11, marginTop: 6, fontWeight: active ? 600 : 400, color: active ? "#2563eb" : done ? "#333" : "#999" }}>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* LEFT: Patrol Info (Read-only) */}
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="material-icons" style={{ fontSize: 18, color: "#2563eb" }}>directions_walk</i>
              Thông tin Tuần tra (Bước 1)
            </h4>
            {patrol ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <InfoRow label="Ngày ghi nhận" value={new Date(patrol.created_at).toLocaleString("vi-VN")} />
                <InfoRow label="Người tuần tra" value={patrol.nguoi_tuan_tra || "—"} />
                <InfoRow label="Mức độ" value={URGENCY_MAP[patrol.muc_do_khan_cap]?.label || "—"} />
                <div style={{ padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Tình trạng</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {(patrol.tinh_trang || []).map(t => (
                      <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "#fef3c7", color: "#92400e", borderRadius: 3 }}>
                        {FIELD_CONDITION_MAP[t] || t}
                      </span>
                    ))}
                    {(!patrol.tinh_trang || patrol.tinh_trang.length === 0) && <span style={{ color: "#ccc" }}>—</span>}
                  </div>
                </div>
                {patrol.mo_ta && <InfoRow label="Mô tả" value={patrol.mo_ta} />}
              </div>
            ) : <p style={{ color: "#ccc", fontSize: 13, fontStyle: "italic" }}>Không có dữ liệu tuần tra liên kết.</p>}
          </div>

          {/* RIGHT: Proposal Form (Bước 2) */}
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="material-icons" style={{ fontSize: 18, color: "#d97706" }}>description</i>
              Đề xuất xử lý (Bước 2)
            </h4>
            <div className="form-group">
              <label>Phương án xử lý</label>
              <select className="form-input" value={loaiXuLy} onChange={e => setLoaiXuLy(e.target.value as ProcessType)} disabled={isLocked}>
                <option value="">— Chọn phương án —</option>
                {Object.entries(PROCESS_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Gỗ dự kiến (m³)</label>
                <input className="form-input" type="number" step="0.1" value={goM3} onChange={e => setGoM3(+e.target.value)} disabled={isLocked} />
              </div>
              <div className="form-group">
                <label>Củi/Nhánh (Ster)</label>
                <input className="form-input" type="number" step="0.1" value={cuiSter} onChange={e => setCuiSter(+e.target.value)} disabled={isLocked} />
              </div>
            </div>
            <div className="form-group">
              <label>Phương án an toàn</label>
              <input className="form-input" placeholder="Rào chắn, xe cẩu, giờ thi công..." value={anToan} onChange={e => setAnToan(e.target.value)} disabled={isLocked} />
            </div>
            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={trongLai} onChange={e => setTrongLai(e.target.checked)} disabled={isLocked} /> Trồng lại
              </label>
              {trongLai ? (
                <input className="form-input" style={{ marginTop: 8 }} placeholder="Loài cây trồng lại, quy cách..." value={loaiTrongLai} onChange={e => setLoaiTrongLai(e.target.value)} disabled={isLocked} />
              ) : (
                <input className="form-input" style={{ marginTop: 8 }} placeholder="Lý do không trồng lại (vướng hạ tầng...)" value={lyDoKhong} onChange={e => setLyDoKhong(e.target.value)} disabled={isLocked} />
              )}
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
              <WorkflowNavigator
                status={ticket.trang_thai}
                saving={saving}
                lyDoTuChoi={lyDoTuChoi}
                setLyDoTuChoi={setLyDoTuChoi}
                onError={setError}
                onUpdate={updateStatus}
                onCancelTicket={handleCancelTicket}
                onShowAlert={onShowAlert}
                saveButton={
                  !isLocked && (
                    <button className="btn-primary" style={{ flex: 1, height: 42 }} onClick={saveProposal} disabled={saving}>
                      <i className="material-icons" style={{ fontSize: 18 }}>save</i> {saving ? "Đang lưu..." : "Lưu đề xuất"}
                    </button>
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* As-Built Section (Bước 4) */}
        {(currentStep >= 3 || asBuilt) && (
          <div className="card" style={{ padding: 16, marginTop: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="material-icons" style={{ fontSize: 18, color: "#16a34a" }}>task_alt</i>
              Hoàn công — Chốt khối lượng (Bước 4)
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label>Gỗ thực tế (m³)</label>
                <input className="form-input" type="number" step="0.1" value={goThucTe} onChange={e => setGoThucTe(+e.target.value)} disabled={isLocked} />
              </div>
              <div className="form-group">
                <label>Củi/Nhánh thực tế (Ster)</label>
                <input className="form-input" type="number" step="0.1" value={cuiThucTe} onChange={e => setCuiThucTe(+e.target.value)} disabled={isLocked} />
              </div>
              <div className="form-group">
                <label>Chênh lệch</label>
                <div style={{
                  padding: "9px 12px", borderRadius: 4, fontSize: 14, fontWeight: 600, textAlign: "center",
                  background: deviation > 10 ? "#fee2e2" : "#dcfce7", color: deviation > 10 ? "#dc2626" : "#16a34a",
                  border: deviation > 10 ? "1px solid #fca5a5" : "1px solid #bbf7d0",
                }}>
                  {deviation}%
                  {deviation > 10 && <i className="material-icons" style={{ fontSize: 16, marginLeft: 4, verticalAlign: "middle" }}>warning</i>}
                </div>
              </div>
            </div>
            {deviation > 10 && (
              <div className="form-group">
                <label style={{ color: "#dc2626" }}>⚠ Giải trình chênh lệch (bắt buộc)</label>
                <textarea className="form-input" rows={3} placeholder="Nhập lý do chênh lệch khối lượng..." value={giaiTrinh} onChange={e => setGiaiTrinh(e.target.value)} disabled={isLocked}
                  style={{ resize: "vertical" }} />
              </div>
            )}
            {!isLocked && asBuilt && (
              <div style={{ marginTop: 20 }}>
                <WorkflowNavigator
                  status={ticket.trang_thai}
                  saving={saving}
                  lyDoTuChoi={lyDoTuChoi}
                  setLyDoTuChoi={setLyDoTuChoi}
                  onError={setError}
                  onUpdate={updateStatus}
                  onCancelTicket={handleCancelTicket}
                  onShowAlert={onShowAlert}
                  saveButton={
                    <button className="btn-primary" style={{ flex: 1, height: 42 }} onClick={saveAsBuilt} disabled={saving}>
                      <i className="material-icons" style={{ fontSize: 18 }}>save</i> {saving ? "Đang lưu..." : "Lưu hoàn công"}
                    </button>
                  }
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}>
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#333", textAlign: "right", maxWidth: "60%" }}>{value || "—"}</span>
    </div>
  );
}

// ========================================
// WORKFLOW NAVIGATOR — Điều hướng 5 bước
// ========================================
interface WorkflowNavProps {
  status: TicketStatus;
  saving: boolean;
  lyDoTuChoi: string;
  setLyDoTuChoi: (v: string) => void;
  onError: (msg: string) => void;
  onUpdate: (status: TicketStatus) => void;
  onCancelTicket?: () => void;
  onShowAlert?: (config: any) => void;
  saveButton?: React.ReactNode;
}

const WORKFLOW_FLOW: { from: TicketStatus; prev?: TicketStatus; next?: TicketStatus; nextLabel: string; prevLabel: string; nextColor?: string; isCancelAction?: boolean }[] = [
  { from: "moi",          prev: undefined,         next: "cho_duyet",      prevLabel: "Trả về Tuần tra",  nextLabel: "Trình phê duyệt",    nextColor: "#2563eb", isCancelAction: true },
  { from: "cho_duyet",    prev: "moi",             next: "da_duyet",       prevLabel: "Trả lại Đề xuất", nextLabel: "Xác nhận duyệt",     nextColor: "#059669" },
  { from: "da_duyet",     prev: "cho_duyet",       next: "dang_thi_cong",  prevLabel: "Trả lại Phê duyệt", nextLabel: "Bắt đầu Xử lý",   nextColor: "#7c3aed" },
  { from: "dang_thi_cong",prev: "da_duyet",        next: "hoan_thanh",     prevLabel: "Trả lại Xử lý",   nextLabel: "Hoàn công ✓",          nextColor: "#16a34a" },
  { from: "hoan_thanh",   prev: undefined,         next: undefined,        prevLabel: "",                   nextLabel: "" },
  { from: "tu_choi",      prev: undefined,         next: "moi",            prevLabel: "",                   nextLabel: "Khởi tạo lại",       nextColor: "#666" },
];

function WorkflowNavigator({ status, saving, lyDoTuChoi, setLyDoTuChoi, onError, onUpdate, onCancelTicket, onShowAlert, saveButton }: WorkflowNavProps) {
  const flow = WORKFLOW_FLOW.find(f => f.from === status);
  if (!flow) return null;

  const isApprovalStep = status === "cho_duyet";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      {/* Phần nhập lý do từ chối (nếu cần) - Luôn hiện ở trên hàng nút */}
      {isApprovalStep && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fef2f2", padding: 12, borderRadius: 8, border: "1px solid #fee2e2" }}>
          <input
            className="form-input"
            placeholder="Lý do từ chối (nếu không duyệt)..."
            value={lyDoTuChoi}
            onChange={e => setLyDoTuChoi(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => {
              if (!lyDoTuChoi.trim()) { onError("Vui lòng nhập lý do từ chối."); return; }
              onUpdate("tu_choi");
            }}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
              borderRadius: 8, border: "none", background: "#ef4444",
              color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            <i className="material-icons" style={{ fontSize: 16 }}>thumb_down</i> Từ chối
          </button>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        {/* Nút TRẢ LẠI / HỦY PHIẾU */}
        <div style={{ flex: 1 }}>
          {flow.prev || flow.isCancelAction ? (
            <button
              onClick={() => {
                if (flow.isCancelAction) {
                  if (onShowAlert) {
                    onShowAlert({
                      type: "question",
                      title: "Xác nhận hủy phiếu",
                      message: "Bạn có chắc chắn muốn hủy phiếu đề xuất này và trả sự cố về bước Tuần tra?",
                      confirmText: "Hủy phiếu",
                      showCancel: true,
                      onConfirm: () => onCancelTicket?.()
                    });
                  } else if (window.confirm("Bạn có chắc chắn muốn hủy phiếu đề xuất này và trả sự cố về bước Tuần tra?")) {
                    onCancelTicket?.();
                  }
                } else {
                  onUpdate(flow.prev!);
                }
              }}
              disabled={saving}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px",
                borderRadius: 8, border: "1px solid #cbd5e1", background: "white",
                color: flow.isCancelAction ? "#ef4444" : "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => e.currentTarget.style.background = flow.isCancelAction ? "#fef2f2" : "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}
            >
              <i className="material-icons" style={{ fontSize: 18 }}>arrow_back</i>
              {flow.prevLabel}
            </button>
          ) : <div />}
        </div>

        {/* Nút LƯU (Chèn ở giữa) */}
        {saveButton}

        {/* Nút CHUYỂN TIẾP */}
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          {flow.next ? (
            <button
              onClick={() => onUpdate(flow.next!)}
              disabled={saving}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px",
                borderRadius: 8, border: "none",
                background: flow.nextColor || "#2563eb",
                color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap",
                boxShadow: `0 4px 12px ${flow.nextColor || "#2563eb"}44`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 16px ${flow.nextColor || "#2563eb"}55`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 12px ${flow.nextColor || "#2563eb"}44`; }}
            >
              {flow.nextLabel}
              <i className="material-icons" style={{ fontSize: 18 }}>arrow_forward</i>
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
