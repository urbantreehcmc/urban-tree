import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import type { TreeRecord } from "@/lib/types";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import { supabase } from "@/lib/supabase";
import { PatrolLog, URGENCY_MAP, FIELD_CONDITION_MAP } from "@/lib/types/ticket";

interface DashboardProps {
  trees?: any[];
}

const STATUS_COLORS = {
  khoe: "#22c55e",
  sauBenh: "#f59e0b",
  canDonHa: "#ef4444",
  moi: "#3b82f6",
  dangXuLy: "#a855f7",
};

export default function Dashboard({ trees }: DashboardProps) {
  const { stats, loading } = useDashboardStats();
  const [patrolLogs, setPatrolLogs] = React.useState<PatrolLog[]>([]);
  const [loadingPatrols, setLoadingPatrols] = React.useState(true);

  React.useEffect(() => {
    async function fetchPatrols() {
      try {
        const { data } = await supabase
          .from("patrol_logs")
          .select("*, trees(loai_cay, hieu_so_cay, ten_duong, phuong, quan)")
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (data) {
          setPatrolLogs(data.map((r: any) => ({
            ...r,
            loai_cay: r.trees?.loai_cay,
            hieu_so_cay: r.trees?.hieu_so_cay,
            ten_duong: r.trees?.ten_duong,
            phuong: r.trees?.phuong,
            quan: r.trees?.quan,
          })));
        }
      } catch (err) {
        console.error("Lỗi fetch patrols:", err);
      } finally {
        setLoadingPatrols(false);
      }
    }
    fetchPatrols();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loader-spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: 13, color: "#999", fontWeight: 500 }}>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  const topSpecies = stats.top_species || [];

  const progressData = [
    { name: "T1", value: 120 },
    { name: "T2", value: 210 },
    { name: "T3", value: 450 },
    { name: "T4", value: 380 },
    { name: "T5", value: 520 },
    { name: "T6", value: 680 },
  ];

  const primaryKpis = [
    { label: "Tổng dự án cây", value: stats.total, icon: "grid_view", color: "#2563eb", bg: "#eff4ff" },
    { label: "Mới trồng", value: stats.mt, icon: "add_circle", color: "#6366f1", bg: "#eef2ff" },
    { label: "Loại 1 (L1)", value: stats.l1, icon: "filter_1", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Loại 2 (L2)", value: stats.l2, icon: "filter_2", color: "#0891b2", bg: "#ecfeff" },
    { label: "Loại 3 (L3)", value: stats.l3, icon: "filter_3", color: "#dc2626", bg: "#fef2f2" },
  ];

  const secondaryKpis = [
    { label: "Ngưng quản lý (Lưu trữ)", value: stats.ngung_quan_ly, icon: "archive", color: "#64748b", bg: "#f8fafc" },
  ];



  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#333", marginBottom: 4 }}>Tổng quan Dự án</h2>
          <p style={{ fontSize: 13, color: "#999" }}>Hệ thống quản lý dữ liệu cây xanh và hạ tầng kỹ thuật đô thị</p>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {primaryKpis.map((card) => (
            <div key={card.label} className="card" style={{ padding: 16, border: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
                  <i className="material-icons" style={{ fontSize: 20 }}>{card.icon}</i>
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{card.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: "#333", lineHeight: 1 }}>{(card.value ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary KPI Cards (Archive/Stop Management) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {secondaryKpis.map((card) => (
            <div key={card.label} className="card" style={{ padding: "12px 20px", background: "#fcfcfc", border: "1px dashed #e0e0e0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ color: card.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="material-icons" style={{ fontSize: 20 }}>{card.icon}</i>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#666" }}>{card.label}:</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#444" }}>{(card.value ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Recent Patrol Logs Table */}
            <div className="card" style={{ overflowX: "auto" }}>
              <div className="card-header-bar">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="material-icons" style={{ fontSize: 20, color: "#d97706" }}>report_problem</i>
                  <span style={{ fontWeight: 500, color: "#333" }}>Sự cố mới ghi nhận (Tuần tra)</span>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Cây & Số hiệu</th>
                    <th>Địa điểm</th>
                    <th>Tình trạng</th>
                    <th>Mức độ</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPatrols ? (
                    <tr><td colSpan={5} style={{ padding: 32, textAlign: "center" }}><div className="loader-spinner" style={{ margin: "0 auto" }} /></td></tr>
                  ) : patrolLogs.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#999", fontStyle: "italic" }}>Chưa có dữ liệu tuần tra</td></tr>
                  ) : (
                    patrolLogs.map((log) => {
                      const urgency = URGENCY_MAP[log.muc_do_khan_cap] || URGENCY_MAP.thuong;
                      return (
                        <tr key={log.id}>
                          <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>{new Date(log.created_at).toLocaleDateString("vi-VN")}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: "#2563eb" }}>{log.loai_cay}</div>
                            <div style={{ fontSize: 11, color: "#999" }}>Số hiệu: {log.hieu_so_cay || "N/A"}</div>
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {log.ten_duong}<br/>
                            <span style={{ color: "#999" }}>P.{log.phuong}, Q.{log.quan}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {(log.tinh_trang || []).slice(0, 2).map((t: any) => (
                                <span key={t} style={{ fontSize: 10, padding: "2px 6px", background: "#f5f5f5", borderRadius: 3, color: "#666" }}>
                                  {FIELD_CONDITION_MAP[t as keyof typeof FIELD_CONDITION_MAP] || t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className="status-badge" style={{ background: urgency.bg, color: urgency.color, fontSize: 11 }}>{urgency.label}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Recent Trees Table */}
            <div className="card" style={{ overflowX: "auto" }}>
              <div className="card-header-bar">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="material-icons" style={{ fontSize: 20, color: "#2563eb" }}>list_alt</i>
                  <span style={{ fontWeight: 500, color: "#333" }}>Cây xanh mới cập nhật (Tài sản)</span>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Loài & Số hiệu</th>
                    <th>Địa điểm</th>
                    <th style={{ textAlign: "center" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} style={{ padding: "40px 16px", textAlign: "center", color: "#bbb", fontStyle: "italic" }}>
                      Hệ thống đang đồng bộ dữ liệu tài sản mới nhất...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Area Chart */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="material-icons" style={{ fontSize: 20, color: "#7e3af2" }}>trending_up</i>
                  <div>
                    <div style={{ fontWeight: 500, color: "#333" }}>Biểu đồ trồng mới 2026</div>
                    <div style={{ fontSize: 12, color: "#999" }}>Thống kê số lượng cây trồng mới theo thời gian</div>
                  </div>
                </div>
              </div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#999" }} dy={8} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #eee', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }} />
                    <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Health Stats */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 20 }}>Sức khỏe cây xanh</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { name: "Khỏe mạnh", value: stats.khoe ?? 0, color: STATUS_COLORS.khoe },
                  { name: "Sâu bệnh", value: stats.sau_benh ?? 0, color: STATUS_COLORS.sauBenh },
                  { name: "Cần đốn hạ", value: stats.can_don_ha ?? 0, color: STATUS_COLORS.canDonHa },

                  { name: "Mới trồng", value: stats.moi ?? 0, color: STATUS_COLORS.moi },
                  { name: "Ngưng quản lý", value: stats.ngung_quan_ly ?? 0, color: "#94a3b8" },

                ].map((s) => (

                  <div key={s.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{s.value.toLocaleString()}</span>
                    </div>
                    <div style={{ width: "100%", background: "#f0f0f0", borderRadius: 2, height: 6, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, backgroundColor: s.color, width: `${Math.max((s.value / stats.total) * 100, 1)}%`, transition: "width 0.8s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Species Chart */}
            <div className="card" style={{ padding: 20, flex: 1 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 20 }}>Phân bổ loài cây phổ biến</h4>
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSpecies} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                    <Tooltip cursor={{ fill: '#f9f9f9' }} contentStyle={{ background: '#fff', borderRadius: 4, border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
                      {topSpecies.map((_: any, i: number) => (
                        <Cell key={i} fill={i === 0 ? "#2563eb" : "#94a3b8"} opacity={1 - i * 0.06} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
