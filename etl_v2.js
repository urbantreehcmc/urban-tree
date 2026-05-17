/**
 * ETL V2: Export dữ liệu từ Supabase Local → JSON tối ưu
 * Gộp 5 bảng (tree_locations, tree_assets, tree_management, tree_growth_logs, tree_maintenance_logs)
 * thành 1 bảng `trees` duy nhất.
 * 
 * Bao gồm:
 * - Chuẩn hóa loài cây (dedup sai chính tả)
 * - Chuẩn hóa phường/quận
 * - Loại bỏ raw_excel_data
 * - Export: trees.json, tree_species_v2.json, wards_v2.json
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CẤU HÌNH
// ============================================
const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const EXPORT_DIR = path.join(__dirname, 'data_export_v2');

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

const supabase = createClient(LOCAL_URL, LOCAL_KEY);

// ============================================
// BẢNG CHUẨN HÓA LOÀI CÂY (sai chính tả → tên chuẩn)
// ============================================
const SPECIES_NORMALIZE = {
  // Bằng Lăng nhóm
  'Bằng Lang Nước': 'Bằng Lăng Nước',
  'Bằng Lằng Nước': 'Bằng Lăng Nước',
  'Bẳng Lăng Nước': 'Bằng Lăng Nước',
  
  // Bò Cạp
  'Bọ Cạp Nước': 'Bò Cạp Nước',
  
  // Da / Đa
  'Đa': 'Da',
  'Đa Búp Đỏ': 'Da Búp Đỏ',
  
  // Dầu Lân / Đầu Lân
  'Dầu Lân': 'Đầu Lân',
  
  // Gõ / Gỏ
  'Gỏ Đỏ': 'Gõ Đỏ',
  'Gỏ Nước': 'Gõ Nước',
  
  // Giáng Hương
  'Giáng Hương (lá Lớn)': 'Giáng Hương Lá Lớn',
  
  // Lê Ki Ma
  'Lêkima': 'Lê Ki Ma',
  
  // Lim nhóm (đây là lỗi phổ biến nhất)
  'Lim Sẹt': 'Lim Sét',
  'Lim Xét': 'Lim Xẹt', // Lim Xẹt là biến thể khác, giữ nguyên
  // Thực ra Lim Sét và Lim Xẹt có thể là cùng 1 loài → gộp hết
  'Lim Xẹt': 'Lim Sét',
  'Lim Xét': 'Lim Sét',
  
  // Lộc Vừng nhóm
  'Lộc Vừng ( Hoa Đỏ)': 'Lộc Vừng Hoa Đỏ',
  'Lộc Vừng (hoa Đỏ)': 'Lộc Vừng Hoa Đỏ',
  'Lộc Vừng (hoa Trắng)': 'Lộc Vừng Hoa Trắng',
  
  // Lòng Mức / Lòng Mứt
  'Lòng Mứt': 'Lòng Mức',
  
  // Muồng
  'Muồng Bông Vàng': 'Muồng Hoàng Yến',
  
  // Ngũ Trão / Ngũ Trảo
  'Ngũ Trão': 'Ngũ Trảo',
  
  // Phượng Vĩ / Phượng Vỹ
  'Phượng Vĩ': 'Phượng Vĩ', // giữ nguyên
  'Phượng vĩ': 'Phượng Vĩ',
  'Phượng Vỹ (hoa Vàng)': 'Phượng Vĩ Hoa Vàng',
  'Phượng Vỹ Hoa Vàng': 'Phượng Vĩ Hoa Vàng',
  
  // Sa Bô Chê / Sapôchê
  'Sa Bô Chê': 'Sapôchê',
  
  // Sa La / Sala
  'Sa La': 'Sala',
  
  // Sến Mũ / Sến Mủ
  'Sến Mũ': 'Sến Mủ',
  
  // Si Vàng → giữ
  // Sơ Ri → giữ
  
  // Chiếc / Chiết
  'Chiết': 'Chiếc',
  'Chiết Sen': 'Chiếc Sen',
  'Chiếc Trắng': 'Chiếc Trắng',
  
  // Vấp / Vắp
  'Vắp': 'Vấp',
  
  // Nhất Ch Mai → có vẻ lỗi đánh máy
  'Nhất Ch Mai': 'Nhất Chi Mai',
  
  // Sp → loại không xác định
  'Sp': 'Không xác định',
  
  // Xanh → quá chung
  'Xanh': 'Không xác định',
};

// ============================================
// BẢNG CHUẨN HÓA PHƯỜNG
// ============================================
const PHUONG_NORMALIZE = {
  'TânHưng': 'Tân Hưng',
  'Tân mỹ': 'Tân Mỹ',
  'Bình tây': 'Bình Tây',
  'Trung mỹ Tây': 'Trung Mỹ Tây',
  'Trung mỹ tây': 'Trung Mỹ Tây',
  'Nhà bè': 'Nhà Bè',
};

// Chuẩn hóa Quận (gộp mã cũ)
const QUAN_NORMALIZE = {
  'BT (Cũ)': 'Bình Thạnh',
  'GV (Cũ)': 'Gò Vấp',
  'NB': 'Nhà Bè',
  'PN (cũ)': 'Phú Nhuận',
  'TB (cũ)': 'Tân Bình',
};

// ============================================
// HÀM CHÍNH
// ============================================

function normalizeSpecies(name) {
  if (!name || name.trim() === '') return null;
  const trimmed = name.trim();
  return SPECIES_NORMALIZE[trimmed] || trimmed;
}

function normalizePhuong(name) {
  if (!name || name.trim() === '') return null;
  const trimmed = name.trim();
  return PHUONG_NORMALIZE[trimmed] || trimmed;
}

function normalizeQuan(name) {
  if (!name || name.trim() === '') return null;
  const trimmed = name.trim();
  return QUAN_NORMALIZE[trimmed] || trimmed;
}

async function fetchAllFromTable(table, select = '*', batchSize = 1000) {
  let allData = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + batchSize - 1)
      .order('id', { ascending: true });

    if (error) {
      console.error(`Lỗi khi đọc bảng ${table} (offset ${from}):`, error.message);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData = allData.concat(data);
      from += batchSize;
      if (data.length < batchSize) hasMore = false;
      process.stdout.write(`\r  ${table}: ${allData.length} bản ghi...`);
    }
  }

  console.log(`\r  ${table}: ${allData.length} bản ghi - HOÀN TẤT`);
  return allData;
}

async function main() {
  console.log('===========================================');
  console.log('  ETL V2: Export & Tối ưu hóa UrbanTree');
  console.log('===========================================\n');

  // ---- Bước 1: Đọc toàn bộ dữ liệu từ Local ----
  console.log('📥 Bước 1: Đọc dữ liệu từ Supabase Local...');
  
  const locations = await fetchAllFromTable('tree_locations',
    'id, legacy_id, dia_chi, phuong, quan, ten_duong, le, khu_vuc, lat, lng');
  
  const assets = await fetchAllFromTable('tree_assets',
    'id, location_id, legacy_id, hieu_so_cay, loai_cay, nam_trong, phan_loai, phan_tan, kich_thuoc_bon, trang_thai_ton_tai');
  
  const management = await fetchAllFromTable('tree_management',
    'location_id, cty, xn, goi, giam_sat');
  
  const growthLogs = await fetchAllFromTable('tree_growth_logs',
    'tree_asset_id, hvn, c13');
  
  const maintenanceLogs = await fetchAllFromTable('tree_maintenance_logs',
    'tree_asset_id, noi_dung');

  // ---- Bước 2: Tạo lookup maps ----
  console.log('\n🔗 Bước 2: Tạo lookup maps...');
  
  const locationMap = {};
  locations.forEach(loc => { locationMap[loc.id] = loc; });
  
  const mgmtMap = {};
  management.forEach(m => { mgmtMap[m.location_id] = m; });
  
  const growthMap = {};
  growthLogs.forEach(g => { growthMap[g.tree_asset_id] = g; });
  
  const maintMap = {};
  maintenanceLogs.forEach(m => { maintMap[m.tree_asset_id] = m; });

  console.log(`  Locations: ${Object.keys(locationMap).length}`);
  console.log(`  Management: ${Object.keys(mgmtMap).length}`);
  console.log(`  Growth Logs: ${Object.keys(growthMap).length}`);
  console.log(`  Maintenance Logs: ${Object.keys(maintMap).length}`);

  // ---- Bước 3: Gộp & Chuẩn hóa ----
  console.log('\n🔄 Bước 3: Gộp & chuẩn hóa dữ liệu...');
  
  const speciesSet = new Set();
  const wardSet = new Map(); // key: "phuong|quan" → value: { phuong, quan }
  
  const trees = [];
  let skipped = 0;
  
  for (const asset of assets) {
    const loc = locationMap[asset.location_id];
    if (!loc) {
      skipped++;
      continue;
    }
    
    const mgmt = mgmtMap[asset.location_id] || {};
    const growth = growthMap[asset.id] || {};
    const maint = maintMap[asset.id] || {};
    
    // Chuẩn hóa
    const loaiCay = normalizeSpecies(asset.loai_cay);
    const phuong = normalizePhuong(loc.phuong);
    const quan = normalizeQuan(loc.quan);
    
    // Thêm vào sets
    if (loaiCay && loaiCay !== 'Không xác định') speciesSet.add(loaiCay);
    if (phuong && quan) {
      const key = `${phuong}|${quan}`;
      if (!wardSet.has(key)) {
        wardSet.set(key, { name: phuong, district: quan });
      }
    }
    
    trees.push({
      id: uuidv4(), // UUID mới cho schema V2
      legacy_id: asset.legacy_id || loc.legacy_id,
      hieu_so_cay: asset.hieu_so_cay,
      // Vị trí
      dia_chi: loc.dia_chi,
      phuong: phuong,
      quan: quan,
      ten_duong: loc.ten_duong,
      le: loc.le,
      khu_vuc: loc.khu_vuc,
      lat: loc.lat,
      lng: loc.lng,
      // Tài sản
      loai_cay: loaiCay,
      nam_trong: asset.nam_trong,
      phan_loai: asset.phan_loai,
      phan_tan: asset.phan_tan,
      kich_thuoc_bon: asset.kich_thuoc_bon,
      trang_thai: asset.trang_thai_ton_tai || 'dang_song',
      // Kỹ thuật
      hvn: growth.hvn || null,
      c13: growth.c13 || null,
      // Quản lý
      cty: mgmt.cty || null,
      xn: mgmt.xn || null,
      goi: mgmt.goi || null,
      giam_sat: mgmt.giam_sat || null,
      // Ghi chú
      ghi_chu: maint.noi_dung || null,
    });
  }

  console.log(`  ✅ Gộp thành công: ${trees.length} cây`);
  console.log(`  ⚠️ Bỏ qua (không có location): ${skipped}`);

  // ---- Bước 4: Tạo bảng species chuẩn ----
  console.log('\n🌿 Bước 4: Tạo danh mục loài cây đã chuẩn hóa...');
  
  const speciesArray = Array.from(speciesSet).sort().map(name => ({
    id: uuidv4(),
    name: name,
  }));
  
  console.log(`  ${speciesArray.length} loài cây (đã gộp trùng lặp từ 259 → ${speciesArray.length})`);

  // Tạo map species_id
  const speciesIdMap = {};
  speciesArray.forEach(s => { speciesIdMap[s.name] = s.id; });
  
  // Gắn species_id vào trees
  trees.forEach(t => {
    t.species_id = t.loai_cay ? (speciesIdMap[t.loai_cay] || null) : null;
  });

  // ---- Bước 5: Tạo bảng wards chuẩn ----
  console.log('\n🏘️ Bước 5: Tạo danh mục phường/quận đã chuẩn hóa...');
  
  const wardsArray = Array.from(wardSet.values()).sort((a, b) => {
    if (a.district !== b.district) return a.district.localeCompare(b.district);
    return a.name.localeCompare(b.name);
  }).map(w => ({
    id: uuidv4(),
    name: w.name,
    district: w.district,
  }));
  
  console.log(`  ${wardsArray.length} phường/xã (đã gộp trùng lặp)`);

  // ---- Bước 6: Export ----
  console.log('\n💾 Bước 6: Xuất file JSON...');
  
  // Save trees (không có raw_excel_data!)
  const treesPath = path.join(EXPORT_DIR, 'trees.json');
  fs.writeFileSync(treesPath, JSON.stringify(trees, null, 0), 'utf-8'); // compact JSON
  const treesSizeMB = (fs.statSync(treesPath).size / 1024 / 1024).toFixed(2);
  console.log(`  trees.json: ${trees.length} bản ghi (${treesSizeMB} MB)`);
  
  // Save species
  const speciesPath = path.join(EXPORT_DIR, 'tree_species_v2.json');
  fs.writeFileSync(speciesPath, JSON.stringify(speciesArray, null, 2), 'utf-8');
  console.log(`  tree_species_v2.json: ${speciesArray.length} loài`);
  
  // Save wards
  const wardsPath = path.join(EXPORT_DIR, 'wards_v2.json');
  fs.writeFileSync(wardsPath, JSON.stringify(wardsArray, null, 2), 'utf-8');
  console.log(`  wards_v2.json: ${wardsArray.length} phường/xã`);

  // ---- Thống kê cuối cùng ----
  console.log('\n===========================================');
  console.log('  📊 THỐNG KÊ EXPORT');
  console.log('===========================================');
  console.log(`  Tổng cây: ${trees.length}`);
  console.log(`  Cây có tọa độ: ${trees.filter(t => t.lat !== null).length}`);
  console.log(`  Cây có ghi chú: ${trees.filter(t => t.ghi_chu !== null).length}`);
  console.log(`  Cây có hvn/c13: ${trees.filter(t => t.hvn !== null || t.c13 !== null).length}`);
  console.log(`  Loài cây (chuẩn hóa): ${speciesArray.length}`);
  console.log(`  Phường/xã: ${wardsArray.length}`);
  
  // So sánh dung lượng
  const oldExportDir = path.join(__dirname, 'data_export');
  if (fs.existsSync(oldExportDir)) {
    let oldSize = 0;
    fs.readdirSync(oldExportDir).forEach(f => {
      oldSize += fs.statSync(path.join(oldExportDir, f)).size;
    });
    const newSize = fs.statSync(treesPath).size + fs.statSync(speciesPath).size + fs.statSync(wardsPath).size;
    console.log(`\n  📦 Dung lượng export cũ (V1): ${(oldSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  📦 Dung lượng export mới (V2): ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  📉 Giảm: ${((1 - newSize / oldSize) * 100).toFixed(1)}%`);
  }
  
  console.log('\n✅ ETL V2 hoàn tất! Files nằm trong: data_export_v2/');
}

main().catch(err => {
  console.error('❌ Lỗi nghiêm trọng:', err);
  process.exit(1);
});
