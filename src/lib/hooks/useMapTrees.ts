import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TreeRecord } from '../types';

// Map giá trị trang_thai trong DB sang giá trị trangThai trên UI
function mapTrangThai(dbValue: string): "khoe" | "sauBenh" | "canDonHa" | "moi" | "dangXuLy" {
  switch(dbValue) {
    case 'dang_song': return 'khoe';
    case 'sau_benh': return 'sauBenh';
    case 'can_don_ha': return 'canDonHa';
    case 'moi_trong': return 'moi';
    case 'dang_xu_ly': return 'dangXuLy';
    default: return 'khoe';
  }
}

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function useMapTrees(bounds: ViewportBounds | null, zoom: number) {

  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Chỉ tải cây riêng lẻ khi zoom đủ sâu (ví dụ zoom >= 13)
    if (!bounds || zoom < 13) {
      setTrees([]);
      return;
    }

    async function fetchTreesInViewport() {
      setLoading(true);
      try {
        // Schema V2: Truy vấn trực tiếp 1 bảng `trees` - không cần JOIN
        const { data, error } = await supabase
          .from('trees')
          .select('*')
          .not('lat', 'is', null)
          .gte('lat', bounds!.south)
          .lte('lat', bounds!.north)
          .gte('lng', bounds!.west)
          .lte('lng', bounds!.east)
          .limit(2000);

        if (error) {
          console.error("Lỗi khi fetch cây trong viewport:", error.message || error);
          return;
        }

        const mappedTrees: TreeRecord[] = (data || []).map((row: any) => ({
          id: row.id,
          ma: parseInt(row.legacy_id) || 0,
          loaiCay: row.loai_cay || '',
          soCay: row.hieu_so_cay || '',
          phuong: row.phuong || '',
          quan: row.quan || '',
          tenDuong: (row.ten_duong || '').replace(/^Đường\s+/i, ''),
          diaChi: row.dia_chi || '',
          kv: row.khu_vuc || '',
          le: row.le || '',
          lat: row.lat,
          lng: row.lng,
          trangThai: mapTrangThai(row.trang_thai),
          phanTan: !!row.phan_tan,
          bon: !!row.kich_thuoc_bon,
          hvn: row.hvn || 0,
          c13: row.c13 || 0,
          ghiChu: row.ghi_chu || '',
          phanLoai: row.phan_loai || '',
          cty: row.cty || '',
          xn: row.xn || '',
          goi: parseInt(row.goi) || 0,
          namTrong: row.nam_trong ? parseInt(row.nam_trong) : null,
          giamSat: row.giam_sat || '',
        }));

        setTrees(mappedTrees);
      } catch (err: any) {
        console.error("Lỗi ngoại lệ fetch map trees:", err?.message || err);
      } finally {
        setLoading(false);
      }
    }

    // Debounce để tránh spam request khi đang kéo map liên tục
    const timer = setTimeout(fetchTreesInViewport, 300);
    return () => clearTimeout(timer);
  }, [bounds?.north, bounds?.south, bounds?.east, bounds?.west, zoom]);

  return { trees, loading };
}
