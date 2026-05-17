"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import TreeTable from "@/components/TreeTable";
import ParkManager from "@/components/ParkManager";
import TaskManager from "@/components/TaskManager";
import UserManager from "@/components/UserManager";
import ContractManager from "@/components/ContractManager";
import ContractorManager from "@/components/ContractorManager";
import WardTable from "@/components/WardTable";
import SpeciesManagement from "@/components/SpeciesManagement";
import TreeDetail from "@/components/TreeDetail";
import TicketDetailModal from "@/components/TicketDetailModal";
import PatrolFormModal from "@/components/PatrolFormModal";
import Notification, { NotificationType } from "@/components/Notification";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import { useTreeById } from "@/lib/hooks/useTreeById";
import { TreeRecord } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
      <div style={{ textAlign: "center" }}>
        <div className="loader-spinner" style={{ margin: "0 auto 12px" }} />
        <p style={{ fontSize: 13, color: "#999" }}>Đang khởi tạo bản đồ GIS...</p>
      </div>
    </div>
  ),
});

const TAB_LABELS: Record<string, string> = {
  map: "Bản đồ GIS",
  dashboard: "Tổng quan Hệ thống",
  trees: "Cây xanh",
  parks: "Công viên",
  greenAreas: "Mảng xanh",
  patrol: "Tuần tra",
  tasks: "Sự cố",
  spatial: "Phân tích GIS",
  species: "Loài cây",
  wards: "Phường xã",
  contracts: "Gói thầu",
  contractors: "Nhà thầu",
  users: "Người dùng",
};

const TAB_ICONS: Record<string, string> = {
  map: "map",
  dashboard: "dashboard",
  trees: "park",
  parks: "nature",
  greenAreas: "forest",
  patrol: "directions_walk",
  tasks: "assignment",
  spatial: "layers",
  species: "potted_plant",
  wards: "location_city",
  contracts: "description",
  contractors: "business",
  users: "people",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("map");
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [patrolTarget, setPatrolTarget] = useState<{ id: string; name: string; location: string; lat: number | null; lng: number | null } | null>(null);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const userMenuRef = useRef<HTMLDivElement>(null);

  const { stats } = useDashboardStats();
  const { tree: fetchedTree } = useTreeById(selectedTreeId !== "NEW" ? selectedTreeId : null);

  const NEW_TREE_TEMPLATE = {
    id: "",
    ma: "",
    loaiCay: "Cây mới",
    soCay: "—",
    lat: 10.775,
    lng: 106.695,
    trangThai: "moi",
    phanLoai: "L1",
    tenDuong: "",
    phuong: "",
    quan: "",
    diaChi: "",
    hvn: 0,
    c13: 0,
    namTrong: new Date().getFullYear().toString(),
    cty: "",
    xn: "",
    goi: "",
    giamSat: "",
    kv: ""
  } as unknown as TreeRecord;

  const selectedTree = selectedTreeId === "NEW" ? NEW_TREE_TEMPLATE : fetchedTree;

  const showAlert = (config: { 
    type: NotificationType; 
    title: string; 
    message: string; 
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
  }) => {
    setAlertConfig({
      isOpen: true,
      type: config.type,
      title: config.title,
      message: config.message,
      onConfirm: config.onConfirm,
      confirmText: config.confirmText,
      onCancel: config.showCancel ? () => {} : undefined
    });
  };


  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedTreeId(null);
    setMobileMenuOpen(false);
  };

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="app-layout">
      {/* === HEADER === */}
      <header className="app-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => {
            setSidebarCollapsed(prev => !prev);
            setMobileMenuOpen(prev => !prev);
          }}>
            <i className="material-icons">menu</i>
          </button>
          <div className="app-title">
            <i className="material-icons" style={{ fontSize: 24 }}>eco</i>
            <h1>URBAN TREE GIS</h1>
          </div>
        </div>

        <div className="header-right">
          <div className="search-box">
            <i className="material-icons" style={{ fontSize: 20 }}>search</i>
            <input
              type="text"
              placeholder="Tìm kiếm cây xanh, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="user-menu-container" ref={userMenuRef}>
            <button className="user-menu-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <i className="material-icons">account_circle</i>
              <span>Admin</span>
              <i className="material-icons" style={{ fontSize: 18, marginLeft: 4 }}>arrow_drop_down</i>
            </button>
            <div className={`user-menu-dropdown ${userMenuOpen ? "show" : ""}`}>
              <div style={{ padding: 16, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 4, background: "#e8eeff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                  <i className="material-icons">account_circle</i>
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: "#333" }}>Admin</div>
                  <div style={{ fontSize: 12, color: "#999" }}>Quản trị viên</div>
                </div>
              </div>
              <div style={{ padding: "8px 0" }}>
                <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", background: "none", cursor: "pointer", color: "#555", fontSize: 14, fontFamily: "inherit", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <i className="material-icons" style={{ fontSize: 20 }}>settings</i>
                  Cài đặt
                </button>
                <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", border: "none", background: "none", cursor: "pointer", color: "#555", fontSize: 14, fontFamily: "inherit", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <i className="material-icons" style={{ fontSize: 20 }}>logout</i>
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* === BODY: SIDEBAR + CONTENT === */}
      <div className="app-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            collapsed={sidebarCollapsed}
            stats={stats}
          />
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Content Header / Breadcrumb */}
          <div className="content-header">
            <div className="breadcrumb">
              <i className="material-icons" style={{ fontSize: 18, color: "#2563eb" }}>home</i>
              <i className="material-icons">chevron_right</i>
              <span style={{ fontWeight: 500, color: "#333" }}>{TAB_LABELS[activeTab] || "Module"}</span>
            </div>
            <div style={{ fontSize: 12, color: "#999" }}>
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </div>
          </div>

          {/* Module Content */}
          <div style={{ height: (activeTab === "map" || activeTab === "spatial") ? "calc(100vh - 60px - 53px)" : "auto", minHeight: (activeTab === "map" || activeTab === "spatial") ? undefined : "calc(100vh - 60px - 53px)" }}>
            {(activeTab === "map" || activeTab === "spatial") && (
              <MapView 
                onManageTree={setSelectedTreeId} 
                onCreatePatrol={(info) => setPatrolTarget({ ...info, lat: info.lat ?? null, lng: info.lng ?? null })} 
                defaultSpatialOpen={activeTab === "spatial"}
              />
            )}
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "trees" && <TreeTable onManageTree={setSelectedTreeId} />}
            {activeTab === "parks" && <ParkManager showMode="parks" />}
            {activeTab === "greenAreas" && <ParkManager showMode="greenAreas" />}
            {activeTab === "patrol" && <TaskManager key="patrol" showMode="patrol" onOpenTicket={setSelectedTicketId} onShowAlert={showAlert} />}
            {activeTab === "tasks" && <TaskManager key={taskRefreshKey} showMode="tickets" onOpenTicket={setSelectedTicketId} onShowAlert={showAlert} />}
            {activeTab === "species" && <SpeciesManagement />}
            {activeTab === "wards" && <WardTable />}
            {activeTab === "contracts" && <ContractManager />}
            {activeTab === "contractors" && <ContractorManager />}
            {activeTab === "users" && <UserManager />}
          </div>
        </main>
      </div>

      {/* === TREE DETAIL MODAL === */}
      {selectedTreeId && selectedTree && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTreeId(null); }}>
          <div className="modal-box modal-lg" style={{ maxWidth: 1200, maxHeight: "92vh" }}>
            <TreeDetail tree={selectedTree} onBack={() => setSelectedTreeId(null)}
              onCreatePatrol={(info) => { setSelectedTreeId(null); setPatrolTarget(info); }} />
          </div>
        </div>
      )}

      {/* === TICKET DETAIL MODAL === */}
      {selectedTicketId && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTicketId(null); }}>
          <div className="modal-box modal-lg" style={{ maxWidth: 1300, maxHeight: "92vh" }}>
            <TicketDetailModal 
              ticketId={selectedTicketId} 
              onClose={() => {
                setSelectedTicketId(null);
                setTaskRefreshKey(prev => prev + 1);
              }} 
              onCancelTicket={() => {
                setTaskRefreshKey(prev => prev + 1);
              }}
              onShowAlert={showAlert}
            />
          </div>
        </div>
      )}

      {/* === PATROL FORM MODAL === */}
      {patrolTarget && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPatrolTarget(null); }}>
          <div className="modal-box" style={{ maxWidth: 640, maxHeight: "92vh" }}>
            <PatrolFormModal
              treeId={patrolTarget.id}
              treeName={patrolTarget.name}
              treeLocation={patrolTarget.location}
              lat={patrolTarget.lat}
              lng={patrolTarget.lng}
              onClose={() => setPatrolTarget(null)}
              onSuccess={() => { 
                setPatrolTarget(null); 
                showAlert({
                  type: "success",
                  title: "Ghi nhận thành công",
                  message: "Dữ liệu tuần tra đã được lưu vào hệ thống. Bạn có thể xem lại trong tab Công việc."
                });
              }}
            />
          </div>
        </div>
      )}

      {/* === PREMIUM SWEETALERT DIALOG === */}
      <Notification 
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        onConfirm={() => {
          if (alertConfig.onConfirm) alertConfig.onConfirm();
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={alertConfig.onCancel ? () => {
          if (alertConfig.onCancel) alertConfig.onCancel();
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
        } : undefined}
      />
    </div>
  );
}
