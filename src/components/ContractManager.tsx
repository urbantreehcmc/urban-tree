"use client";

import { useState } from "react";
import { ContractRecord, ContractorRecord } from "@/lib/types";

export default function ContractManager() {
  const [search, setSearch] = useState("");
  const allContracts: ContractRecord[] = [];
  const allContractors: ContractorRecord[] = [];
  const filtered = allContracts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
    active: { label: "Äang thực hiá»‡n", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    completed: { label: "Hoàn thành", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    suspended: { label: "Tạm ngưng", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    bidding: { label: "Äang đấu thầu", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f5f7fa] custom-scrollbar">
      <div className="max-w-[1600px] mx-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#333]">Quản lý Gói thầu</h2>
            <p className="text-sm text-[#999] mt-0.5">Theo dÃµi tiến đá»™, giá trá»‹ và đơn vá»‹ thực hiá»‡n</p>
          </div>
          <button className="px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">+ Tạo gói thầu</button>
        </div>

        <div className="card p-3">
          <div className="relative w-full max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Tìm kiếm gói thầu..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#f5f7fa] text-sm border border-[#e0e0e0] focus:border-[#2563eb] focus:outline-none transition-colors placeholder:text-[#999]" />
          </div>
        </div>

        {filtered.map((contract) => {
          const contractor = allContractors.find(c => c.id === contract.contractorId);
          const status = statusMap[contract.status];
          return (
            <div key={contract.id} className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#2563eb] font-mono">{contract.code}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.color} border ${status.border}`}>{status.label}</span>
              </div>
              <h3 className="text-base font-semibold text-[#333] mb-2">{contract.name}</h3>
              <p className="text-sm text-[#666] mb-4">{contract.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-[#e0e0e0]">
                <div><p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Nhà thầu</p><p className="text-sm font-medium text-[#333]">{contractor?.name || "N/A"}</p></div>
                <div><p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Giá trá»‹</p><p className="text-sm font-medium text-[#2563eb]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.value)}</p></div>
                <div><p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Bắt đầu</p><p className="text-sm font-mono">{contract.startDate}</p></div>
                <div><p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Kết thúc</p><p className="text-sm font-mono">{contract.endDate}</p></div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-sm text-[#999]">Chưa có dữ liệu gói thầu. Dữ liệu sẽ được kết nối từ Supabase.</p>
          </div>
        )}
      </div>
    </div>
  );
}

