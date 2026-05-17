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

export interface TreeFilters {
  tenDuong?: string;
  phuong?: string;
  quan?: string;
  phanLoai?: string;
  search?: string;
  loaiCay?: string;
  soCay?: string;
  diaChi?: string;
}

export function useFilteredTrees(filters: TreeFilters, page: number = 1, pageSize: number = 50) {
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // Chỉ fetch nếu có ít nhất 1 bộ lọc được chọn
    const hasFilter = filters.tenDuong || filters.phuong || filters.quan || 
                     filters.phanLoai || filters.search || filters.loaiCay || 
                     filters.soCay || filters.diaChi;
    
    if (!hasFilter) {
      setTrees([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    async function fetchFilteredTrees() {
      setLoading(true);
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Schema V2: Truy vấn trực tiếp bảng trees - không cần view hay JOIN
        let query = supabase
          .from('trees')
          .select('*', { count: 'exact' });

        // Áp dụng bộ lọc
        if (filters.phanLoai) {
          query = query.eq('phan_loai', filters.phanLoai);
        }
        
        if (filters.loaiCay) {
          query = query.ilike('loai_cay', `%${filters.loaiCay}%`);
        }
        
        if (filters.soCay) {
          query = query.eq('hieu_so_cay', filters.soCay);
        }

        if (filters.diaChi) {
          query = query.ilike('dia_chi', `%${filters.diaChi}%`);
        }

        if (filters.tenDuong) {
          query = query.eq('ten_duong', filters.tenDuong);
        }

        if (filters.phuong) {
          query = query.eq('phuong', filters.phuong);
        }

        if (filters.quan) {
          query = query.eq('quan', filters.quan);
        }

        if (filters.search) {
          const s = `%${filters.search}%`;
          query = query.or(`loai_cay.ilike.${s},hieu_so_cay.ilike.${s},ten_duong.ilike.${s},phuong.ilike.${s},quan.ilike.${s},dia_chi.ilike.${s}`);
        }

        const { data, error, count } = await query
          .range(from, to)
          .order('legacy_id', { ascending: true });

        if (error) {
          console.error("Lỗi khi kéo dữ liệu lọc:", error);
          setError(error);
          return;
        }

        if (count !== null) setTotalCount(count);

        if (!data || data.length === 0) {
          setTrees([]);
          return;
        }

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
          phanLoai: row.phan_loai || '',
          phanTan: !!row.phan_tan,
          bon: !!row.kich_thuoc_bon,
          hvn: row.hvn || 0,
          c13: row.c13 || 0,
          ghiChu: row.ghi_chu || '',
          lat: row.lat || null,
          lng: row.lng || null,
          trangThai: mapTrangThai(row.trang_thai),
        }));

        setTrees(mappedTrees);
      } catch (err) {
        console.error("Lỗi ngoại lệ khi fetch filtered trees:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredTrees();
  }, [filters.tenDuong, filters.phuong, filters.quan, filters.phanLoai, filters.search, filters.loaiCay, filters.soCay, filters.diaChi, page, pageSize]);

  return { trees, loading, totalCount, error };
}
