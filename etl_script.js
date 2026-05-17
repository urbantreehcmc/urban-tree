const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

const INPUT_CSV = 'D:\\UrbanTree\\test data 1.csv';
const EXPORT_DIR = path.join(__dirname, 'data_export');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Data Collections
const tree_locations = [];
const tree_assets = [];
const tree_growth_logs = [];
const tree_management = [];
const tree_maintenance_logs = [];

// Master Data Sets (using Set to ensure uniqueness)
const master_streets = new Set();
const master_wards = new Set();
const master_districts = new Set();
const master_contractors = new Set(); // CTY, XN
const master_supervisors = new Set(); // Giám sát
const master_species = new Set();

// Utility function to clean text
function cleanText(text) {
  if (!text) return null;
  let str = text.toString().trim();
  // Normalize extra spaces
  str = str.replace(/\s+/g, ' ');
  return str === '' ? null : str;
}

// Utility function to capitalize words properly (Title Case)
function titleCase(str) {
  if (!str) return null;
  return str.toLowerCase().split(' ').map(function(word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}

// Standardize common misspellings
function standardizeSpecies(species) {
  if (!species) return null;
  let s = cleanText(species);
  if (!s) return null;
  // Specific rules
  if (s.toLowerCase() === 'phượng vỹ') return 'Phượng vĩ';
  
  // Title case for species
  return titleCase(s);
}

// Process row
function processRow(row) {
  // Helper to get value by multiple possible header names (handling font errors)
  const getVal = (names) => {
    for (const name of names) {
      if (row[name] !== undefined) return cleanText(row[name]);
    }
    return null;
  };

  // Raw JSON dump for backup
  const raw_json = JSON.stringify(row);

  // Clean data using aliases
  const legacy_id = getVal(['Ma', 'Mã', 'ID']);
  if (!legacy_id) return; // Skip empty rows

  const so_cay = getVal(['Số cây', 'S? cy', 'So cay']);
  const dia_chi = getVal(['Địa chỉ', 'D?a ch?', 'Dia chi']);
  let phuong = getVal(['Phu?ng', 'Phường', 'Phuong']);
  let quan = getVal(['Quận', 'Qu?n', 'Quan']);
  let ten_duong = getVal(['Tên đường - Công viên', 'Tn du?ng - Cng vin', 'Ten duong']);
  const le = getVal(['Lề', 'L?', 'Le']);
  const kv = getVal(['KV', 'Khu vuc']);
  
  let loai_cay = standardizeSpecies(getVal(['Loài cây', 'Loi cy', 'Loai cay']));
  const nam_trong = getVal(['N trồng', 'N tr?ng', 'Nam trong']);
  const phan_tan = getVal(['Phân tán', 'Phn tn']);
  const bon = getVal(['Bồn', 'B?n', 'Bon']);
  
  // Combine MT, L1, L2, L3 into phan_loai
  let phan_loai = null;
  if (getVal(['MT'])) phan_loai = 'Mới trồng';
  else if (getVal(['L1'])) phan_loai = 'Loại 1';
  else if (getVal(['L2'])) phan_loai = 'Loại 2';
  else if (getVal(['L3'])) phan_loai = 'Loại 3';

  const hvn = getVal(['Hvn', 'Chiều cao']);
  const c13 = getVal(['C1,3', 'Chu vi']);
  
  const cty = getVal(['CTY', 'Công ty', 'thôi']);
  const xn = getVal(['XN', 'Xí nghiệp']);
  const goi = getVal(['Gói', 'Gi']);
  const giam_sat = getVal(['Giám sát', 'Gim st']);
  
  const ghi_chu = getVal(['Ghi chú', 'Ghi ch']);

  // Generate IDs
  const location_id = uuidv4();
  const asset_id = uuidv4();
  
  // Format geo_id (e.g., NTS-AnNhon-72748)
  const safeDuong = ten_duong ? ten_duong.replace(/\s+/g, '').substring(0, 15) : 'Unknown';
  const safePhuong = phuong ? phuong.replace(/\s+/g, '').substring(0, 10) : 'Unknown';
  const geo_id = location_id; // Sử dụng UUID làm geo_id để đảm bảo duy nhất tuyệt đối

  // 1. Location Table
  tree_locations.push({
    id: location_id,
    geo_id: geo_id,
    legacy_id: legacy_id,
    dia_chi: dia_chi,
    phuong: phuong,
    quan: quan,
    ten_duong: ten_duong,
    le: le,
    khu_vuc: kv,
    lat: null, // to be updated via geocoding if needed
    lng: null,
    vn2000_x: null,
    vn2000_y: null
  });

  // 2. Asset Table
  tree_assets.push({
    id: asset_id,
    location_id: location_id,
    legacy_id: legacy_id,
    hieu_so_cay: so_cay, // the physical label on the tree
    loai_cay: loai_cay,
    nam_trong: nam_trong,
    phan_loai: phan_loai,
    phan_tan: phan_tan,
    kich_thuoc_bon: bon,
    trang_thai_ton_tai: 'dang_song', // Default assuming they exist
    raw_excel_data: raw_json
  });

  // 3. Growth Logs
  if (hvn || c13) {
    tree_growth_logs.push({
      id: uuidv4(),
      tree_asset_id: asset_id,
      ngay_do: new Date().toISOString(), // Today's date as upload date
      hvn: hvn ? parseFloat(hvn.replace(',', '.')) : null,
      c13: c13 ? parseFloat(c13.replace(',', '.')) : null
    });
  }

  // 4. Management Table
  if (cty || xn || goi || giam_sat) {
    tree_management.push({
      id: uuidv4(),
      location_id: location_id,
      cty: cty,
      xn: xn,
      goi: goi,
      giam_sat: giam_sat
    });
  }

  // 5. Maintenance Logs
  if (ghi_chu) {
    tree_maintenance_logs.push({
      id: uuidv4(),
      tree_asset_id: asset_id,
      ngay_thuc_hien: new Date().toISOString(),
      noi_dung: ghi_chu,
      loai_cong_viec: 'khac'
    });
  }

  // Add to Master Data Sets
  if (ten_duong) master_streets.add(titleCase(ten_duong));
  if (phuong) master_wards.add(titleCase(phuong));
  if (quan) master_districts.add(titleCase(quan));
  if (loai_cay) master_species.add(loai_cay);
  if (cty) master_contractors.add(titleCase(cty));
  if (xn) master_contractors.add(titleCase(xn));
  if (giam_sat) master_supervisors.add(titleCase(giam_sat));
}

// Write out JSON to file
function saveJson(filename, data) {
  const filePath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved ${data.length} records to ${filename}`);
}

// Start Stream
console.log('Starting to process CSV...');
let rowCount = 0;

fs.createReadStream(INPUT_CSV)
  .pipe(csv({ skipLines: 1 }))
  .on('data', (data) => {
    try {
      processRow(data);
      rowCount++;
      if (rowCount % 10000 === 0) {
         console.log(`Processed ${rowCount} rows...`);
      }
    } catch(err) {
      console.error('Error processing row:', err);
    }
  })
  .on('end', () => {
    console.log(`\nProcessing complete! Total rows processed: ${rowCount}`);
    
    // Save to files
    saveJson('tree_locations.json', tree_locations);
    saveJson('tree_assets.json', tree_assets);
    saveJson('tree_growth_logs.json', tree_growth_logs);
    saveJson('tree_management.json', tree_management);
    saveJson('tree_maintenance_logs.json', tree_maintenance_logs);
    
    // Save master data
    saveJson('master_streets.json', Array.from(master_streets).sort());
    saveJson('master_wards.json', Array.from(master_wards).sort());
    saveJson('master_districts.json', Array.from(master_districts).sort());
    saveJson('master_species.json', Array.from(master_species).sort());
    saveJson('master_contractors.json', Array.from(master_contractors).sort());
    saveJson('master_supervisors.json', Array.from(master_supervisors).sort());

    console.log('\nData migration pre-processing step finished successfully!');
  });
