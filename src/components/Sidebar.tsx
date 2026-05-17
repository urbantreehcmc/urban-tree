"use client";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  stats?: {
    total?: number;
    khoe?: number;
    sau_benh?: number;
    can_don_ha?: number;
    moi?: number;
  } | null;
}

const TAB_LABELS: Record<string, string> = {
  map: "Bản đồ GIS",
  dashboard: "Tổng quan",
  trees: "Quản lý Cây xanh",
  parks: "Công viên & Mảng xanh",
  tasks: "Phiếu đề xuất & Sự cố",
  wards: "Quản lý Địa bàn",
  species: "Danh mục Loài cây",
  contracts: "Gói thầu bảo trì",
  contractors: "Đơn vị thực hiện",
  users: "Hệ thống người dùng",
};

const MAIN_NAV = [
  { id: "map", label: TAB_LABELS.map, icon: "map" },
  { id: "dashboard", label: TAB_LABELS.dashboard, icon: "dashboard" },
  { id: "trees", label: TAB_LABELS.trees, icon: "park" },
  { id: "parks", label: TAB_LABELS.parks, icon: "nature" },
  { id: "tasks", label: TAB_LABELS.tasks, icon: "assignment" },
];

const CONFIG_NAV = [
  { id: "species", label: TAB_LABELS.species, icon: "eco" },
  { id: "wards", label: TAB_LABELS.wards, icon: "location_city" },
  { id: "contracts", label: TAB_LABELS.contracts, icon: "description" },
  { id: "contractors", label: TAB_LABELS.contractors, icon: "business" },
  { id: "users", label: TAB_LABELS.users, icon: "people" },
];


export default function Sidebar({ activeTab, onTabChange, collapsed, stats }: SidebarProps) {
  const getBadge = (id: string) => {
    if (!stats) return null;
    switch (id) {
      case "trees": return stats.total ? stats.total.toLocaleString() : null;
      default: return null;
    }
  };

  return (
    <>
      {/* Main Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Điều hướng</div>
        {MAIN_NAV.map((item) => {
          const badge = getBadge(item.id);
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <i className="material-icons">{item.icon}</i>
              <span className="sidebar-label">{item.label}</span>
              {badge && <span className="sidebar-badge">{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* Config Navigation */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Quản lý</div>
        {CONFIG_NAV.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onTabChange(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <i className="material-icons">{item.icon}</i>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid #eee" }}>
        <p className="sidebar-label" style={{ fontSize: 11, color: "#bbb", textAlign: "center" }}>
          © 2026 UrbanTree GIS v2.1
        </p>
      </div>
    </>
  );
}
