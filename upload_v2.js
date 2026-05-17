/**
 * Upload V2: Đẩy dữ liệu đã tối ưu lên Supabase Cloud
 * 
 * Quy trình:
 * 1. Đọc trees.json, tree_species_v2.json, wards_v2.json
 * 2. Upload theo thứ tự: tree_species → wards → trees (theo batch 500 dòng)
 * 3. Kiểm tra kết quả
 * 
 * Yêu cầu: Đã tạo schema trên Cloud bằng schema_v2.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================
// CẤU HÌNH SUPABASE CLOUD
// ============================================
const CLOUD_URL = 'https://iunvvotgvhchomysqbzy.supabase.co';
// Sẽ cần service_role key để bypass RLS
// Lấy từ: Supabase Dashboard > Settings > API > service_role (secret)
const CLOUD_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bnZ2b3RndmhjaG9teXNxYnp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk4MDY2MCwiZXhwIjoyMDk0NTU2NjYwfQ.pJQvmpkNGZY4HPkyQOUeeo7_NyPQd4s1aEqopqWLnyE';

if (CLOUD_SERVICE_KEY === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Vui lòng cung cấp SUPABASE_SERVICE_KEY!');
  console.error('   Lấy từ: Supabase Dashboard > Settings > API > service_role (secret)');
  console.error('   Chạy: set SUPABASE_SERVICE_KEY=eyJhbGci... && node upload_v2.js');
  process.exit(1);
}

const supabase = createClient(CLOUD_URL, CLOUD_SERVICE_KEY, {
  auth: { persistSession: false }
});

const EXPORT_DIR = path.join(__dirname, 'data_export_v2');
const BATCH_SIZE = 500; // Supabase REST API tối ưu với batch 500

// ============================================
// HÀM TIỆN ÍCH
// ============================================

function readJson(filename) {
  const filePath = path.join(EXPORT_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

async function uploadBatch(table, batch, batchNum, totalBatches) {
  const { error } = await supabase
    .from(table)
    .insert(batch);

  if (error) {
    console.error(`  ❌ Lỗi batch ${batchNum}/${totalBatches} (${table}):`, error.message);
    // Log chi tiết dòng đầu tiên của batch để debug
    if (error.details) console.error('  Chi tiết:', error.details);
    return false;
  }
  return true;
}

async function uploadTable(table, data) {
  const totalBatches = Math.ceil(data.length / BATCH_SIZE);
  let uploaded = 0;
  let errors = 0;

  console.log(`\n📤 Upload ${table}: ${data.length} bản ghi (${totalBatches} batches)...`);

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    const success = await uploadBatch(table, batch, batchNum, totalBatches);
    if (success) {
      uploaded += batch.length;
    } else {
      errors += batch.length;
    }

    process.stdout.write(`\r  Tiến độ: ${batchNum}/${totalBatches} batches (${uploaded} thành công, ${errors} lỗi)`);
  }

  console.log(`\n  ✅ ${table}: ${uploaded} thành công, ${errors} lỗi`);
  return { uploaded, errors };
}

// ============================================
// HÀM CHÍNH
// ============================================

async function main() {
  console.log('===========================================');
  console.log('  Upload V2: Đẩy dữ liệu lên Supabase Cloud');
  console.log('===========================================');
  console.log(`  URL: ${CLOUD_URL}`);
  console.log(`  Thư mục dữ liệu: ${EXPORT_DIR}`);

  // Kiểm tra kết nối
  console.log('\n🔗 Kiểm tra kết nối Cloud...');
  const { data: testData, error: testError } = await supabase.from('tree_species').select('count', { count: 'exact', head: true });
  if (testError) {
    console.error('❌ Không thể kết nối Supabase Cloud:', testError.message);
    console.error('   Kiểm tra: 1) Schema đã được tạo? 2) Service key đúng?');
    process.exit(1);
  }
  console.log('  ✅ Kết nối thành công!');

  // 1. Upload tree_species
  const species = readJson('tree_species_v2.json');
  await uploadTable('tree_species', species);

  // 2. Upload wards
  const wards = readJson('wards_v2.json');
  await uploadTable('wards', wards);

  // 3. Upload trees (lớn nhất - 129k dòng)
  const trees = readJson('trees.json');
  await uploadTable('trees', trees);

  // 4. Kiểm tra kết quả
  console.log('\n===========================================');
  console.log('  📊 KIỂM TRA KẾT QUẢ');
  console.log('===========================================');

  const { count: speciesCount } = await supabase.from('tree_species').select('*', { count: 'exact', head: true });
  const { count: wardsCount } = await supabase.from('wards').select('*', { count: 'exact', head: true });
  const { count: treesCount } = await supabase.from('trees').select('*', { count: 'exact', head: true });

  console.log(`  tree_species: ${speciesCount} (mong đợi: ${species.length})`);
  console.log(`  wards: ${wardsCount} (mong đợi: ${wards.length})`);
  console.log(`  trees: ${treesCount} (mong đợi: ${trees.length})`);

  if (treesCount === trees.length) {
    console.log('\n🎉 UPLOAD THÀNH CÔNG 100%!');
  } else {
    console.log('\n⚠️ Có sai lệch số lượng, kiểm tra lại!');
  }

  // 5. Test RPC
  console.log('\n🧪 Test RPC get_dashboard_stats...');
  const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats');
  if (statsError) {
    console.error('  ❌ RPC error:', statsError.message);
  } else {
    console.log('  ✅ Dashboard stats:', JSON.stringify(statsData, null, 2).substring(0, 500));
  }

  console.log('\n✅ Upload V2 hoàn tất!');
}

main().catch(err => {
  console.error('❌ Lỗi nghiêm trọng:', err);
  process.exit(1);
});
