-- ============================================
-- INDEXES: Tối ưu tốc độ truy vấn lọc + phân trang
-- ============================================

-- Trên bảng tree_assets (lọc theo loài cây, phân loại)
CREATE INDEX IF NOT EXISTS idx_tree_assets_loai_cay ON public.tree_assets(loai_cay);
CREATE INDEX IF NOT EXISTS idx_tree_assets_phan_loai ON public.tree_assets(phan_loai);
CREATE INDEX IF NOT EXISTS idx_tree_assets_hieu_so_cay ON public.tree_assets(hieu_so_cay);

-- Trên bảng tree_locations (lọc theo phường, quận, tên đường, tọa độ)
CREATE INDEX IF NOT EXISTS idx_tree_locations_phuong ON public.tree_locations(phuong);
CREATE INDEX IF NOT EXISTS idx_tree_locations_quan ON public.tree_locations(quan);
CREATE INDEX IF NOT EXISTS idx_tree_locations_ten_duong ON public.tree_locations(ten_duong);
CREATE INDEX IF NOT EXISTS idx_tree_locations_lat_lng ON public.tree_locations(lat, lng);

-- ============================================
-- FUNCTION: Thống kê Dashboard toàn bộ dữ liệu
-- ============================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM tree_assets),
    'has_coord', (SELECT COUNT(*) FROM tree_locations WHERE lat IS NOT NULL),
    'missing_coord', (SELECT COUNT(*) FROM tree_locations WHERE lat IS NULL),
    'l1', (SELECT COUNT(*) FROM tree_assets WHERE phan_loai = 'Loại 1'),
    'l2', (SELECT COUNT(*) FROM tree_assets WHERE phan_loai = 'Loại 2'),
    'l3', (SELECT COUNT(*) FROM tree_assets WHERE phan_loai = 'Loại 3'),
    'mt', (SELECT COUNT(*) FROM tree_assets WHERE phan_loai = 'Mới trồng'),
    'top_species', (
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT loai_cay as name, COUNT(*) as count
        FROM tree_assets
        WHERE loai_cay IS NOT NULL AND loai_cay != ''
        GROUP BY loai_cay
        ORDER BY count DESC
        LIMIT 10
      ) s
    ),
    'top_quan', (
      SELECT json_agg(row_to_json(q))
      FROM (
        SELECT quan as name, COUNT(*) as count
        FROM tree_locations
        WHERE quan IS NOT NULL AND quan != ''
        GROUP BY quan
        ORDER BY count DESC
      ) q
    ),
    'top_phuong', (
      SELECT json_agg(row_to_json(p))
      FROM (
        SELECT phuong as name, COUNT(*) as count
        FROM tree_locations
        WHERE phuong IS NOT NULL AND phuong != ''
        GROUP BY phuong
        ORDER BY count DESC
        LIMIT 15
      ) p
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================
-- FUNCTION: Lấy danh sách filter options (cho dropdown)
-- ============================================

CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'streets', (
      SELECT json_agg(ten_duong ORDER BY ten_duong)
      FROM (SELECT DISTINCT ten_duong FROM tree_locations WHERE ten_duong IS NOT NULL AND ten_duong != '') sub
    ),
    'wards', (
      SELECT json_agg(phuong ORDER BY phuong)
      FROM (SELECT DISTINCT phuong FROM tree_locations WHERE phuong IS NOT NULL AND phuong != '') sub
    ),
    'districts', (
      SELECT json_agg(quan ORDER BY quan)
      FROM (SELECT DISTINCT quan FROM tree_locations WHERE quan IS NOT NULL AND quan != '') sub
    ),
    'species', (
      SELECT json_agg(loai_cay ORDER BY loai_cay)
      FROM (SELECT DISTINCT loai_cay FROM tree_assets WHERE loai_cay IS NOT NULL AND loai_cay != '') sub
    ),
    'classifications', (
      SELECT json_agg(phan_loai ORDER BY phan_loai)
      FROM (SELECT DISTINCT phan_loai FROM tree_assets WHERE phan_loai IS NOT NULL AND phan_loai != '') sub
    )
  ) INTO result;

  RETURN result;
END;
$$;
