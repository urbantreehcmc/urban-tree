"use client";

import type { UserRecord } from "@/lib/types";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function UserManager() {
  const [currentUserRole, setCurrentUserRole] = useState<string>("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const updateUserStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('user_profiles').update({ status }).eq('id', id);
    if (!error) fetchUsers();
  };

  const updateUserRole = async (id: string, role: string) => {
    const { error } = await supabase.from('user_profiles').update({ role }).eq('id', id);
    if (!error) fetchUsers();
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    admin: "#d946ef",
    investor: "#3b82f6",
    supervisor: "#a855f7",
    contractor: "#f59e0b",
    worker: "#14b8a6",
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px", backgroundColor: "#f5f7fa" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "500", color: "#333", margin: "0 0 5px 0" }}>Quản trị Người dùng</h2>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>Quản lý tài khoản, vai trò và phân quyền</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select 
            value={currentUserRole} 
            onChange={(e) => setCurrentUserRole(e.target.value)} 
            className="form-input"
            style={{ width: "160px", padding: "8px 12px" }}
          >
            <option value="admin">Quản trị viên</option>
            <option value="investor">Chủ đầu tư</option>
            <option value="supervisor">Giám sát</option>
            <option value="contractor">Nhà thầu</option>
          </select>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <div style={{ position: "relative", width: "350px" }}>
          <i className="material-icons" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "20px" }}>search</i>
          <input 
            type="text" 
            placeholder="Tìm kiếm người dùng..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="form-input"
            style={{ paddingLeft: "38px", margin: 0 }}
          />
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px" }}>
          <i className="material-icons" style={{ fontSize: "18px" }}>person_add</i>
          Thêm tài khoản
        </button>
      </div>

      {/* TABLE */}
      <div className="card" style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Vai trò</th>
              <th>Phạm vi</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "500", background: "linear-gradient(to right, #2563eb, #7e3af2)", flexShrink: 0 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: "500", color: "#333", fontSize: "14px", marginBottom: "2px" }}>{user.name}</div>
                      <div style={{ color: "#777", fontSize: "12px" }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <select 
                    value={user.role} 
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    style={{ 
                      padding: "4px 8px", 
                      fontSize: "12px", 
                      fontWeight: "500", 
                      borderRadius: "4px", 
                      border: "1px solid #eee",
                      outline: "none",
                      backgroundColor: `${roleColors[user.role]}15` || "#f5f5f5",
                      color: roleColors[user.role] || "#666"
                    }}
                  >
                    <option value="worker">Kỹ thuật</option>
                    <option value="contractor">Nhà thầu</option>
                    <option value="supervisor">Giám sát</option>
                    <option value="investor">Chủ đầu tư</option>
                    <option value="admin">Quản trị</option>
                  </select>
                  <div style={{ color: "#999", fontSize: "12px", marginTop: "4px" }}>{user.organization || 'Chưa cập nhật'}</div>
                </td>
                <td>
                  <span style={{ color: "#666", fontSize: "13px" }}>{user.area || 'Toàn hệ thống'}</span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%", 
                      backgroundColor: user.status === "active" ? "#10b981" : user.status === "pending" ? "#f59e0b" : "#9ca3af" 
                    }} />
                    <span style={{ 
                      fontSize: "13px", 
                      fontWeight: "500",
                      color: user.status === "active" ? "#10b981" : user.status === "pending" ? "#f59e0b" : "#6b7280"
                    }}>
                      {user.status === "active" ? "Hoạt động" : user.status === "pending" ? "Chờ duyệt" : "Đã khóa"}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  {user.status === 'pending' && (
                    <button 
                      onClick={() => updateUserStatus(user.id, 'active')} 
                      style={{ padding: "4px 10px", backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer", marginRight: "10px" }}
                    >
                      Phê duyệt
                    </button>
                  )}
                  {user.status === 'active' && (
                    <button 
                      onClick={() => updateUserStatus(user.id, 'locked')} 
                      style={{ background: "none", border: "none", color: "#999", cursor: "pointer", padding: "4px" }}
                      title='Khóa tài khoản'
                    >
                      <i className="material-icons" style={{ fontSize: "20px" }}>lock</i>
                    </button>
                  )}
                  {user.status === 'locked' && (
                    <button 
                      onClick={() => updateUserStatus(user.id, 'active')} 
                      style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", padding: "4px" }}
                      title='Mở khóa'
                    >
                      <i className="material-icons" style={{ fontSize: "20px" }}>lock_open</i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>Chưa có dữ liệu người dùng.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
