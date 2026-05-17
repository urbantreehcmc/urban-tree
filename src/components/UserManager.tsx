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
    admin: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    investor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    supervisor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    contractor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    worker: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };
  const roleLabels: Record<string, string> = {
    admin: "Quản trị", investor: "Chủ đầu tư", supervisor: "Giám sát", contractor: "Nhà thầu", worker: "Kỹ thuật",
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f5f7fa] custom-scrollbar">
      <div className="max-w-[1400px] mx-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#333]">Quản trị Người dùng</h2>
            <p className="text-sm text-[#999] mt-0.5">Quản lý tài khoản, vai trò và phân quyền</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={currentUserRole} onChange={(e) => setCurrentUserRole(e.target.value)} className="bg-[#ffffff] text-sm py-1.5 px-3 rounded-lg border border-[#e0e0e0] focus:outline-none focus:border-[#2563eb]">
              <option value="admin">Quản trị viên</option>
              <option value="investor">Chủ đầu tư</option>
              <option value="supervisor">Giám sát</option>
              <option value="contractor">Nhà thầu</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Tìm kiếm người dùng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#ffffff] border border-[#e0e0e0] rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#2563eb] transition-colors placeholder:text-[#999]" />
          </div>
          <button className="px-4 py-2 bg-[#2563eb] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Thêm tài khoản
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e0e0e0]">
              <tr>
                <th className="px-5 py-3 text-xs font-medium text-[#999] uppercase tracking-wider">Người dùng</th>
                <th className="px-5 py-3 text-xs font-medium text-[#999] uppercase tracking-wider">Vai trò</th>
                <th className="px-5 py-3 text-xs font-medium text-[#999] uppercase tracking-wider">Phạm vi</th>
                <th className="px-5 py-3 text-xs font-medium text-[#999] uppercase tracking-wider">Trạng thái</th>
                <th className="px-5 py-3 text-xs font-medium text-[#999] uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]/30">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#2563eb]/[0.04] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium text-white shrink-0" style={{ background: "linear-gradient(to right, #2563eb, #7e3af2)" }}>{user.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-[#333]">{user.name}</p>
                        <p className="text-xs text-[#999]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <select 
                      value={user.role} 
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className={`px-2 py-1 text-[11px] font-medium rounded border focus:outline-none ${roleColors[user.role] || "bg-gray-100 text-gray-600"}`}
                    >
                      <option value="worker">Kỹ thuật</option>
                      <option value="contractor">Nhà thầu</option>
                      <option value="supervisor">Giám sát</option>
                      <option value="investor">Chủ đầu tư</option>
                      <option value="admin">Quản trị</option>
                    </select>
                    <p className="text-xs text-[#999] mt-1">{user.organization || 'Chưa cập nhật'}</p>
                  </td>
                  <td className="px-5 py-3"><span className="text-sm text-[#666]">{user.area || 'Toàn hệ thống'}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-[#22c55e]" : user.status === "pending" ? "bg-amber-500" : "bg-[#999]"}`} />
                      <span className="text-sm font-medium" style={{ color: user.status === "active" ? "#22c55e" : user.status === "pending" ? "#f59e0b" : "#999" }}>
                        {user.status === "active" ? "Hoạt động" : user.status === "pending" ? "Chờ duyệt" : "Đã khóa"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {user.status === 'pending' && (
                      <button onClick={() => updateUserStatus(user.id, 'active')} className="px-3 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-xs font-bold mr-2 transition-colors">
                        Phê duyệt
                      </button>
                    )}
                    {user.status === 'active' && (
                      <button onClick={() => updateUserStatus(user.id, 'locked')} className="p-1.5 text-[#999] hover:text-red-400 transition-colors" title='Khóa tài khoản'>
                        <i className="material-icons text-[18px]">lock</i>
                      </button>
                    )}
                    {user.status === 'locked' && (
                      <button onClick={() => updateUserStatus(user.id, 'active')} className="p-1.5 text-[#999] hover:text-[#22c55e] transition-colors" title='Mở khóa'>
                        <i className="material-icons text-[18px]">lock_open</i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[#999]">Chưa có dữ liệu người dùng. Dữ liệu sẽ được kết nối từ Supabase Auth.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

