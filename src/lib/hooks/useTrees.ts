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

export function useTrees(page: number = 1, pageSize: number = 100) {
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchTrees() {
      setLoading(true);
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Schema V2: Lấy dữ liệu trực tiếp từ 1 bảng `trees`
        const { data, error, count } = await supabase
          .from('trees')
          .select('*', { count: 'exact' })
          .range(from, to)
          .order('legacy_id', { ascending: true });

        if (error) {
          console.error("Lỗi khi kéo dữ liệu trees:", error);
          setLoading(false);
          return;
        }

        if (count !== null) setTotalCount(count);

        if (!data || data.length === 0) {
          setTrees([]);
          return;
        }

        // Map data sang TreeRecord interface
        const mappedTrees: TreeRecord[] = data.map((row: any) => ({
          id: row.id,
          ma: parseInt(row.legacy_id) || 0,
          cty: row.cty || '',
          xn: row.xn || '',
          goi: parseInt(row.goi) || 0,
          kv: row.khu_vuc || '',
          diaChi: row.dia_chi || '',
          phuong: row.phuong || '',
          quan: row.quan || '',
          giamSat: row.giam_sat || '',
          tenDuong: (row.ten_duong || '').replace(/^Đường\s+/i, ''),
          le: row.le || '',
          loaiCay: row.loai_cay || '',
          soCay: row.hieu_so_cay || '',
          namTrong: row.nam_trong ? parseInt(row.nam_trong) : null,
          phanLoai: row.phan_loai || "",
          phanTan: !!row.phan_tan,
          bon: !!row.kich_thuoc_bon,
          hvn: row.hvn || 0,
          c13: row.c13 || 0,
          ghiChu: row.ghi_chu || '',
          lat: row.lat || null,
          lng: row.lng || null,
          trangThai: mapTrangThai(row.trang_thai)
        }));

        setTrees(mappedTrees);
      } catch (err) {
        console.error("Lỗi ngoại lệ khi fetch trees:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrees();
  }, [page, pageSize]);

  return { trees, loading, totalCount };
}
