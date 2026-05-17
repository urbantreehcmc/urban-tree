"use client";

import { useState, useMemo, useCallback } from "react";
import type { TreeRecord, ParkRecord, GreenAreaRecord } from "@/lib/types";
import {
  pointInPolygon,
  polygonAreaM2,
  polygonBBox,
  SAMPLE_PROJECTS,
  type Coordinate,
  type Polygon,
} from "@/utils/spatialUtils";

interface SpatialAnalysisPanelProps {
  trees: TreeRecord[];
  onProjectBoundaryChange: (boundary: { polygon: Coordinate[]; color: string } | null) => void;
  onAffectedTreeIds: (ids: Set<string>) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

interface AnalysisResult {
  projectName: string;
  boundaryArea: number;
  affectedTrees: TreeRecord[];
  affectedParks: { id: string; ten: string; tongDienTich: number }[];
  affectedGreenAreas: { id: string; ten: string; dienTich: number }[];
  treesBySpecies: { name: string; count: number }[];
  estimatedCost: number;
}

// Ä ơn giá bá»“i thường giả lập (VNÄ )
const COMPENSATION_RATE: Record<string, number> = {
  "khoe": 5_000_000,
  "sauBenh": 2_000_000,
  "canDonHa": 1_000_000,
  "moi": 8_000_000,
};

export default function SpatialAnalysisPanel({
  trees,
  onProjectBoundaryChange,
  onAffectedTreeIds,
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen,
}: SpatialAnalysisPanelProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;
  const setIsOpen = controlledSetIsOpen !== undefined ? controlledSetIsOpen : setLocalIsOpen;
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [uploadedGeoJSON, setUploadedGeoJSON] = useState<{ name: string; polygon: Coordinate[] } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active boundary polygon
  const activeBoundary = useMemo(() => {
    if (uploadedGeoJSON) return uploadedGeoJSON.polygon;
    if (selectedProjectId) {
      return SAMPLE_PROJECTS.find(p => p.id === selectedProjectId)?.polygon || null;
    }
    return null;
  }, [selectedProjectId, uploadedGeoJSON]);

  const runAnalysis = useCallback(() => {
    if (!activeBoundary) return;

    setIsAnalyzing(true);

    // Simulate analysis delay for UX effect
    setTimeout(() => {
      const polygon: Polygon = activeBoundary;
      const bbox = polygonBBox(polygon);

      // 1. Tìm cây trong ranh dự án (Point-in-polygon)
      const affectedTrees = trees.filter(t => {
        if (t.lat === null || t.lng === null) return false;
        // Quick bbox filter
        if (t.lng < bbox.minLng || t.lng > bbox.maxLng || t.lat < bbox.minLat || t.lat > bbox.maxLat) return false;
        // Precise check
        return pointInPolygon([t.lng, t.lat], polygon);
      });

      // 2. Tìm công viên giao cắt (kiểm tra nếu ít nhất 1 đỉnh park nằm trong ranh hoặc ngược lại)
      // TODO: Lấy dữ liệu công viên từ Supabase khi sẵn sàng
      const affectedParks: ParkRecord[] = [];

      // 3. Tìm mảng xanh giao cắt
      // TODO: Lấy dữ liệu mảng xanh từ Supabase khi sẵn sàng
      const affectedGreenAreas: GreenAreaRecord[] = [];

      // 4. Thống kê theo loài cây
      const speciesMap = new Map<string, number>();
      affectedTrees.forEach(t => {
        speciesMap.set(t.loaiCay, (speciesMap.get(t.loaiCay) || 0) + 1);
      });
      const treesBySpecies = Array.from(speciesMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // 5. Tính chi phí dự toán bá»“i thường
      const estimatedCost = affectedTrees.reduce((total, t) => {
        return total + (COMPENSATION_RATE[t.trangThai] || 3_000_000);
      }, 0);

      // 6. Diện tích ranh dự án
      const boundaryArea = polygonAreaM2(polygon);

      const projectName = uploadedGeoJSON?.name ||
        SAMPLE_PROJECTS.find(p => p.id === selectedProjectId)?.name || "Dự án";

      const result: AnalysisResult = {
        projectName,
        boundaryArea,
        affectedTrees,
        affectedParks: affectedParks.map(p => ({ id: p.id, ten: p.ten, tongDienTich: p.tongDienTich })),
        affectedGreenAreas: affectedGreenAreas.map(g => ({ id: g.id, ten: g.ten, dienTich: g.dienTich })),
        treesBySpecies,
        estimatedCost,
      };

      setAnalysisResult(result);
      onAffectedTreeIds(new Set(affectedTrees.map(t => t.id)));
      setIsAnalyzing(false);
    }, 800);
  }, [activeBoundary, trees, selectedProjectId, uploadedGeoJSON, onAffectedTreeIds]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setUploadedGeoJSON(null);
    setAnalysisResult(null);
    const project = SAMPLE_PROJECTS.find(p => p.id === projectId);
    if (project) {
      onProjectBoundaryChange({ polygon: project.polygon, color: project.color });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        // Hỗ trợ GeoJSON FeatureCollection hoặc Feature
        let coords: Coordinate[] | null = null;
        if (json.type === "FeatureCollection" && json.features?.length > 0) {
          const geom = json.features[0].geometry;
          if (geom?.type === "Polygon") {
            coords = geom.coordinates[0].slice(0, -1); // remove closing vertex
          }
        } else if (json.type === "Feature" && json.geometry?.type === "Polygon") {
          coords = json.geometry.coordinates[0].slice(0, -1);
        } else if (json.type === "Polygon") {
          coords = json.coordinates[0].slice(0, -1);
        }

        if (coords) {
          setUploadedGeoJSON({ name: file.name.replace(/\.[^.]+$/, ""), polygon: coords });
          setSelectedProjectId(null);
          setAnalysisResult(null);
          onProjectBoundaryChange({ polygon: coords, color: "#a855f7" });
        } else {
          alert("File GeoJSON không chứa Polygon hợp lệ.");
        }
      } catch {
        alert("Không thá»ƒ đọc file GeoJSON. Vui lòng kiểm tra lại định dạng.");
      }
    };
    reader.readAsText(file);
  };

  const clearAnalysis = () => {
    setSelectedProjectId(null);
    setUploadedGeoJSON(null);
    setAnalysisResult(null);
    onProjectBoundaryChange(null);
    onAffectedTreeIds(new Set());
  };

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <div
          className="absolute top-16 right-4 left-4 sm:left-auto z-10 w-auto sm:w-[400px] max-h-[calc(100%-100px)] overflow-y-auto rounded-2xl shadow-2xl border border-[#e0e0e0] fade-in card bg-white"
        >
          {/* Panel Header */}
          <div className="sticky top-0 z-10 px-6 py-5 border-b border-[#e0e0e0] bg-[#ffffff] backdrop-blur-xl rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(to right, #2563eb, #7e3af2)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#333]">Phân tích Chồng lấn</h3>
                  <p className="text-[11px] text-[#666] font-medium">Spatial Analysis Engine</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f7fa] text-[#666] hover:text-[#333] hover:bg-[#f9fafb] transition-colors border border-[#e0e0e0]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Chọn ranh dự án */}
            <div>
              <p className="text-xs font-bold text-[#666] mb-4 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-6 h-6 rounded-full bg-[#2563eb]/20 text-[#2563eb] text-[11px] font-black flex items-center justify-center border border-[#2563eb]/30">1</span>
                Chọn ranh dự án
              </p>

              {/* Sample projects */}
              <div className="space-y-2 mb-4">
                {SAMPLE_PROJECTS.map(proj => (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectProject(proj.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-[13px] font-bold transition-all cursor-pointer ${
                      selectedProjectId === proj.id
                        ? "border-[#2563eb] bg-[#2563eb]/10 text-[#333]"
                        : "border-[#e0e0e0] bg-[#f5f7fa] text-[#666] hover:bg-[#f9fafb] hover:text-[#333]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-sm shrink-0 shadow-sm" style={{ backgroundColor: proj.color }} />
                      <span>{proj.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Upload GeoJSON */}
              <div className="relative">
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="geojson-upload"
                />
                <div className="border-2 border-dashed border-[#e0e0e0] bg-[#f5f7fa] rounded-xl p-5 text-center hover:border-[#2563eb] hover:bg-[#2563eb]/5 transition-all">
                  <svg className="mx-auto mb-3 text-[#999]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-[13px] text-[#666] font-medium">
                    {uploadedGeoJSON ? (
                      <span className="text-[#2563eb] font-bold">âœ“ {uploadedGeoJSON.name}</span>
                    ) : (
                      <>Tải lên file <strong>.GeoJSON</strong> ranh dự án</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Run Analysis */}
            {activeBoundary && (
              <div className="pt-2">
                <p className="text-xs font-bold text-[#666] mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-6 h-6 rounded-full bg-[#2563eb]/20 text-[#2563eb] text-[11px] font-black flex items-center justify-center border border-[#2563eb]/30">2</span>
                  Chạy phân tích
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 hover-lift shadow-lg"
                    style={{ background: "linear-gradient(to right, #2563eb, #7e3af2)" }}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang phân tích...
                      </span>
                    ) : (
                      "⚡ Chạy ST_Intersects"
                    )}
                  </button>
                  <button onClick={clearAnalysis} className="px-4 py-3 rounded-xl bg-[#f5f7fa] border border-[#e0e0e0] text-[#666] hover:text-[#ef4444] hover:bg-[#ef4444]/10 text-sm font-bold transition-all cursor-pointer">
                    Xóa
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Results */}
            {analysisResult && (
              <div className="space-y-6 pt-2">
                <p className="text-xs font-bold text-[#666] flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-6 h-6 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-[11px] font-black flex items-center justify-center border border-[#22c55e]/30">3</span>
                  Kết quả phân tích
                </p>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Diện tích ranh" value={`${(analysisResult.boundaryArea / 10000).toFixed(2)} ha`} color="#2563eb" />
                  <StatCard label="Cây bị ảnh hưởng" value={`${analysisResult.affectedTrees.length} cây`} color="#ef4444" />
                  <StatCard label="Công viên giao cắt" value={`${analysisResult.affectedParks.length} CV`} color="#3b82f6" />
                  <StatCard label="Mảng xanh giao cắt" value={`${analysisResult.affectedGreenAreas.length} MX`} color="#22c55e" />
                </div>

                {/* Estimated Cost */}
                <div className="rounded-xl p-5 border border-[#f59e0b]/30 bg-[#f59e0b]/5">
                  <p className="text-xs text-[#f59e0b] font-bold uppercase tracking-wider mb-1.5">Dự toán bá»“i thường sơ bá»™</p>
                  <p className="text-2xl font-black text-[#f59e0b]">
                    {analysisResult.estimatedCost.toLocaleString("vi-VN")} <span className="text-sm font-bold text-[#f59e0b]/70">VNĐ</span>
                  </p>
                </div>

                {/* Trees by Species */}
                {analysisResult.treesBySpecies.length > 0 && (
                  <div className="bg-[#f5f7fa] border border-[#e0e0e0] rounded-xl p-4">
                    <p className="text-[11px] font-bold text-[#666] uppercase tracking-wider mb-3">Thống kê theo loài cây</p>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
                      {analysisResult.treesBySpecies.map(s => {
                        const pct = (s.count / analysisResult.affectedTrees.length) * 100;
                        return (
                          <div key={s.name} className="flex items-center gap-3 text-[13px] font-medium">
                            <span className="text-[#333] w-28 truncate">{s.name}</span>
                            <div className="flex-1 h-2.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[#666] w-8 text-right font-bold">{s.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Affected Parks */}
                {analysisResult.affectedParks.length > 0 && (
                  <div className="bg-[#f5f7fa] border border-[#e0e0e0] rounded-xl p-4">
                    <p className="text-[11px] font-bold text-[#666] uppercase tracking-wider mb-3">Công viên bị giao cắt</p>
                    <div className="space-y-2">
                      {analysisResult.affectedParks.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-[13px] font-medium bg-[#ffffff] border border-[#e0e0e0] px-3 py-2 rounded-lg">
                          <span className="text-[#333]">{p.ten}</span>
                          <span className="text-[#3b82f6] font-bold">{p.tongDienTich.toLocaleString()} m²</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <button className="w-full py-3 rounded-xl bg-[#f5f7fa] border border-[#e0e0e0] text-[#333] hover:bg-[#f9fafb] hover:border-[#2563eb] hover:text-[#2563eb] text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Xuất báo cáo bá»“i thường (.CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3 border border-[#e0e0e0] bg-[#f5f7fa]">
      <p className="text-[11px] font-bold text-[#666] mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-base font-black" style={{ color }}>{value}</p>
    </div>
  );
}

