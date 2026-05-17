"use client";

import { useState } from "react";
import { ContractorRecord } from "@/lib/types";

export default function ContractorManager() {
  const [search, setSearch] = useState("");
  const allContractors: ContractorRecord[] = [];
  const filtered = allContractors.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.taxCode.includes(search));

  return (
    <div className="h-full overflow-y-auto bg-[#f5f7fa] custom-scrollbar">
      <div className="max-w-[1600px] mx-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#333]">Há»‡ thá»‘ng Nhà thầu</h2>
            <p className="text-sm text-[#999] mt-0.5">Quản lý thông tin pháp lý, nÄƒng lực và đánh giá chất lượng</p>
          </div>
          <button className="px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">+ ĐĒng ký nhà thầu</button>
        </div>

        <div className="card p-3">
          <div className="relative w-full max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Tìm theo tên hoặc MST..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#f5f7fa] text-sm border border-[#e0e0e0] focus:border-[#2563eb] focus:outline-none transition-colors placeholder:text-[#999]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="card p-5 hover:border-[#2563eb]/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-[#333]">{c.name}</h3>
                  <p className="text-xs text-[#999] mt-0.5">MST: {c.taxCode}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <span className="text-sm font-semibold">{c.rating}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm py-3 border-y border-[#e0e0e0]">
                <div><p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Äáº¡i diá»‡n</p><p className="text-[#333]">{c.representative}</p></div>
                <div><p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Äiá»‡n thoáº¡i</p><p className="text-[#333] font-mono">{c.phone}</p></div>
                <div><p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Email</p><p className="text-[#333]">{c.email}</p></div>
                <div><p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Lĩnh vực</p><p className="text-[#333]">{c.specialization}</p></div>
              </div>
              <p className="text-xs text-[#999] mt-3">{c.address}</p>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-sm text-[#999]">Chưa có dữ liệu nhà thầu. Dữ liệu sẽ được kết nối từ Supabase.</p>
          </div>
        )}
      </div>
    </div>
  );
}

