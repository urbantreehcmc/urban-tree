-- SQL Schema cho UrbanTree (5 bảng chính)
-- Chạy đoạn mã này trong mục "SQL Editor" trên giao diện Supabase

-- 1. Bảng lưu trữ vị trí địa lý cố định (Locations)
CREATE TABLE public.tree_locations (
    id UUID PRIMARY KEY,
    geo_id TEXT UNIQUE NOT NULL,
    legacy_id TEXT,
    dia_chi TEXT,
    phuong TEXT,
    quan TEXT,
    ten_duong TEXT,
    le TEXT,
    khu_vuc TEXT,
    lat NUMERIC,
    lng NUMERIC,
    vn2000_x NUMERIC,
    vn2000_y NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng lưu trữ thông tin tài sản cây xanh tại vị trí đó (Assets)
CREATE TABLE public.tree_assets (
    id UUID PRIMARY KEY,
    location_id UUID REFERENCES public.tree_locations(id) ON DELETE CASCADE,
    legacy_id TEXT,
    hieu_so_cay TEXT,
    loai_cay TEXT,
    nam_trong TEXT,
    phan_loai TEXT,
    phan_tan TEXT,
    kich_thuoc_bon TEXT,
    trang_thai_ton_tai TEXT DEFAULT 'dang_song',
    raw_excel_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng lịch sử sinh trưởng (Growth Logs)
CREATE TABLE public.tree_growth_logs (
    id UUID PRIMARY KEY,
    tree_asset_id UUID REFERENCES public.tree_assets(id) ON DELETE CASCADE,
    ngay_do TIMESTAMP WITH TIME ZONE,
    hvn NUMERIC,
    c13 NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng thông tin quản lý, duy tu tại vị trí (Management)
CREATE TABLE public.tree_management (
    id UUID PRIMARY KEY,
    location_id UUID REFERENCES public.tree_locations(id) ON DELETE CASCADE,
    cty TEXT,
    xn TEXT,
    goi TEXT,
    giam_sat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng nhật ký bảo dưỡng/chăm sóc (Maintenance Logs)
CREATE TABLE public.tree_maintenance_logs (
    id UUID PRIMARY KEY,
    tree_asset_id UUID REFERENCES public.tree_assets(id) ON DELETE CASCADE,
    ngay_thuc_hien TIMESTAMP WITH TIME ZONE,
    noi_dung TEXT,
    loai_cong_viec TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo Index để tối ưu tốc độ truy vấn
CREATE INDEX idx_tree_locations_geo_id ON public.tree_locations(geo_id);
CREATE INDEX idx_tree_assets_location_id ON public.tree_assets(location_id);
CREATE INDEX idx_tree_management_location_id ON public.tree_management(location_id);
