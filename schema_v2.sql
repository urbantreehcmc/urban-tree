-- =============================================
-- SCHEMA V2: UrbanTree - Tối ưu cho Supabase Cloud (Nano)
-- Ngày: 2026-05-17
-- =============================================

-- 1. Bảng danh mục loài cây
CREATE TABLE IF NOT EXISTS public.tree_species (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    ten_khoa_hoc TEXT,
    ho TEXT,
    xuat_xu TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng danh mục phường/xã
CREATE TABLE IF NOT EXISTS public.wards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT,
    UNIQUE(name, district)
);

-- 3. BẢNG CHÍNH: 1 cây = 1 dòng
CREATE TABLE IF NOT EXISTS public.trees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Định danh
    legacy_id TEXT,
    hieu_so_cay TEXT,
    
    -- Vị trí địa lý
    dia_chi TEXT,
    phuong TEXT,
    quan TEXT,
    ten_duong TEXT,
    le TEXT,
    khu_vuc TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    
    -- Thông tin tài sản cây
    loai_cay TEXT,
    species_id UUID REFERENCES tree_species(id) ON DELETE SET NULL,
    nam_trong TEXT,
    phan_loai TEXT,
    phan_tan TEXT,
    kich_thuoc_bon TEXT,
    trang_thai TEXT DEFAULT 'dang_song',
    
    -- Thông số kỹ thuật
    hvn NUMERIC,
    c13 NUMERIC,
    
    -- Quản lý
    cty TEXT,
    xn TEXT,
    goi TEXT,
    giam_sat TEXT,
    
    -- Ghi chú
    ghi_chu TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Hệ thống quản lý sự cố (5 bước)
CREATE TABLE IF NOT EXISTS public.patrol_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    muc_do_khan_cap TEXT CHECK (muc_do_khan_cap IN ('khan_cap', 'thuong')) DEFAULT 'thuong',
    tinh_trang JSONB DEFAULT '[]'::jsonb,
    mo_ta TEXT,
    hinh_anh JSONB DEFAULT '[]'::jsonb,
    nguoi_tuan_tra TEXT,
    ticket_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    patrol_log_id UUID REFERENCES patrol_logs(id) ON DELETE SET NULL,
    trang_thai TEXT CHECK (trang_thai IN ('moi','cho_duyet','da_duyet','dang_thi_cong','hoan_thanh','tu_choi')) DEFAULT 'moi',
    loai_xu_ly TEXT CHECK (loai_xu_ly IN ('giai_toa_cay_nga','giai_toa_canh_gay','don_ha_trong_lai','don_ha_thanh_ly','ha_thap_chieu_cao','cat_thap','cat_me','trong_lai','thanh_ly','khac')),
    nguoi_phu_trach TEXT,
    nguoi_duyet TEXT,
    ly_do_tu_choi TEXT,
    ngay_duyet TIMESTAMPTZ,
    ngay_bat_dau_thi_cong TIMESTAMPTZ,
    ngay_hoan_thanh TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patrol_logs ADD CONSTRAINT fk_patrol_ticket 
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    phuong_an_xu_ly TEXT,
    the_tich_go_m3 DOUBLE PRECISION DEFAULT 0,
    cui_nhanh_ster DOUBLE PRECISION DEFAULT 0,
    phuong_an_an_toan TEXT,
    trong_lai BOOLEAN DEFAULT FALSE,
    loai_cay_trong_lai TEXT,
    quy_cach_trong_lai TEXT,
    ly_do_khong_trong TEXT,
    tai_lap TEXT,
    file_dinh_kem JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.as_built_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    the_tich_go_thuc_te DOUBLE PRECISION DEFAULT 0,
    cui_nhanh_thuc_te DOUBLE PRECISION DEFAULT 0,
    dien_tich_via_he DOUBLE PRECISION DEFAULT 0,
    giai_trinh_chenh_lech TEXT,
    anh_hoan_cong JSONB DEFAULT '[]'::jsonb,
    phieu_can_xe JSONB DEFAULT '[]'::jsonb,
    xac_nhan_nha_thau BOOLEAN DEFAULT FALSE,
    ten_nguoi_ky_nha_thau TEXT,
    xac_nhan_giam_sat BOOLEAN DEFAULT FALSE,
    ten_nguoi_ky_giam_sat TEXT,
    ngay_ky TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES (tối ưu, chỉ giữ những index cần thiết)
-- =============================================
CREATE INDEX idx_trees_lat_lng ON trees(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX idx_trees_phuong ON trees(phuong);
CREATE INDEX idx_trees_quan ON trees(quan);
CREATE INDEX idx_trees_ten_duong ON trees(ten_duong);
CREATE INDEX idx_trees_loai_cay ON trees(loai_cay);
CREATE INDEX idx_trees_phan_loai ON trees(phan_loai);
CREATE INDEX idx_trees_trang_thai ON trees(trang_thai);
CREATE INDEX idx_trees_species_id ON trees(species_id);
CREATE INDEX idx_patrol_logs_tree ON patrol_logs(tree_id);
CREATE INDEX idx_tickets_tree ON tickets(tree_id);
CREATE INDEX idx_tickets_status ON tickets(trang_thai);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Dashboard stats (truy vấn 1 bảng, không cần JOIN)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM trees),
    'has_coord', (SELECT COUNT(*) FROM trees WHERE lat IS NOT NULL),
    'missing_coord', (SELECT COUNT(*) FROM trees WHERE lat IS NULL),
    'l1', (SELECT COUNT(*) FROM trees WHERE phan_loai = 'Loại 1'),
    'l2', (SELECT COUNT(*) FROM trees WHERE phan_loai = 'Loại 2'),
    'l3', (SELECT COUNT(*) FROM trees WHERE phan_loai = 'Loại 3'),
    'mt', (SELECT COUNT(*) FROM trees WHERE phan_loai = 'Mới trồng'),
    'khoe', (SELECT COUNT(*) FROM trees WHERE trang_thai = 'dang_song'),
    'sau_benh', (SELECT COUNT(*) FROM trees WHERE trang_thai = 'sau_benh'),
    'can_don_ha', (SELECT COUNT(*) FROM trees WHERE trang_thai = 'can_don_ha'),
    'moi', (SELECT COUNT(*) FROM trees WHERE trang_thai = 'moi_trong'),
    'top_species', (
      SELECT json_agg(row_to_json(s)) FROM (
        SELECT loai_cay as name, COUNT(*) as count FROM trees
        WHERE loai_cay IS NOT NULL AND loai_cay != ''
        GROUP BY loai_cay ORDER BY count DESC LIMIT 10
      ) s
    ),
    'top_quan', (
      SELECT json_agg(row_to_json(q)) FROM (
        SELECT quan as name, COUNT(*) as count FROM trees
        WHERE quan IS NOT NULL AND quan != ''
        GROUP BY quan ORDER BY count DESC
      ) q
    )
  ) INTO result;
  RETURN result;
END; $$;

-- Filter options
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'streets', (
      SELECT json_agg(ten_duong ORDER BY ten_duong)
      FROM (SELECT DISTINCT ten_duong FROM trees WHERE ten_duong IS NOT NULL AND ten_duong != '') sub
    ),
    'wards', (
      SELECT json_agg(phuong ORDER BY phuong)
      FROM (SELECT DISTINCT phuong FROM trees WHERE phuong IS NOT NULL AND phuong != '') sub
    ),
    'districts', (
      SELECT json_agg(quan ORDER BY quan)
      FROM (SELECT DISTINCT quan FROM trees WHERE quan IS NOT NULL AND quan != '') sub
    ),
    'species', (
      SELECT json_agg(loai_cay ORDER BY loai_cay)
      FROM (SELECT DISTINCT loai_cay FROM trees WHERE loai_cay IS NOT NULL AND loai_cay != '') sub
    ),
    'classifications', (
      SELECT json_agg(phan_loai ORDER BY phan_loai)
      FROM (SELECT DISTINCT phan_loai FROM trees WHERE phan_loai IS NOT NULL AND phan_loai != '') sub
    )
  ) INTO result;
  RETURN result;
END; $$;

-- VIEW: Thống kê tickets
CREATE OR REPLACE VIEW v_ticket_summary AS
SELECT
  t.id AS ticket_id,
  t.tree_id,
  t.trang_thai,
  t.loai_xu_ly,
  t.created_at AS ngay_tao,
  t.ngay_hoan_thanh,
  tr.loai_cay,
  tr.ten_duong,
  tr.phuong,
  tr.quan,
  p.the_tich_go_m3 AS kl_du_kien,
  ab.the_tich_go_thuc_te AS kl_thuc_te,
  CASE 
    WHEN p.the_tich_go_m3 > 0 
    THEN ROUND(((ab.the_tich_go_thuc_te - p.the_tich_go_m3) / p.the_tich_go_m3 * 100)::numeric, 1)
    ELSE 0 
  END AS phan_tram_chenh_lech
FROM tickets t
LEFT JOIN trees tr ON tr.id = t.tree_id
LEFT JOIN proposals p ON p.ticket_id = t.id
LEFT JOIN as_built_logs ab ON ab.ticket_id = t.id;

-- =============================================
-- AUTHENTICATION & USERS
-- =============================================

-- Bảng user_profiles để mở rộng thông tin từ auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'worker', -- admin, investor, supervisor, contractor, worker
    status TEXT DEFAULT 'pending', -- pending, active, locked
    organization TEXT,
    area TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS cho user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người có thể đọc user_profiles (để hiển thị tên trên app)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.user_profiles FOR SELECT USING (true);

-- Policy: Admin có thể update mọi profile
CREATE POLICY "Admins can update all profiles." 
ON public.user_profiles FOR UPDATE 
USING ( (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' );

-- Policy: User có thể update profile của chính mình
CREATE POLICY "Users can update own profile." 
ON public.user_profiles FOR UPDATE 
USING ( auth.uid() = id );

-- Trigger tự động tạo profile khi đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'worker',
    'pending'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger gắn vào auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
