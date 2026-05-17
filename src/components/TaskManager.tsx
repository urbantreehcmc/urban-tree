"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  PatrolLog, Ticket, TicketStatus,
  TICKET_STATUS_MAP, URGENCY_MAP, FIELD_CONDITION_MAP, PROCESS_TYPE_MAP,
} from "@/lib/types/ticket";

interface TaskManagerProps {
  onOpenTicket?: (ticketId: string) => void;
  onShowAlert?: (config: {
    type: "success" | "error" | "warning" | "info" | "question";
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
  }) => void;
  showMode?: "all" | "patrol" | "tickets";
}

type WorkflowTab = "patrol" | "de_xuat" | "phe_duyet" | "tiep_nhan" | "xu_ly" | "hoan_cong";

const TABS_CONFIG: Record<WorkflowTab, { label: string; icon: string; color: string; statuses?: TicketStatus[] }> = {
  patrol:     { label: "Tuần tra",       icon: "directions_walk", color: "#2563eb" },
  de_xuat:    { label: "Phiếu đề xuất",  icon: "description",     color: "#d97706", statuses: ["moi"] },
  phe_duyet:  { label: "Phê duyệt",       icon: "verified",        color: "#7c3aed", statuses: ["cho_duyet", "tu_choi"] },
  tiep_nhan:  { label: "Sự cố - Tiếp nhận", icon: "report_problem", color: "#d97706", statuses: ["moi", "cho_duyet", "tu_choi"] },
  xu_ly:      { label: "Xử lý",           icon: "engineering",     color: "#0891b2", statuses: ["da_duyet", "dang_thi_cong"] },
  hoan_cong:  { label: "Hoàn công",       icon: "task_alt",        color: "#16a34a", statuses: ["hoan_thanh"] },
};

export default function TaskManager({ onOpenTicket, onShowAlert, showMode = "all" }: TaskManagerProps) {
  const [activeTab, setActiveTab] = useState<WorkflowTab>(showMode === "tickets" ? "tiep_nhan" : "patrol");
  const [patrols, setPatrols] = useState<PatrolLog[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<WorkflowTab, number>>({
    patrol: 0, de_xuat: 0, phe_duyet: 0, tiep_nhan: 0, xu_ly: 0, hoan_cong: 0,
  });

  const visibleTabs = showMode === "tickets" 
    ? ["tiep_nhan", "xu_ly", "hoan_cong"].map(id => ({ id: id as WorkflowTab, ...TABS_CONFIG[id as WorkflowTab] }))
    : ["patrol", "de_xuat", "phe_duyet", "xu_ly", "hoan_cong"].map(id => ({ id: id as WorkflowTab, ...TABS_CONFIG[id as WorkflowTab] }));

  useEffect(() => { fetchData(); }, [activeTab]);
  useEffect(() => { fetchCounts(); }, []);
  
  // Auto-refresh counts khi user quay lại tab
  useEffect(() => {
    const handleFocus = () => fetchCounts();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function fetchCounts() {
    try {
      const { count: patrolCount } = await supabase.from("patrol_logs").select("*", { count: "exact", head: true }).is("ticket_id", null);
      const { data: ticketGroups } = await supabase.from("tickets").select("trang_thai");
      const grp = ticketGroups || [];
      setCounts({
        patrol:     patrolCount || 0,
        de_xuat:    grp.filter(r => r.trang_thai === "moi").length,
        phe_duyet:  grp.filter(r => ["cho_duyet", "tu_choi"].includes(r.trang_thai)).length,
        tiep_nhan:  grp.filter(r => ["moi", "cho_duyet", "tu_choi"].includes(r.trang_thai)).length,
        xu_ly:      grp.filter(r => ["da_duyet", "dang_thi_cong"].includes(r.trang_thai)).length,
        hoan_cong:  grp.filter(r => r.trang_thai === "hoan_thanh").length,
      });
    } catch (e) { console.error(e); }
  }

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === "patrol") {
        const { data } = await supabase
          .from("patrol_logs")
          .select("*, trees!inner(loai_cay, hieu_so_cay, ten_duong, phuong, quan)")
          .is("ticket_id", null)
          .order("created_at", { ascending: false });
        setPatrols((data || []).map((r: any) => ({
          ...r,
          tinh_trang: r.tinh_trang || [],
          hinh_anh: r.hinh_anh || [],
          loai_cay: r.trees?.loai_cay,
          hieu_so_cay: r.trees?.hieu_so_cay,
          ten_duong: r.trees?.ten_duong,
          phuong: r.trees?.phuong,
          quan: r.trees?.quan,
        })));
      } else {
        const tabDef = TABS_CONFIG[activeTab];
        const statuses = tabDef?.statuses || [];
        const { data } = await supabase
          .from("tickets")
          .select("*, trees!inner(loai_cay, hieu_so_cay, ten_duong, phuong, quan)")
          .in("trang_thai", statuses)
          .order("created_at", { ascending: false });
        setTickets((data || []).map((r: any) => ({
          ...r,
          loai_cay: r.trees?.loai_cay,
          hieu_so_cay: r.trees?.hieu_so_cay,
          ten_duong: r.trees?.ten_duong,
          phuong: r.trees?.phuong,
          quan: r.trees?.quan,
        })));
      }
    } catch (err) {
      console.error("Lỗi fetch:", err);
    } finally {
      setLoading(false);
      fetchCounts(); // Auto-refresh counts sau mỗi lần fetch data
    }
  }

  async function handleCreateTicket(patrol: PatrolLog) {
    if (!onShowAlert) return;
    onShowAlert({
      type: "question",
      title: "Xác nhận lập phiếu",
      message: `Bạn có chắc chắn muốn tạo Phiếu đề xuất xử lý cho cây "${patrol.loai_cay}" tại ${patrol.ten_duong}?`,
      confirmText: "Lập phiếu ngay",
      showCancel: true,
      onConfirm: async () => {
        try {
          const { data: ticket, error } = await supabase
            .from("tickets")
            .insert({ tree_id: patrol.tree_id, patrol_log_id: patrol.id, trang_thai: "moi" })
            .select().single();
          if (error) throw error;
          await supabase.from("patrol_logs").update({ ticket_id: ticket.id }).eq("id", patrol.id);
          await supabase.from("proposals").insert({ ticket_id: ticket.id });
          fetchData();
          fetchCounts();
          if (onOpenTicket) onOpenTicket(ticket.id);
        } catch (err: any) {
          onShowAlert({ type: "error", title: "Lỗi hệ thống", message: err.message });
        }
      },
    });
  }

  const filteredTickets = tickets.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.loai_cay?.toLowerCase().includes(q) || t.ten_duong?.toLowerCase().includes(q) || t.id.includes(q);
  });

  return (
    <div style={{ height: "100%", overflow: "auto", background: "#f5f7fa" }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#333" }}>
              {showMode === "patrol" ? "Nhật ký Tuần tra & Ghi nhận" : showMode === "tickets" ? "Quy trình Xử lý Sự cố" : "Quản lý Sự cố & Xử lý"}
            </h2>
            <p style={{ fontSize: 13, color: "#999", marginTop: 2 }}>
              {showMode === "patrol" ? "Quy trình 5 bước: Tuần tra → Phiếu đề xuất → Phê duyệt → Xử lý → Hoàn công" : showMode === "tickets" ? "Quy trình 3 bước: Sự cố - Tiếp nhận → Xử lý → Hoàn công" : "Quy trình 5 bước: Tuần tra → Phiếu đề xuất → Phê duyệt → Xử lý → Hoàn công"}
            </p>
          </div>
          <button className="btn-primary" onClick={() => { fetchData(); fetchCounts(); }}>
            <i className="material-icons" style={{ fontSize: 18 }}>refresh</i> Làm mới
          </button>
        </div>

        {/* === Workflow Bar (Chỉ hiển thị khi có nhiều hơn 1 tab) === */}
        {visibleTabs.length > 1 && (
          <div style={{ display: "flex", background: "white", borderRadius: 12, padding: 6, border: "1px solid #e0e0e0", gap: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {visibleTabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const count = counts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                  style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 4, padding: "12px 8px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.2s",
                    background: isActive ? tab.color : "transparent",
                    color: isActive ? "white" : "#666",
                    position: "relative",
                  }}
                >
                  {/* Step connector arrow */}
                  {idx < visibleTabs.length - 1 && (
                    <div style={{
                      position: "absolute", right: -6, top: "50%",
                      width: 12, height: 12, zIndex: 2,
                      borderTop: "2px solid #ddd", borderRight: "2px solid #ddd",
                      transform: "translateY(-50%) rotate(45deg)",
                    }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="material-icons" style={{ fontSize: 18 }}>{tab.icon}</i>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{tab.label}</span>
                  </div>
                  {count > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10,
                      background: isActive ? "rgba(255,255,255,0.3)" : tab.color,
                      color: isActive ? "white" : "white",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* === CONTENT === */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div className="loader-spinner" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#999", fontSize: 13 }}>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* === TAB: TUẦN TRA === */}
            {activeTab === "patrol" && (
              <div className="card">
                <div className="card-header-bar">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <i className="material-icons" style={{ fontSize: 20, color: "#2563eb" }}>directions_walk</i>
                    <span style={{ fontWeight: 600, color: "#333" }}>Sự cố ghi nhận — chờ lập phiếu đề xuất</span>
                    <span style={{ fontSize: 12, color: "#999" }}>({patrols.length} mục)</span>
                  </div>
                </div>
                {patrols.length === 0 ? (
                  <div style={{ padding: 60, textAlign: "center" }}>
                    <i className="material-icons" style={{ fontSize: 48, color: "#ddd", marginBottom: 12 }}>check_circle</i>
                    <p style={{ color: "#999", fontSize: 14 }}>Tất cả sự cố đã được lập phiếu.</p>
                    <p style={{ color: "#bbb", fontSize: 12, marginTop: 4 }}>Sự cố mới sẽ xuất hiện tại đây khi được ghi nhận từ hiện trường.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Loài cây</th>
                        <th>Địa điểm</th>
                        <th>Mức độ</th>
                        <th>Tình trạng</th>
                        <th>Người tuần tra</th>
                        <th style={{ textAlign: "center" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patrols.map(p => {
                        const urgency = URGENCY_MAP[p.muc_do_khan_cap] || URGENCY_MAP.thuong;
                        return (
                          <tr key={p.id}>
                            <td style={{ whiteSpace: "nowrap", fontWeight: 500 }}>{new Date(p.created_at).toLocaleDateString("vi-VN")}</td>
                            <td style={{ color: "#2563eb", fontWeight: 600 }}>{p.loai_cay || "—"}</td>
                            <td>{p.ten_duong || "—"}<br /><span style={{ fontSize: 11, color: "#999" }}>P.{p.phuong} Q.{p.quan}</span></td>
                            <td><span className="status-badge" style={{ background: urgency.bg, color: urgency.color }}>{urgency.label}</span></td>
                            <td style={{ maxWidth: 200 }}>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {(p.tinh_trang || []).slice(0, 3).map(t => (
                                  <span key={t} style={{ fontSize: 11, padding: "2px 6px", background: "#f5f5f5", borderRadius: 3, color: "#666" }}>
                                    {FIELD_CONDITION_MAP[t] || t}
                                  </span>
                                ))}
                                {(p.tinh_trang || []).length > 3 && <span style={{ fontSize: 11, color: "#999" }}>+{p.tinh_trang.length - 3}</span>}
                              </div>
                            </td>
                            <td style={{ color: "#666" }}>{p.nguoi_tuan_tra || "—"}</td>
                            <td style={{ textAlign: "center" }}>
                              <button className="btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => handleCreateTicket(p)}>
                                <i className="material-icons" style={{ fontSize: 16 }}>add_task</i> Lập phiếu
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* === CÁC TAB TICKET === */}
            {activeTab !== "patrol" && (
              <div className="card">
                <div className="card-header-bar">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: "relative" }}>
                      <i className="material-icons" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#bbb" }}>search</i>
                      <input type="text" placeholder="Tìm kiếm loài cây, địa điểm..." className="form-input"
                        style={{ width: 260, paddingLeft: 36 }}
                        value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: "#999" }}>{filteredTickets.length} phiếu</span>
                </div>

                {filteredTickets.length === 0 ? (
                  <div style={{ padding: 60, textAlign: "center" }}>
                    <i className="material-icons" style={{ fontSize: 48, color: "#ddd", marginBottom: 12 }}>inbox</i>
                    <p style={{ color: "#999", fontSize: 14 }}>Không có phiếu nào trong giai đoạn này.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã phiếu</th>
                        <th>Loài cây</th>
                        <th>Địa điểm</th>
                        <th>Loại xử lý</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th style={{ textAlign: "center" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map(t => {
                        const st = TICKET_STATUS_MAP[t.trang_thai] || TICKET_STATUS_MAP.moi;
                        return (
                          <tr key={t.id}>
                            <td style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>{t.id.substring(0, 8)}…</td>
                            <td style={{ color: "#2563eb", fontWeight: 600 }}>{t.loai_cay || "—"}</td>
                            <td>{t.ten_duong || "—"}<br /><span style={{ fontSize: 11, color: "#999" }}>P.{t.phuong} Q.{t.quan}</span></td>
                            <td style={{ fontSize: 13 }}>
                              {t.loai_xu_ly ? PROCESS_TYPE_MAP[t.loai_xu_ly] : <span style={{ color: "#ccc" }}>Chưa xác định</span>}
                            </td>
                            <td>
                              <span className="status-badge" style={{ background: st.bg, color: st.color }}>
                                <i className="material-icons" style={{ fontSize: 14 }}>{st.icon}</i> {st.label}
                              </span>
                            </td>
                            <td style={{ whiteSpace: "nowrap", color: "#666" }}>{new Date(t.created_at).toLocaleDateString("vi-VN")}</td>
                            <td style={{ textAlign: "center" }}>
                              <button className="btn-secondary" style={{ padding: "5px 12px", fontSize: 12 }}
                                onClick={() => onOpenTicket?.(t.id)}>
                                <i className="material-icons" style={{ fontSize: 16 }}>open_in_new</i> Mở phiếu
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
