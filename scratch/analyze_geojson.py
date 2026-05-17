import json
import os

path = r'g:\My Drive\Web App\UrbanTree\urban-tree\public\data\phuong_xa.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

features = data.get('features', [])
print(f"Total features: {len(features)}")

# Check first 5 features
for i, f in enumerate(features[:10]):
    props = f.get('properties', {})
    print(f"Feature {i} properties: {props}")

# Find one with a real name
for f in features:
    props = f.get('properties', {})
    name = props.get('name') or props.get('Name') or props.get('ten_phuong')
    if name and 'PA168' not in name:
        print(f"Found named feature: {props}")
        break
