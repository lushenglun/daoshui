# 《倒水大师》美术需求文档 (Art Requirements)

> **文档版本**: v1.0  
> **日期**: 2026-04-30  
> **风格**: 清新简约风 (Clean & Minimal)  
> **目标平台**: 微信小游戏（移动端）

---

## 1. 美术风格总述

### 1.1 核心美学
- **关键词**: 清新、透明、轻盈、治愈、高饱和度、扁平化
- **视觉参考**: Water Sort Puzzle (IEC Global), Love Rescue, Zen Color
- **设计原则**: 
  - 界面留白充足，不拥挤
  - 颜色是主角，界面元素不能抢色
  - 圆角无处不在（按钮、卡片、瓶子）
  - 微动效增强手感（弹性、回弹、缓动）

### 1.2 色彩规范

```css
/* 主色调 */
--primary-bg: #E8F6F3;        /* 主背景 - 薄荷白 */
--secondary-bg: #FFFFFF;       /* 卡片/弹窗背景 */
--accent: #4ECDC4;             /* 强调色 - 薄荷绿 */

/* 功能色 */
--success: #96CEB4;            /* 成功/通关 */
--warning: #FFEAA7;            /* 警告/提示 */
--error: #FF6B6B;              /* 错误/不可操作 */
--info: #45B7D1;               /* 信息/按钮 */

/* 文字色 */
--text-primary: #2D3436;       /* 主文字 */
--text-secondary: #636E72;     /* 次要文字 */
--text-light: #B2BEC3;         /* 禁用/占位 */

/* 液体色板（10种基础色） */
--liquid-1: #FF6B6B;  /* 珊瑚红 */
--liquid-2: #4ECDC4;  /* 薄荷青 */
--liquid-3: #45B7D1;  /* 天空蓝 */
--liquid-4: #96CEB4;  /* 鼠尾草绿 */
--liquid-5: #FFEAA7;  /* 奶油黄 */
--liquid-6: #DDA0DD;  /* 紫丁香 */
--liquid-7: #98D8C8;  /* 浅海绿 */
--liquid-8: #F7DC6F;  /* 柠檬黄 */
--liquid-9: #F093FB;  /* 粉紫 */
--liquid-10: #F5576C; /* 玫红 */
```

---

## 2. UI素材清单

### 2.1 按钮类

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `btn_green` | 400×120 | PNG | 主按钮（开始游戏） | `A clean modern game button, rounded rectangle with smooth gradient from mint green #4ECDC4 to teal, subtle inner glow, soft drop shadow, transparent background, UI asset, minimal style, high quality, 2D game art` |
| `btn_blue` | 400×120 | PNG | 次要按钮 | `A clean modern game button, rounded rectangle with smooth gradient from sky blue #45B7D1 to deeper blue, subtle inner glow, soft drop shadow, transparent background, UI asset, minimal style, high quality, 2D game art` |
| `btn_yellow` | 400×120 | PNG | 奖励/广告按钮 | `A clean modern game button, rounded rectangle with smooth gradient from warm yellow #FFEAA7 to orange, subtle inner glow, coin icon embossed, transparent background, UI asset, minimal style, high quality, 2D game art` |
| `btn_close` | 80×80 | PNG | 关闭按钮 | `A simple circular close button, white X icon on soft red gradient circle, subtle shadow, transparent background, mobile game UI, minimal clean style` |
| `btn_circle_icon` | 120×120 | PNG | 圆形图标按钮底版（签到/排行/设置） | `A circular button base for mobile game UI, soft gradient background, subtle bevel and shadow, empty center for icon overlay, transparent background, minimal clean style, 2D asset` |

### 2.2 弹窗与面板

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `panel_popup` | 600×800 | 9-Slice PNG | 通用弹窗底板 | `A soft rounded rectangle panel for mobile game popup, white to light mint gradient, subtle top highlight, soft shadow underneath, 9-slice ready, clean minimal UI design, transparent background` |
| `panel_level_select` | 128×128 | PNG | 选关格子底板 | `A rounded square button for level selection in mobile puzzle game, soft gradient from white to light gray, subtle border, clean minimal style, transparent background, UI asset` |
| `panel_level_select_locked` | 128×128 | PNG | 选关格子锁定状态 | `A rounded square button for locked level in mobile puzzle game, gray gradient, padlock icon embossed, muted colors, clean minimal style, transparent background, UI asset` |
| `panel_star_empty` | 64×64 | PNG | 空星星 | `An empty star outline icon for game rating, soft gray color, rounded thick stroke, clean minimal style, transparent background, UI asset` |
| `panel_star_filled` | 64×64 | PNG | 实心星星 | `A filled golden star icon for game rating, shiny yellow gradient, subtle sparkle highlight, clean minimal style, transparent background, UI asset` |

### 2.3 图标类

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `icon_coin` | 64×64 | PNG | 金币图标 | `A shiny gold coin icon for mobile game, circular with dollar sign, metallic gradient, subtle sparkle, clean minimal 2D style, transparent background` |
| `icon_diamond` | 64×64 | PNG | 钻石图标 | `A sparkling diamond gem icon for mobile game, light blue crystal, faceted surfaces with shine highlights, clean minimal 2D style, transparent background` |
| `icon_hint` | 64×64 | PNG | 提示灯泡 | `A light bulb hint icon for puzzle game, soft yellow glow, minimal design, rounded shape, transparent background, clean 2D UI style` |
| `icon_undo` | 64×64 | PNG | 撤销箭头 | `A curved undo arrow icon, soft blue color, rounded stroke ends, clean minimal design, transparent background, mobile game UI` |
| `icon_reset` | 64×64 | PNG | 重置/刷新 | `A circular refresh arrow icon, soft green color, rounded stroke, clean minimal design, transparent background, mobile game UI` |
| `icon_pause` | 64×64 | PNG | 暂停 | `A pause icon with two vertical bars, soft gray color, rounded caps, clean minimal design, transparent background, mobile game UI` |
| `icon_sound_on` | 64×64 | PNG | 音量开 | `A speaker with sound waves icon, soft teal color, minimal design, transparent background, mobile game UI` |
| `icon_sound_off` | 64×64 | PNG | 音量关 | `A speaker with X mark icon, soft gray color, minimal design, transparent background, mobile game UI` |
| `icon_music` | 64×64 | PNG | 音乐 | `A musical note icon, soft purple color, rounded shape, clean minimal design, transparent background, mobile game UI` |
| `icon_share` | 64×64 | PNG | 分享 | `A share arrow icon pointing right, soft blue color, rounded shape, clean minimal design, transparent background, mobile game UI` |
| `icon_rank` | 64×64 | PNG | 排行榜 | `A trophy or podium icon for leaderboard, golden gradient, minimal design, transparent background, mobile game UI` |
| `icon_settings` | 64×64 | PNG | 设置 | `A gear/cog settings icon, soft gray color, rounded teeth, clean minimal design, transparent background, mobile game UI` |
| `icon_lock` | 48×48 | PNG | 锁定 | `A small padlock icon, gray metallic, minimal design, transparent background, mobile game UI` |
| `icon_check` | 48×48 | PNG | 勾选 | `A checkmark tick icon, bright green, rounded stroke, clean minimal design, transparent background, mobile game UI` |

---

## 3. 游戏核心美术素材

### 3.1 瓶子 (Bottle)

**设计要求**:
- 透明玻璃质感，能看到内部液体
- 圆角矩形轮廓，底部略圆
- 瓶口敞开，有轻微玻璃厚度表现
- 统一尺寸比例，便于程序缩放

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `bottle_glass` | 128×256 | PNG | 默认透明玻璃瓶 | `A tall transparent glass tube for water sort puzzle game, empty clear glass with subtle refraction and highlight, rounded bottom, open top, clean minimal 2D style, transparent background, game asset, high quality` |
| `bottle_flask` | 128×256 | PNG | 圆底烧瓶（糖果主题） | `A round bottom glass flask for water sort puzzle game, transparent glass with pinkish tint, subtle refraction, clean minimal 2D style, transparent background, game asset, high quality` |
| `bottle_testtube` | 96×288 | PNG | 试管（深海主题） | `A tall slim test tube for water sort puzzle game, transparent glass with blue tint, subtle refraction, clean minimal 2D style, transparent background, game asset, high quality` |
| `bottle_mug` | 160×224 | PNG | 马克杯（金秋主题） | `A ceramic coffee mug for water sort puzzle game, cream colored with subtle texture, open top, clean minimal 2D style, transparent background, game asset, high quality` |
| `bottle_selected` | 128×256 | PNG | 选中状态发光框 | `A golden glow highlight overlay for selected bottle in puzzle game, soft radial gradient, sparkling particles, transparent background, UI effect asset` |

**技术规格**:
- 瓶子内部有效区域高度需精确对齐4格液体
- 瓶口顶部预留 20px 用于倒水动画溢出
- 瓶壁厚度统一 4px

### 3.2 液体方块 (Liquid Block)

**设计要求**:
- 纯色填充，无边框
- 顶部有轻微高光（模拟液体表面）
- 底部与下一格液体自然融合
- 圆角 8px

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `liquid_block` | 120×60 | PNG | 通用液体方块模板 | `A rectangular block of colored liquid for puzzle game, solid vibrant color with subtle top surface highlight and soft rounded corners, semi-transparent jelly-like texture, clean 2D style, transparent background, game asset` |
| `liquid_surface` | 120×16 | PNG | 液体表面高光条 | `A horizontal highlight strip for liquid surface, soft white gradient fading to transparent, rounded top, clean 2D style, transparent background` |

**颜色规范**: 不使用贴图，程序直接染色。但需提供给美术参考确保颜色和谐。

### 3.3 倒水特效

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `effect_pour_stream` | 32×128 | PNG | 倒出的水流 | `A vertical stream of pouring water, smooth gradient, semi-transparent, clean 2D style, transparent background, game effect asset` |
| `effect_splash` | 64×64 | PNG | 落水水花 | `A small water splash effect, white and light blue droplets, radial burst, clean 2D particle style, transparent background` |
| `effect_glow` | 128×128 | PNG | 选中/完成发光 | `A soft radial glow effect, golden color, fading to transparent edges, clean 2D style, transparent background, UI effect` |
| `effect_confetti` | 32×32 | PNG | 通关彩纸（多种颜色） | `A small square confetti piece, vibrant color, slight rotation, clean 2D style, transparent background, particle asset` |
| `effect_star_burst` | 256×256 | PNG | 星星爆发 | `A star burst sparkle effect, golden rays radiating from center, clean 2D style, transparent background, celebration effect` |

---

## 4. 背景与主题素材

### 4.1 章节背景

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `bg_chapter1` | 720×1280 | JPG/PNG | 清新夏日 | `A soft pastel mint green background with subtle watercolor texture, gentle gradients, minimal abstract shapes, calming and fresh atmosphere, mobile game background, high quality, 2D art` |
| `bg_chapter2` | 720×1280 | JPG/PNG | 甜蜜糖果 | `A soft pastel pink background with subtle candy patterns, gentle gradients, minimal sweet atmosphere, mobile game background, high quality, 2D art` |
| `bg_chapter3` | 720×1280 | JPG/PNG | 深海秘境 | `A deep teal blue underwater themed background, subtle bubbles and light rays, mysterious calm atmosphere, mobile game background, high quality, 2D art` |
| `bg_chapter4` | 720×1280 | JPG/PNG | 金秋丰收 | `A warm golden autumn background with subtle falling leaves pattern, cozy atmosphere, mobile game background, high quality, 2D art` |
| `bg_mainmenu` | 720×1280 | JPG/PNG | 主菜单背景 | `A soft gradient background from mint green to white, abstract flowing water shapes, minimalist and calming, mobile game main menu, high quality, 2D art` |

### 4.2 装饰元素

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `deco_wave_top` | 720×200 | PNG | 顶部波浪装饰 | `A soft decorative wave shape, white with subtle shadow, top of screen decoration, transparent background, clean minimal style` |
| `deco_wave_bottom` | 720×200 | PNG | 底部波浪装饰 | `A soft decorative wave shape, white with subtle shadow, bottom of screen decoration, transparent background, clean minimal style` |
| `deco_leaf` | 64×64 | PNG | 叶子装饰（金秋主题） | `A small autumn leaf decoration, warm orange color, simple flat design, transparent background, game decoration asset` |
| `deco_bubble` | 32×32 | PNG | 气泡装饰（深海主题） | `A small transparent bubble, subtle highlight, clean minimal design, transparent background, game decoration asset` |
| `deco_candy` | 48×48 | PNG | 糖果装饰 | `A small wrapped candy decoration, pink and white, simple flat design, transparent background, game decoration asset` |

---

## 5. 角色/头像素材

### 5.1 默认头像框

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `avatar_frame_default` | 128×128 | PNG | 默认头像框 | `A circular avatar frame for mobile game, soft mint green border with subtle gradient, inner transparent circle, clean minimal UI style` |
| `avatar_frame_gold` | 128×128 | PNG | 金主头像框 | `A golden circular avatar frame for VIP player, ornate but minimal design, sparkle effects, inner transparent circle, game UI asset` |
| `avatar_frame_share` | 128×128 | PNG | 分享大使头像框 | `A colorful circular avatar frame for social sharer, rainbow gradient border, inner transparent circle, clean game UI style` |

### 5.2 成就徽章

| 名称 | 尺寸 | 格式 | 说明 | AI提示词 |
|------|------|------|------|----------|
| `badge_perfect` | 128×128 | PNG | 完美主义徽章 | `A golden star badge for game achievement, shiny metallic, ribbon at bottom, clean minimal 2D style, transparent background` |
| `badge_speed` | 128×128 | PNG | 极速通关徽章 | `A lightning bolt speed badge for game achievement, electric blue gradient, clean minimal 2D style, transparent background` |
| `badge_master` | 128×128 | PNG | 倒水大师徽章 | `A water drop crown badge for game achievement, teal and gold gradient, clean minimal 2D style, transparent background` |

---

## 6. 字体规范

### 6.1 中文字体
- **主字体**: 思源黑体 (Source Han Sans / Noto Sans SC)
- **数字/英文**: Montserrat 或 Nunito
- **标题大字**: 可使用站酷快乐体（免费商用）增加趣味性

### 6.2 字号规范（以750px宽屏为基准）

| 用途 | 字号 | 字重 | 颜色 |
|------|------|------|------|
| 游戏标题 | 72px | Bold | `#2D3436` |
| 界面标题 | 48px | Bold | `#2D3436` |
| 按钮文字 | 36px | SemiBold | `#FFFFFF` |
| 正文/说明 | 28px | Regular | `#636E72` |
| 数字（金币等）| 40px | Bold | `#FFEAA7` |
| 小标签 | 22px | Regular | `#B2BEC3` |

---

## 7. 动画规格

### 7.1 Spine/帧动画需求

| 动画 | 类型 | 帧数/时长 | 说明 |
|------|------|-----------|------|
| `anim_bottle_select` | 帧动画 | 0.5s循环 | 瓶子选中后上下浮动5px，缓动 |
| `anim_bottle_shake` | 帧动画 | 0.3s一次 | 错误操作时左右快速抖动3次 |
| `anim_liquid_pour` | 程序Tween | 0.5s | 液体移动+填充（由程序控制） |
| `anim_level_complete` | 粒子+帧动画 | 2.0s | 星星飞出+彩纸飘落 |
| `anim_star_pop` | 帧动画 | 0.4s | 星星放大+发光+回弹 |
| `anim_coin_fly` | 程序Tween | 0.5s | 金币从瓶子飞向UI金币栏 |
| `anim_button_breath` | 帧动画 | 2s循环 | 主按钮轻微缩放呼吸效果 |
| `anim_unlock` | 帧动画 | 0.6s | 锁图标破碎/消失，闪烁 |

### 7.2 粒子特效规格

| 特效 | 粒子数 | 颜色 | 生命周期 | 说明 |
|------|--------|------|----------|------|
| 倒水水花 | 8-12 | 白色/同色 | 0.3s | 落入目标瓶时触发 |
| 通关彩纸 | 30-50 | 随机彩色 | 2-3s | 结算界面，重力下落 |
| 获得星星 | 20 | 金色 | 1.0s | 星星周围散发光点 |
| 按钮点击 | 5 | 白色 | 0.2s | 点击位置小爆发 |

---

## 8. 素材交付规范

### 8.1 文件命名
```
{category}_{name}_{state}.{ext}

示例:
- btn_green_normal.png
- btn_green_pressed.png
- btn_green_disabled.png
- bottle_glass_empty.png
- liquid_block_template.png
- icon_coin_64.png
```

### 8.2 目录结构
```
assets/
├── Textures/
│   ├── UI/
│   │   ├── Buttons/
│   │   ├── Icons/
│   │   ├── Panels/
│   │   └── Progress/
│   ├── Gameplay/
│   │   ├── Bottles/
│   │   ├── Liquids/
│   │   └── Effects/
│   ├── Backgrounds/
│   └── Themes/
│       ├── Chapter1/
│       ├── Chapter2/
│       └── ...
```

### 8.3 技术约束
- **纹理尺寸**: 必须是 2的幂次方 或 4的倍数（便于图集打包）
- **透明通道**: PNG-24 带Alpha，避免锯齿
- **文件大小**: 单张PNG < 200KB，JPG < 500KB
- **图集打包**: 使用 Cocos Creator Auto Atlas，目标单图集 < 2048×2048
- **色彩模式**: RGB/sRGB，禁用CMYK

---

## 9. AI生成提示词速查表

### 通用前缀（适用于所有素材）
```
clean minimal 2D style, mobile game UI asset, transparent background, high quality, soft shadows, rounded shapes
```

### 通用后缀（适用于所有素材）
```
no text, no watermark, isolated on transparent background, game art asset, 2D flat design
```

### 完整示例（可直接复制使用）

**生成瓶子**:
```
A tall transparent glass tube for water sort puzzle game, empty clear glass with subtle refraction and highlight, rounded bottom, open top, clean minimal 2D style, transparent background, game asset, high quality, soft shadows, rounded shapes, no text, no watermark, isolated on transparent background, game art asset, 2D flat design
```

**生成按钮**:
```
A clean modern game button, rounded rectangle with smooth gradient from mint green #4ECDC4 to teal, subtle inner glow, soft drop shadow, transparent background, UI asset, minimal style, high quality, no text, no watermark, isolated on transparent background, game art asset, 2D flat design
```

**生成背景**:
```
A soft pastel mint green background with subtle watercolor texture, gentle gradients, minimal abstract flowing water shapes, calming and fresh atmosphere, mobile game background, high quality, 2D art, no text, no watermark
```

**生成液体方块**:
```
A rectangular block of coral red colored liquid for puzzle game, solid vibrant color with subtle top surface highlight and soft rounded corners, semi-transparent jelly-like texture, clean 2D style, transparent background, game asset, no text, no watermark
```

**生成图标**:
```
A shiny gold coin icon for mobile game, circular with embossed dollar sign, metallic gradient, subtle sparkle, clean minimal 2D style, transparent background, no text, no watermark, isolated, game art asset
```

---

## 10. 美术开发里程碑

| 阶段 | 交付内容 | 预估工时 |
|------|----------|----------|
| **Week 1** | 核心玩法美术 — 瓶子、液体、倒水流、UI按钮、主菜单背景 | 5天 |
| **Week 2** | UI全套 — 弹窗、图标、选关界面、结算界面、设置面板 | 5天 |
| **Week 3** | 主题包1 — 清新夏日完整主题（背景、装饰、特效） | 3天 |
| **Week 4** | 主题包2 — 甜蜜糖果主题 + 成就徽章 + 头像框 | 3天 |
| **Polish** | 动效优化、颜色校准、多设备适配测试 | 2天 |
| **总计** | | **18天** |
