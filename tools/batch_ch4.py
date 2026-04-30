import json
import sys
sys.path.insert(0, '.')
from generate_levels import generate_chapter, get_chapter_params

config = {
    'name': '金秋丰收',
    'theme': {'backgroundColor': '#FFF8E1', 'bottleStyle': 'mug', 'liquidStyle': 'solid'},
    'palette': ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#F5DEB3', '#FFE4B5', '#FFDEAD']
}

params = get_chapter_params(4, 100)

all_levels = []
for batch in range(20):  # 20 batches of 5
    start = 101 + batch * 5
    count = 5
    print(f"Batch {batch+1}/20: {start}-{start+count-1}")
    
    batch_params = params[batch*5:(batch+1)*5]
    data = generate_chapter(4, config['name'], start, count, config['theme'], config['palette'], batch_params)
    all_levels.extend(data['levels'])

output = {
    "chapterId": 4,
    "chapterName": config['name'],
    "unlockLevel": 101,
    "theme": config['theme'],
    "colorPalette": config['palette'],
    "levels": all_levels
}

with open('../assets/Resources/Levels/chapter4.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nChapter 4: {len(all_levels)} levels")
total = sum(l['minSteps'] for l in all_levels)
print(f"Avg: {total/len(all_levels):.1f}, Max: {max(l['minSteps'] for l in all_levels)}")
