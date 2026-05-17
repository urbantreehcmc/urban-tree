"use client";

import type { ParkRecord, ParkAsset, GreenAreaRecord } from "@/lib/types";

interface ParkManagerProps {
  showMode?: "all" | "parks" | "greenAreas";
}

export default function ParkManager({ showMode = "all" }: ParkManagerProps) {
  // TODO: Kết nối dữ liệu công viên và mảng xanh từ Supabase
  const PARKS: ParkRecord[] = [];
  const PARK_ASSETS: ParkAsset[] = [];
  const GREEN_AREAS: GreenAreaRecord[] = [];

  return (
    <div className="h-full overflow-y-auto bg-[#f5f7fa] custom-scrollbar">
      <div className="max-w-[1600px] mx-auto p-6 flex flex-col gap-5">

        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-[#333]">
            {showMode === "parks" ? "Công viên" : showMode === "greenAreas" ? "Mảng xanh" : "Công viên & Mảng xanh"}
          </h2>
          <p className="text-sm text-[#999] mt-0.5">
            {showMode !== "greenAreas" && `${PARKS.length} công viên`}
            {showMode === "all" && " · "}
            {showMode !== "parks" && `${GREEN_AREAS.length} mảng xanh`} đang được quản lý
          </p>
        </div>

        {/* Parks */}
        {showMode !== "greenAreas" && (
          <div>
            <h3 className="text-base font-semibold text-[#333] mb-4 flex items-center gap-2">
              🏡 Danh sách Công viên
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {PARKS.map((park) => {
                const assets = PARK_ASSETS.filter((a) => a.parkId === park.id);
                const cayTrong = assets.filter((a) => a.loai === "cayTrong");
                const haTang = assets.filter((a) => a.loai === "haTang");
                const thietBi = assets.filter((a) => a.loai === "thietBi");

                return (
                  <div key={park.id} id={`park-card-${park.id}`} className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#e0e0e0]">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-[#2563eb]">{park.ten}</h4>
                          <p className="text-xs text-[#999] mt-0.5">
                            {park.phuong}, Quận {park.quan} · Cấp {park.capDo}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#333]">{park.tongDienTich.toLocaleString()}</p>
                          <p className="text-[11px] text-[#999]">m² tổng DT</p>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-3 text-xs">
                        <div className="flex-1">
                          <div className="flex justify-between text-[#999] mb-1">
                            <span>Duy tu</span>
                            <span className="text-[#22c55e] font-medium">{park.dienTichDuyTu.toLocaleString()} m²</span>
                          </div>
                          <div className="w-full bg-[#e0e0e0]/30 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${(park.dienTichDuyTu / park.tongDienTich) * 100}%` }} />
                          </div>
                        </div>
                        <div className="w-[100px]">
                          <div className="flex justify-between text-[#999] mb-1">
                            <span>Không DT</span>
                            <span className="text-[#f59e0b] font-medium">{park.dienTichKhongDuyTu.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-[#e0e0e0]/30 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: `${(park.dienTichKhongDuyTu / park.tongDienTich) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {assets.length > 0 && (
                      <div className="px-5 py-3 space-y-3">
                        {cayTrong.length > 0 && <AssetGroup title="🌱 Cây trồng" assets={cayTrong} />}
                        {haTang.length > 0 && <AssetGroup title="🚧 Hạ tầng" assets={haTang} />}
                        {thietBi.length > 0 && <AssetGroup title="⚙️ Thiết bị" assets={thietBi} />}
                      </div>
                    )}

                    {assets.length === 0 && (
                      <div className="px-5 py-4 text-center text-xs text-[#999]">Chưa có dữ liệu khối lượng</div>
                    )}
                  </div>
                );
              })}
            </div>
            {PARKS.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-sm text-[#999]">Chưa có dữ liệu công viên. Dữ liệu sẽ được kết nối từ Supabase.</p>
              </div>
            )}
          </div>
        )}

        {/* Green Areas */}
        {showMode !== "parks" && (
          <div>
            <h3 className="text-base font-semibold text-[#333] mb-4 flex items-center gap-2">
              🌿 Danh sách Mảng xanh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {GREEN_AREAS.map((ga) => (
                <div key={ga.id} id={`green-card-${ga.id}`} className="card p-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#22c55e]" />
                  <h4 className="font-semibold text-[#333] text-sm pl-2">{ga.ten}</h4>
                  <p className="text-xs text-[#999] mt-0.5 pl-2">{ga.phuong}, Quận {ga.quan}</p>
                  <div className="mt-3 pt-3 border-t border-[#e0e0e0] flex items-center justify-between pl-2">
                    <span className="text-xs text-[#999]">Diện tích</span>
                    <span className="text-base font-semibold text-[#22c55e]">
                      {ga.dienTich.toLocaleString()} <span className="text-xs text-[#999]">m²</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {GREEN_AREAS.length === 0 && (
              <div className="card p-10 text-center">
                <p className="text-sm text-[#999]">Chưa có dữ liệu mảng xanh. Dữ liệu sẽ được kết nối từ Supabase.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetGroup({ title, assets }: { title: string; assets: { id: string; hangMuc: string; dvt: string; khoiLuong: number }[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#999] mb-1.5">{title}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {assets.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-xs bg-[#f5f7fa] px-2.5 py-1.5 rounded-md border border-[#e0e0e0]">
            <span className="text-[#666] truncate mr-2">{a.hangMuc}</span>
            <span className="text-[#333] font-medium whitespace-nowrap">
              {a.khoiLuong.toLocaleString()} <span className="text-[#999]">{a.dvt}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

