const fs = require('fs');
const path = 'g:\\My Drive\\Web App\\UrbanTree\\urban-tree\\public\\data\\phuong_xa.json';

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const features = data.features || [];

console.log(`Total features: ${features.length}`);

for (let i = 0; i < Math.min(10, features.length); i++) {
    console.log(`Feature ${i} properties:`, JSON.stringify(features[i].properties));
}

const named = features.find(f => {
    const p = f.properties || {};
    const name = p.name || p.Name || p.ten_phuong || p.description || "";
    return name && !name.includes('PA168');
});

if (named) {
    console.log('Found named feature:', JSON.stringify(named.properties));
}
