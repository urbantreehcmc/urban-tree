-- =============================================
-- RLS POLICIES CHO TẤT CẢ CÁC BẢNG - UrbanTree GIS
-- Chạy 1 lần duy nhất trên SQL Editor (Supabase Studio)
-- =============================================

-- =============================================
-- 1. BẢNG TREES (Cây xanh)
-- =============================================
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phép xem danh sách cây" ON public.trees;
DROP POLICY IF EXISTS "Cho phép sửa tọa độ cây" ON public.trees;
DROP POLICY IF EXISTS "Cho phép sửa thông tin cây" ON public.trees;
DROP POLICY IF EXISTS "Cho phép thêm cây mới" ON public.trees;
DROP POLICY IF EXISTS "Cho phép xóa cây" ON public.trees;

CREATE POLICY "Cho phép xem danh sách cây" 
ON public.trees FOR SELECT USING (true);

CREATE POLICY "Cho phép thêm cây mới" 
ON public.trees FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cho phép sửa thông tin cây" 
ON public.trees FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cho phép xóa cây" 
ON public.trees FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- 2. BẢNG PATROL_LOGS (Tuần tra)
-- =============================================
ALTER TABLE public.patrol_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patrol_select" ON public.patrol_logs;
DROP POLICY IF EXISTS "patrol_insert" ON public.patrol_logs;
DROP POLICY IF EXISTS "patrol_update" ON public.patrol_logs;
DROP POLICY IF EXISTS "patrol_delete" ON public.patrol_logs;

CREATE POLICY "patrol_select" 
ON public.patrol_logs FOR SELECT USING (true);

CREATE POLICY "patrol_insert" 
ON public.patrol_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "patrol_update" 
ON public.patrol_logs FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "patrol_delete" 
ON public.patrol_logs FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- 3. BẢNG TICKETS (Phiếu đề xuất / Sự cố)
-- =============================================
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select" ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert" ON public.tickets;
DROP POLICY IF EXISTS "tickets_update" ON public.tickets;
DROP POLICY IF EXISTS "tickets_delete" ON public.tickets;

CREATE POLICY "tickets_select" 
ON public.tickets FOR SELECT USING (true);

CREATE POLICY "tickets_insert" 
ON public.tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tickets_update" 
ON public.tickets FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tickets_delete" 
ON public.tickets FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- 4. BẢNG PROPOSALS (Đề xuất xử lý)
-- =============================================
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposals_select" ON public.proposals;
DROP POLICY IF EXISTS "proposals_insert" ON public.proposals;
DROP POLICY IF EXISTS "proposals_update" ON public.proposals;
DROP POLICY IF EXISTS "proposals_delete" ON public.proposals;

CREATE POLICY "proposals_select" 
ON public.proposals FOR SELECT USING (true);

CREATE POLICY "proposals_insert" 
ON public.proposals FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "proposals_update" 
ON public.proposals FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "proposals_delete" 
ON public.proposals FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- 5. BẢNG AS_BUILT_LOGS (Hoàn công)
-- =============================================
ALTER TABLE public.as_built_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asbuilt_select" ON public.as_built_logs;
DROP POLICY IF EXISTS "asbuilt_insert" ON public.as_built_logs;
DROP POLICY IF EXISTS "asbuilt_update" ON public.as_built_logs;
DROP POLICY IF EXISTS "asbuilt_delete" ON public.as_built_logs;

CREATE POLICY "asbuilt_select" 
ON public.as_built_logs FOR SELECT USING (true);

CREATE POLICY "asbuilt_insert" 
ON public.as_built_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "asbuilt_update" 
ON public.as_built_logs FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "asbuilt_delete" 
ON public.as_built_logs FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- 6. BẢNG TREE_SPECIES (Loài cây)
-- =============================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tree_species') THEN
    ALTER TABLE public.tree_species ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "species_select" ON public.tree_species;
    DROP POLICY IF EXISTS "species_insert" ON public.tree_species;
    DROP POLICY IF EXISTS "species_update" ON public.tree_species;
    DROP POLICY IF EXISTS "species_delete" ON public.tree_species;
    
    CREATE POLICY "species_select" ON public.tree_species FOR SELECT USING (true);
    CREATE POLICY "species_insert" ON public.tree_species FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "species_update" ON public.tree_species FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "species_delete" ON public.tree_species FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- =============================================
-- 7. BẢNG WARDS (Phường xã)
-- =============================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wards') THEN
    ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "wards_select" ON public.wards;
    DROP POLICY IF EXISTS "wards_insert" ON public.wards;
    DROP POLICY IF EXISTS "wards_update" ON public.wards;
    DROP POLICY IF EXISTS "wards_delete" ON public.wards;
    
    CREATE POLICY "wards_select" ON public.wards FOR SELECT USING (true);
    CREATE POLICY "wards_insert" ON public.wards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "wards_update" ON public.wards FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "wards_delete" ON public.wards FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- =============================================
-- HOÀN TẤT
-- =============================================
-- Sau khi chạy xong, tất cả người dùng đã đăng nhập
-- sẽ có quyền ĐỌC + THÊM + SỬA + XÓA trên mọi bảng.
-- Người dùng chưa đăng nhập chỉ được phép ĐỌC (xem bản đồ).
