import json
import sys
sys.path.insert(0, '.')
from generate_levels import generate_chapter, get_chapter_params, solve_astar

# Chapter 3: 50 levels (51-100)
config = {
    'name': '深海秘境',
    'theme': {'backgroundColor': '#E0F7FA', 'bottleStyle': 'testtube', 'liquidStyle': 'solid'},
    'palette': ['#00CED1', '#20B2AA', '#008B8B', '#5F9EA0', '#4682B4', '#1E90FF', '#00BFFF', '#87CEFA']
}

params = get_chapter_params(3, 50)

# 分批生成，每批10关
all_levels = []
for batch in range(5):
    start = 51 + batch * 10
    count = 10
    print(f"Generating batch {batch+1}/5: levels {start}-{start+count-1}")
    
    batch_params = params[batch*10:(batch+1)*10]
    data = generate_chapter(3, config['name'], start, count, config['theme'], config['palette'], batch_params)
    all_levels.extend(data['levels'])

# 保存合并后的文件
output = {
    "chapterId": 3,
    "chapterName": config['name'],
    "unlockLevel": 51,
    "theme": config['theme'],
    "colorPalette": config['palette'],
    "levels": all_levels
}

with open('../assets/Resources/Levels/chapter3.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nChapter 3 complete: {len(all_levels)} levels")
total_steps = sum(l['minSteps'] for l in all_levels)
max_steps = max(l['minSteps'] for l in all_levels)
print(f"Avg: {total_steps/len(all_levels):.1f}, Max: {max_steps}")
