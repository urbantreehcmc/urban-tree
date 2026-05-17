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

export function useTreeById(id: string | null) {

  const [tree, setTree] = useState<TreeRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setTree(null);
      return;
    }

    async function fetchTree() {
      setLoading(true);
      try {
        // Schema V2: Chỉ 1 request duy nhất vào bảng trees
        const { data: row, error } = await supabase
          .from('trees')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Lỗi khi lấy chi tiết cây:", error);
          return;
        }

        if (!row) return;

        const mappedTree: TreeRecord = {
          id: row.id,
          ma: parseInt(row.legacy_id) || 0,
          cty: row.cty || '',
          xn: row.xn || '',
          goi: row.goi ? (parseInt(row.goi) || 0) : 0,
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
        };

        setTree(mappedTree);
      } catch (err) {
        console.error("Lỗi ngoại lệ fetch tree detail:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTree();
  }, [id]);

  return { tree, loading };
}
