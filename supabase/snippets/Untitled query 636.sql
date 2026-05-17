-- =====================================================
-- MIGRATION: Hệ thống Quản lý Sự cố Cây xanh (5 Bước)
-- Ngày: 2026-05-05
-- =====================================================

-- 1. PATROL LOGS (Nhật ký tuần tra)
CREATE TABLE IF NOT EXISTS patrol_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID NOT NULL REFERENCES tree_assets(id) ON DELETE CASCADE,
  
  -- Thông tin hiện trường
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  muc_do_khan_cap TEXT CHECK (muc_do_khan_cap IN ('khan_cap', 'thuong')) DEFAULT 'thuong',
  
  -- Mô tả tình trạng (multi-select lưu JSON array)
  tinh_trang JSONB DEFAULT '[]'::jsonb, -- ["bong_goc","chet_kho","re_noi","sam_muc","nga_do","canh_gay","don_trai_phep","bi_mat","ha_thap","treo_quang_cao"]
  mo_ta TEXT,
  
  -- Media
  hinh_anh JSONB DEFAULT '[]'::jsonb, -- Array of URL strings
  
  -- Metadata
  nguoi_tuan_tra TEXT,
  ticket_id UUID, -- Will be set when a ticket is created from this log
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TICKETS (Hồ sơ xử lý sự cố - vòng đời)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id UUID NOT NULL REFERENCES tree_assets(id) ON DELETE CASCADE,
  patrol_log_id UUID REFERENCES patrol_logs(id) ON DELETE SET NULL,
  
  -- Trạng thái vòng đời
  trang_thai TEXT CHECK (trang_thai IN ('moi','cho_duyet','da_duyet','dang_thi_cong','hoan_thanh','tu_choi')) DEFAULT 'moi',
  
  -- Phân loại xử lý (theo flowchart)
  loai_xu_ly TEXT CHECK (loai_xu_ly IN ('giai_toa_cay_nga','giai_toa_canh_gay','don_ha_trong_lai','don_ha_thanh_ly','ha_thap_chieu_cao','cat_thap','cat_me','trong_lai','thanh_ly','khac')),
  
  -- Quản lý
  nguoi_phu_trach TEXT,
  nguoi_duyet TEXT,
  ly_do_tu_choi TEXT,
  ngay_duyet TIMESTAMPTZ,
  
  -- SLA
  ngay_bat_dau_thi_cong TIMESTAMPTZ,
  ngay_hoan_thanh TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from patrol_logs -> tickets
ALTER TABLE patrol_logs 
  ADD CONSTRAINT fk_patrol_ticket 
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL;

-- 3. PROPOSALS (Đề xuất xử lý - Bước 2)
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Phương án xử lý
  phuong_an_xu_ly TEXT, -- "don_ha_giai_toa", "ha_thap_chieu_cao", "ghi_nhan_mat_trai_phep"
  
  -- Khối lượng dự kiến
  the_tich_go_m3 DOUBLE PRECISION DEFAULT 0,
  cui_nhanh_ster DOUBLE PRECISION DEFAULT 0,
  
  -- An toàn thi công
  phuong_an_an_toan TEXT,
  
  -- Phục hồi
  trong_lai BOOLEAN DEFAULT FALSE,
  loai_cay_trong_lai TEXT,
  quy_cach_trong_lai TEXT,
  ly_do_khong_trong TEXT,
  tai_lap TEXT, -- "bung_re", "tai_lap_bon", "bo_via"
  
  -- File scan phiếu đề xuất gốc (nếu có)
  file_dinh_kem JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AS-BUILT LOGS (Hoàn công - Bước 4)
CREATE TABLE IF NOT EXISTS as_built_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Khối lượng thực tế
  the_tich_go_thuc_te DOUBLE PRECISION DEFAULT 0,
  cui_nhanh_thuc_te DOUBLE PRECISION DEFAULT 0,
  dien_tich_via_he DOUBLE PRECISION DEFAULT 0,
  
  -- Giải trình (bắt buộc nếu chênh lệch > 10%)
  giai_trinh_chenh_lech TEXT,
  
  -- Hồ sơ minh chứng
  anh_hoan_cong JSONB DEFAULT '[]'::jsonb,
  phieu_can_xe JSONB DEFAULT '[]'::jsonb,
  
  -- Chữ ký xác nhận
  xac_nhan_nha_thau BOOLEAN DEFAULT FALSE,
  ten_nguoi_ky_nha_thau TEXT,
  xac_nhan_giam_sat BOOLEAN DEFAULT FALSE,
  ten_nguoi_ky_giam_sat TEXT,
  ngay_ky TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_patrol_logs_tree ON patrol_logs(tree_id);
CREATE INDEX IF NOT EXISTS idx_patrol_logs_ticket ON patrol_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tree ON tickets(tree_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(trang_thai);
CREATE INDEX IF NOT EXISTS idx_tickets_patrol ON tickets(patrol_log_id);

-- VIEW: Thống kê tickets cho Dashboard
CREATE OR REPLACE VIEW v_ticket_summary AS
SELECT
  t.id AS ticket_id,
  t.tree_id,
  t.trang_thai,
  t.loai_xu_ly,
  t.created_at AS ngay_tao,
  t.ngay_hoan_thanh,
  ta.loai_cay,
  tl.ten_duong,
  tl.phuong,
  tl.quan,
  p.the_tich_go_m3 AS kl_du_kien,
  ab.the_tich_go_thuc_te AS kl_thuc_te,
  CASE 
    WHEN p.the_tich_go_m3 > 0 
    THEN ROUND(((ab.the_tich_go_thuc_te - p.the_tich_go_m3) / p.the_tich_go_m3 * 100)::numeric, 1)
    ELSE 0 
  END AS phan_tram_chenh_lech
FROM tickets t
LEFT JOIN tree_assets ta ON ta.id = t.tree_id
LEFT JOIN tree_locations tl ON tl.id = ta.location_id
LEFT JOIN proposals p ON p.ticket_id = t.id
LEFT JOIN as_built_logs ab ON ab.ticket_id = t.id;
