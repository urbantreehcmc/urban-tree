"use client";

import type { UserRecord } from "@/lib/types";
import { useState } from "react";

export default function UserManager() {
  const [currentUserRole, setCurrentUserRole] = useState<string>("admin");
  const [searchQuery, setSearchQuery] = useState("");

  const allUsers: UserRecord[] = [];
  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${roleColors[user.role]}`}>{roleLabels[user.role]}</span>
                    <p className="text-xs text-[#999] mt-1">{user.organization}</p>
                  </td>
                  <td className="px-5 py-3"><span className="text-sm text-[#666]">{user.area}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-[#22c55e]" : "bg-[#999]"}`} />
                      <span className="text-sm">{user.status === "active" ? "Hoạt động" : "Äã khóa"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="p-1.5 text-[#999] hover:text-[#2563eb] transition-colors" title="Sửa"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button className="p-1.5 text-[#999] hover:text-red-400 transition-colors" title="Xóa"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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

