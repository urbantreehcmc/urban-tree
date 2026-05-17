-- Cập nhật View đầy đủ tất cả các trường dữ liệu
CREATE OR REPLACE VIEW public.view_tree_full AS
SELECT 
    a.id,
    a.legacy_id,
    a.hieu_so_cay,
    a.loai_cay,
    a.nam_trong,
    a.phan_loai,
    a.phan_tan,
    a.kich_thuoc_bon,
    a.trang_thai_ton_tai,
    a.raw_excel_data, -- Cột dữ liệu JSON gốc
    l.id as location_id,
    l.geo_id,
    l.dia_chi,
    l.phuong,
    l.quan,
    l.ten_duong,
    l.le,
    l.khu_vuc,
    l.lat,
    l.lng
FROM 
    public.tree_assets a
LEFT JOIN 
    public.tree_locations l ON a.location_id = l.id;

-- Phân quyền lại
ALTER VIEW public.view_tree_full OWNER TO postgres;
GRANT SELECT ON TABLE public.view_tree_full TO anon;
GRANT SELECT ON TABLE public.view_tree_full TO authenticated;
GRANT SELECT ON TABLE public.view_tree_full TO service_role;
