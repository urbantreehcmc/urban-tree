-- 1. Hàm lấy cấu trúc phân cấp địa lý Quận -> Phường -> Đường
CREATE OR REPLACE FUNCTION get_location_hierarchy()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(q))
  FROM (
    SELECT 
      quan as name,
      (
        SELECT json_agg(row_to_json(p))
        FROM (
          SELECT 
            phuong as name,
            (
              SELECT json_agg(ten_duong ORDER BY ten_duong)
              FROM (
                SELECT DISTINCT ten_duong 
                FROM tree_locations l3 
                WHERE l3.quan = l1.quan AND l3.phuong = l2.phuong AND l3.ten_duong IS NOT NULL AND l3.ten_duong != ''
              ) sub
            ) as streets
          FROM (
            SELECT DISTINCT phuong 
            FROM tree_locations l2 
            WHERE l2.quan = l1.quan AND l2.phuong IS NOT NULL AND l2.phuong != ''
          ) l2
          ORDER BY phuong
        ) p
      ) as wards
    FROM (
      SELECT DISTINCT quan 
      FROM tree_locations l1 
      WHERE l1.quan IS NOT NULL AND l1.quan != ''
    ) l1
    ORDER BY quan
  ) q INTO result;

  RETURN result;
END;
$$;

-- 2. Phân quyền
GRANT EXECUTE ON FUNCTION public.get_location_hierarchy() TO anon;
GRANT EXECUTE ON FUNCTION public.get_location_hierarchy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_location_hierarchy() TO service_role;
