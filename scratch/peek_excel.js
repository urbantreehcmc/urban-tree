const XLSX = require('xlsx');
const path = require('path');

const files = [
    'g:\\My Drive\\Web App\\UrbanTree\\2026-03-20_SLCX 1.26.xlsx',
    'g:\\My Drive\\Web App\\UrbanTree\\Khối lượng CVCX_Trung tâm quản lý_Sở.xlsx'
];

files.forEach(file => {
    console.log(`--- Analyzing: ${path.basename(file)} ---`);
    try {
        const workbook = XLSX.readFile(file, { sheetRows: 5 });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
            console.log('Sample Data (Row 1):', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data found in the first sheet.');
        }
    } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
    }
    console.log('\n');
});
