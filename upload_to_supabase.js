const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Sử dụng biến môi trường được truyền vào (yêu cầu Node.js >= 20.6.0 chạy với --env-file=.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Nếu có service_role key trong .env.local (ví dụ SUPABASE_SERVICE_ROLE_KEY) thì nên dùng nó để bỏ qua RLS.
// Ở đây dùng tạm ANON key nếu đã tắt RLS trên Supabase.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Thiếu cấu hình Supabase. Vui lòng kiểm tra file .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const EXPORT_DIR = path.join(__dirname, 'data_export');

async function uploadTable(tableName, fileName) {
  console.log(`\n--- Bắt đầu upload dữ liệu cho bảng: ${tableName} ---`);
  const filePath = path.join(EXPORT_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Không tìm thấy file ${fileName}. Bỏ qua.`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Đã tải ${data.length} dòng dữ liệu từ ${fileName}`);

  // Chia nhỏ dữ liệu (chunking) để không bị lỗi quá tải payload
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    // Upload chunk sử dụng upsert để ghi đè nếu đã tồn tại, tránh lỗi duplicate key
    const { error } = await supabase.from(tableName).upsert(chunk);
    if (error) {
      console.error(`❌ Lỗi khi chèn dữ liệu dòng ${i} - ${i + chunk.length}:`, error.message);
      // Ghi chú: Có thể dừng vòng lặp bằng `break;` nếu muốn dừng ngay khi gặp lỗi
    } else {
      console.log(`✅ Đã chèn thành công dòng ${i + 1} đến ${i + chunk.length}`);
    }
  }
  console.log(`--- Hoàn thành upload cho bảng: ${tableName} ---`);
}

async function main() {
  console.log("🚀 BẮT ĐẦU QUY TRÌNH MIGRATION LÊN SUPABASE...");
  
  // Lưu ý: Thứ tự upload cực kỳ quan trọng vì có khóa ngoại (Foreign Keys). 
  // Phải upload Location trước thì Asset và Management mới chèn được.
  
  await uploadTable('tree_locations', 'tree_locations.json');
  await uploadTable('tree_assets', 'tree_assets.json');
  await uploadTable('tree_management', 'tree_management.json');
  await uploadTable('tree_growth_logs', 'tree_growth_logs.json');
  await uploadTable('tree_maintenance_logs', 'tree_maintenance_logs.json');
  
  console.log("\n🎉 MIGRATION HOÀN TẤT THÀNH CÔNG!");
}

main();
