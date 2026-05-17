-- =============================================
-- Tạo Storage Bucket cho Hình ảnh Tuần tra
-- Chạy trên Supabase SQL Editor
-- =============================================

-- Tạo bucket "patrol-images" (public để có thể xem ảnh)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patrol-images', 
  'patrol-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Cho phép upload (authenticated)
CREATE POLICY "patrol_images_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patrol-images');

-- Policy: Cho phép xem (public)
CREATE POLICY "patrol_images_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'patrol-images');

-- Policy: Cho phép xóa (authenticated)
CREATE POLICY "patrol_images_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patrol-images');
