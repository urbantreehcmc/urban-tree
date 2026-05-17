const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const data = JSON.parse(fs.readFileSync('data_export/tree_locations.json', 'utf-8'));
  console.log('Tổng số vị trí:', data.length);

  for (let i = 0; i < data.length; i += 1000) {
    const chunk = data.slice(i, i + 1000);
    const { error } = await supabase.from('tree_locations').upsert(chunk);
    
    if (error) {
      console.log(`Lỗi tại cụm ${i} - ${i + chunk.length}. Đang kiểm tra từng dòng...`);
      for (const item of chunk) {
        const { error: err2 } = await supabase.from('tree_locations').upsert(item);
        if (err2) {
          console.error(`  ❌ Lỗi geo_id: ${item.geo_id} | Message: ${err2.message}`);
        }
      }
    } else {
      if (i % 5000 === 0) console.log(`✅ Đã nạp thành công ${i} vị trí...`);
    }
  }
  console.log('--- HOÀN TẤT NẠP VỊ TRÍ ---');
}

run();
