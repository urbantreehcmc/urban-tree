-- Cập nhật function thống kê để bao gồm trạng thái sức khỏe
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
    'khoe', (SELECT COUNT(*) FROM tree_assets WHERE trang_thai_ton_tai = 'dang_song'),
    'sau_benh', (SELECT COUNT(*) FROM tree_assets WHERE trang_thai_ton_tai = 'sau_benh'),
    'can_don_ha', (SELECT COUNT(*) FROM tree_assets WHERE trang_thai_ton_tai = 'can_don_ha'),
    'moi', (SELECT COUNT(*) FROM tree_assets WHERE trang_thai_ton_tai = 'moi_trong'),
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
    )
  ) INTO result;

  RETURN result;
END;
$$;
