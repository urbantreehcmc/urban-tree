"use client";

import { useState } from "react";
import { type TreeRecord } from "@/lib/types";

interface StreetViewPanelProps {
  coord: { lat: number; lng: number };
  trees?: TreeRecord[];
  onClose: () => void;
}

export default function StreetViewPanel({ coord, onClose }: StreetViewPanelProps) {
  const [isLoading, setIsLoading] = useState(true);

  // URL nhúng Street View không cần API Key (Mẹo iframe cũ của Google Maps)
  const iframeUrl = `https://maps.google.com/maps?layer=c&cbll=${coord.lat},${coord.lng}&cbp=11,0,0,0,0&output=svembed`;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black text-white">
          <div className="inline-block w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Äang kết nối vá»‡ tinh...</p>
          <p className="text-xs text-gray-400 mt-2">Sử dụng luồng dữ liệu thay thế (Iframe Mode)</p>
        </div>
      )}

      {/* Iframe Street View */}
      <iframe
        src={iframeUrl}
        className="w-full h-full border-0 absolute inset-0 z-0"
        allowFullScreen
        loading="lazy"
        onLoad={() => setIsLoading(false)}
      />
      
      {/* Nút Äóng đÃ¨ lên trên */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/60 hover:bg-red-600/80 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg"
        title="Đóng Street View"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Cảnh báo chế độ Iframe */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white/90 text-[11px] font-medium border border-purple-500/30 pointer-events-none flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
        Chế độ xem thực địa (Iframe Bypass) - Không hỗ trợ hiển thị vị trí cây
      </div>
    </div>
  );
}

