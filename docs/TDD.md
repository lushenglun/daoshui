# 《倒水大师》技术开发文档 (TDD)

> **文档版本**: v1.0  
> **日期**: 2026-04-30  
> **引擎**: Cocos Creator 3.8.8  
> **平台**: 微信小游戏  
> **语言**: TypeScript

---

## 1. 项目结构规划

```
assets/
├── Scripts/
│   ├── Core/                   # 核心框架
│   │   ├── GameManager.ts      # 游戏主管理器（单例）
│   │   ├── EventManager.ts     # 全局事件系统
│   │   ├── AudioManager.ts     # 音效管理器
│   │   ├── UIManager.ts        # UI管理器（弹窗、层级）
│   │   ├── StorageManager.ts   # 存档管理器
│   │   └── SDKManager.ts       # 微信SDK封装
│   ├── Gameplay/               #  gameplay逻辑
│   │   ├── LevelManager.ts     # 关卡管理器
│   │   ├── Bottle.ts           # 瓶子组件
│   │   ├── Liquid.ts           # 液体组件
│   │   ├── PourController.ts   # 倒水控制器（动画+逻辑）
│   │   ├── InputHandler.ts     # 输入处理（点击/触摸）
│   │   ├── HintSystem.ts       # 提示系统
│   │   └── UndoSystem.ts       # 撤销系统
│   ├── UI/                     # UI面板脚本
│   │   ├── MainMenuPanel.ts
│   │   ├── LevelSelectPanel.ts
│   │   ├── GameplayPanel.ts
│   │   ├── PausePanel.ts
│   │   ├── ResultPanel.ts
│   │   ├── SettingsPanel.ts
│   │   └── RankPanel.ts
│   ├── Data/                   # 数据定义与配置
│   │   ├── GameData.ts         # 运行时游戏数据
│   │   ├── PlayerData.ts       # 玩家持久化数据
│   │   ├── LevelConfig.ts      # 关卡配置接口定义
│   │   └── GameConfig.ts       # 全局游戏常量配置
│   ├── Utils/                  # 工具类
│   │   ├── Logger.ts
│   │   ├── MathUtils.ts
│   │   └── ColorUtils.ts
│   └── WeChat/                 # 微信特定功能
│       ├── WXAPI.ts            # 微信API封装
│       ├── AdManager.ts        # 广告管理
│       ├── ShareManager.ts     # 分享管理
│       ├── RankView.ts         # 开放数据域排行榜
│       └── OpenDataContext/    # 开放数据域代码（独立目录）
├── Prefabs/
│   ├── Bottle.prefab           # 瓶子预制体
│   ├── LiquidBlock.prefab      # 单格液体预制体
│   ├── UI/
│   │   ├── MainMenu.prefab
│   │   ├── LevelSelect.prefab
│   │   ├── GameplayHUD.prefab
│   │   ├── ResultPopup.prefab
│   │   └── CommonButton.prefab
│   └── Effects/
│       ├── PourEffect.prefab   # 倒水粒子效果
│       └── StarEffect.prefab   # 通关星星效果
├── Scenes/
│   ├── Gameplay.scene          # 主游戏场景
│   └── Loading.scene           # 加载场景（可选）
├── resources/                  # 动态加载资源（⚠ 必须小写，供 resources.load 使用）
│   ├── Levels/                 # 关卡JSON配置
│   │   ├── chapter1.json
│   │   └── chapter2.json
│   ├── Sounds/
│   │   ├── BGM/
│   │   └── SFX/
│   └── Textures/
│       ├── UI/
│       └── Themes/
└── Animation/
    ├── BottleSelect.anim       # 选中高亮动画
    ├── BottleShake.anim        # 错误抖动动画
    ├── LiquidPour.anim         # 液体倾倒动画（模板）
    └── LevelComplete.anim      # 通关庆祝动画
```

---

## 1.x 开发踩坑记录（务必读）

### 1.x.1 关卡加载失败（`resources.load` 报 `Can not parse this input...`）

**现象**（编辑器预览/浏览器预览/真机都可能出现）：
- 点击开始游戏，弹窗提示“关卡加载失败”
- 控制台/报错中包含：
  - `Can not parse this input: {"path":"Levels/chapter1", ...}`
  - 或在兜底加载时出现 404：`download failed ... status: 404`

**根因**：
- Cocos Creator 3.x 的 `resources.load()` **只会从 `assets/resources/`（必须小写）** 生成的内置 resources bundle 中加载资源。
- 若关卡 JSON 放在 `assets/Resources/`（大写 R）或其他目录，即使文件存在，运行时也可能无法被打包/索引，导致上述错误。

**正确放置方式**：
- 关卡必须放在：
  - `assets/resources/Levels/chapter1.json`
  - `assets/resources/Levels/chapter2.json`
  - ...
- 加载代码路径写法（不带扩展名）：

```typescript
resources.load('Levels/chapter1', JsonAsset, ...)
```

**修复步骤（已验证可用）**：
- 关闭 Creator
- 在文件系统中确保存在 **小写目录**：`assets/resources/Levels/`
- 将 `chapter*.json` 移动/复制到 `assets/resources/Levels/`
- 重新打开 Creator，让资源重新导入（必要时在 Assets 面板触发 Refresh/Reimport）

**自检清单**：
- Assets 面板能看到 `resources/Levels/chapter1`
- 控制台没有持续刷：`[Assets] Read meta ... failed`、`invalid JSON`、`Importer exec failed`

---

### 1.x.2 `.meta` 文件损坏导致资源/脚本无法导入

**现象**：
- 控制台大量警告：
  - `Read meta ... failed`
  - `Unexpected token '﻿' ... is not valid JSON`（常见为 UTF-8 BOM）
  - `Unexpected non-whitespace character after JSON ...`（常见为 meta 文件被拼接成多段 JSON）

**处理方式**：
- 确保每个 `.meta` 文件内容是 **单个合法 JSON 对象**（不能出现两个 `{...}{...}` 连在一起）
- 若存在 BOM/乱码，最稳做法是 **删除该 `.meta` 并在 Creator 内重新导入生成**（注意：若资源被大量引用，删除 meta 会改变 UUID，可能导致引用丢失；操作前先评估影响范围）

---

### 1.x.3 `chapter*.json` 文件被拼接导致导入失败

**现象**：
- 控制台报：
  - `JSON5: invalid character '{' at ...`
  - 或 `Unexpected non-whitespace character after JSON ...`

**根因**：
- JSON 文件内容被错误拼接成多段（例如文件末尾又追加了一份完整 JSON）。

**修复**：
- 保证 `chapter*.json` 仅包含 **一份** JSON（一个顶层 `{ ... }`）

---

### 1.x.4 本次修复涉及的代码改动（追溯用）

**玩法规则**（`assets/Scripts/Gameplay/WaterSortRules.ts`）：
- 允许“部分倒入”（目标瓶空间不足时允许倒入可容纳的部分，而不是直接判定不可倒）
- 提示系统启发式不再把容量写死为 4（改为使用关卡 `capacity`）

**关卡加载**（`assets/Scripts/Gameplay/LevelManager.ts`）：
- 增加章节缓存，减少重复加载
- 加强错误信息（提示检查 `assets/resources/Levels/`）

## 2. 核心系统架构

### 2.1 游戏状态机 (GameStateMachine)

```typescript
enum GameState {
    LOADING,        // 加载中
    MAIN_MENU,      // 主菜单
    LEVEL_SELECT,   // 选关界面
    PLAYING,        // 游戏进行中
    PAUSED,         // 暂停
    LEVEL_COMPLETE, // 关卡完成
    LEVEL_FAILED,   // 关卡失败（本游戏无严格失败，但保留状态）
}
```

状态转换图：
```
LOADING → MAIN_MENU → LEVEL_SELECT → PLAYING
                                    ↓
                              PAUSED（可逆）
                                    ↓
                            LEVEL_COMPLETE
                                    ↓
                              LEVEL_SELECT / PLAYING(下一关)
```

### 2.2 关卡管理器 (LevelManager)

```typescript
class LevelManager {
    private currentLevelId: number = 0;
    private currentState: number[][] = [];  // 当前瓶子状态
    private initialState: number[][] = [];  // 初始状态（用于重置）
    private undoStack: PourAction[] = [];   // 操作栈
    
    // 加载关卡配置
    loadLevel(levelId: number): Promise<void>;
    
    // 检查是否可以倾倒
    canPour(fromIndex: number, toIndex: number): boolean;
    
    // 执行倾倒
    pour(fromIndex: number, toIndex: number): PourAction;
    
    // 撤销上一步
    undo(): boolean;
    
    // 检查是否通关
    checkWin(): boolean;
    
    // 获取提示
    getHint(): [number, number] | null;
    
    // 重置关卡
    reset(): void;
}
```

### 2.3 瓶子与液体数据模型

#### Bottle 组件
```typescript
interface BottleConfig {
    capacity: number;       // 容量（格数，默认4）
    colorId: number;        // 当前瓶子的主题色（装饰用）
}

class Bottle extends Component {
    private capacity: number = 4;
    private liquids: Liquid[] = [];  // 从底到顶
    
    // 获取顶部颜色ID
    getTopColorId(): number | null;
    
    // 获取顶部连续同色层数
    getTopColorCount(): number;
    
    // 获取剩余空间
    getRemainingSpace(): number;
    
    // 是否为空
    isEmpty(): boolean;
    
    // 是否为单一颜色（通关判定用）
    isUniform(): boolean;
    
    // 添加液体（视觉+数据）
    addLiquids(colorId: number, count: number): Promise<void>;
    
    // 移除液体（用于撤销）
    removeLiquids(count: number): void;
    
    // 设置选中状态
    setSelected(selected: boolean): void;
    
    // 播放错误抖动
    playShake(): void;
}
```

#### Liquid 组件
```typescript
class Liquid extends Component {
    private colorId: number;
    private colorHex: string;
    
    // 设置颜色
    setColor(colorId: number, hex: string): void;
    
    // 播放填充动画
    playFillAnimation(duration: number): Promise<void>;
    
    // 播放移除动画
    playRemoveAnimation(duration: number): Promise<void>;
}
```

### 2.4 倒水动画系统 (PourController)

动画采用 **Tween + 动态节点** 方案：

```
1. 在源瓶顶部创建临时液体节点（与源瓶顶部同色）
2. Tween移动临时节点到目标瓶上方
3. 目标瓶播放液体"上升填充"动画
4. 同时源瓶播放液体"下降缩减"动画
5. 销毁临时节点
```

动画时长参数：
- 液体移动: 0.3s (EaseInOutQuad)
- 填充/缩减: 0.2s (EaseOutQuad)
- 整体一气呵成，总时长约 0.5s

```typescript
class PourController {
    async playPourAnimation(
        fromBottle: Bottle,
        toBottle: Bottle,
        colorId: number,
        layerCount: number
    ): Promise<void> {
        // 1. 创建流动液体条
        const flowLiquid = this.createFlowLiquid(colorId);
        
        // 2. 移动到目标位置
        await tween(flowLiquid)
            .to(0.3, { position: toBottle.getTopPosition() })
            .start()
            .promise();
        
        // 3. 同步执行填充和缩减
        await Promise.all([
            toBottle.addLiquids(colorId, layerCount),
            fromBottle.removeLiquids(layerCount)
        ]);
        
        // 4. 销毁流动节点
        flowLiquid.destroy();
    }
}
```

### 2.5 提示系统 (HintSystem)

基于BFS寻找最短路径中的一步：

```typescript
class HintSystem {
    // 返回 [fromIndex, toIndex] 或 null
    findHint(currentState: number[][]): [number, number] | null {
        // 1. 尝试所有合法移动
        // 2. 评估每个移动后的局面（使用启发式函数）
        // 3. 选择能最接近胜利状态的一步
        // 启发式：优先减少颜色分散度、优先填满瓶子
    }
    
    private heuristic(state: number[][]): number {
        // 计算所有非空瓶子的颜色种类数之和
        // 和越小越好
    }
}
```

### 2.6 存档系统 (StorageManager)

采用 **微信云存 + LocalStorage双写** 策略：

```typescript
interface PlayerSaveData {
    version: number;
    lastSaveTime: number;
    currentLevel: number;           // 当前最高解锁关卡
    completedLevels: number[];      // 已通关关卡ID列表
    levelStars: Record<number, number>;  // 关卡→星数映射
    coins: number;
    diamonds: number;
    unlockedThemes: number[];
    settings: {
        musicEnabled: boolean;
        soundEnabled: boolean;
        vibrationEnabled: boolean;
    };
    dailyCheckIn: {
        lastCheckInDate: string;    // YYYY-MM-DD
        consecutiveDays: number;
        checkInHistory: boolean[];  // 7天
    };
    statistics: {
        totalPlayTime: number;      // 秒
        totalLevelsCompleted: number;
        totalAdsWatched: number;
        bestUndoStreak: number;
    };
}
```

存档策略：
- **自动存档**: 每完成一关、每次返回主菜单时自动保存
- **云存频率**: 每天首次登录时拉取云存；每次存档后同步到云端
- **冲突解决**: 以时间戳较新的为准，合并关键数据（取最大值）

---

## 3. 微信SDK接入清单

### 3.1 基础API封装 (WXAPI.ts)

```typescript
class WXAPI {
    // 登录
    static login(): Promise<string>;  // 返回code
    
    // 获取用户信息
    static getUserInfo(): Promise<UserInfo>;
    
    // 短震动
    static vibrateShort(): void;
    
    // 长震动
    static vibrateLong(): void;
    
    // 显示Toast
    static showToast(title: string, icon?: string): void;
    
    // 显示Loading
    static showLoading(title: string): void;
    
    // 隐藏Loading
    static hideLoading(): void;
    
    // 获取系统信息（安全区、屏幕尺寸）
    static getSystemInfo(): SystemInfo;
}
```

### 3.2 广告管理 (AdManager)

```typescript
class AdManager {
    // 激励视频
    static showRewardedVideo(adId: string): Promise<boolean>;
    
    // 插屏广告
    static showInterstitial(adId: string): Promise<boolean>;
    
    // Banner广告
    static showBanner(adId: string, position: BannerPosition): void;
    static hideBanner(): void;
    
    // 预加载
    static preloadAds(): void;
}
```

**广告位ID配置** (GameConfig.ts):
```typescript
export const AD_CONFIG = {
    rewardedVideo: 'adunit-xxxxxxxxxxxxxxxx',  // 激励视频
    interstitial: 'adunit-yyyyyyyyyyyyyyyy',   // 插屏
    banner: 'adunit-zzzzzzzzzzzzzzzz',         // Banner
};
```

### 3.3 分享管理 (ShareManager)

```typescript
class ShareManager {
    // 设置分享按钮
    static setupShareButton(options: ShareOptions): void;
    
    // 主动分享
    static share(title: string, imageUrl: string, query: string): Promise<ShareResult>;
    
    // 生成分享图（动态Canvas）
    static generateShareCanvas(level: number, steps: number): string;  // 返回临时文件路径
}
```

### 3.4 开放数据域 (排行榜)

**主域** (`RankPanel.ts`):
```typescript
// 发送消息到开放数据域
wx.getOpenDataContext().postMessage({
    action: 'showRank',
    data: {
        type: 'friend',
        key: 'totalStars'
    }
});
```

**开放数据域** (`OpenDataContext/index.js`):
```javascript
// 使用微信开放数据域API绘制排行榜
wx.onMessage((data) => {
    if (data.action === 'showRank') {
        wx.getFriendCloudStorage({
            keyList: [data.data.key],
            success: (res) => {
                // 绘制排行榜到共享Canvas
                drawRankList(res.data);
            }
        });
    }
});
```

---

## 4. 性能优化要点

### 4.1 DrawCall控制
- 使用 **自动图集 (Auto Atlas)** 合并UI贴图
- 液体方块使用同一材质，仅通过颜色属性区分（1个DrawCall）
- 瓶子玻璃效果使用单一Sprite，避免复杂Shader

### 4.2 资源分包
```json
// game.json 配置
{
  "subpackages": [
    {
      "name": "levels",
      "root": "assets/Resources/Levels/"
    },
    {
      "name": "themes",
      "root": "assets/Resources/Textures/Themes/"
    }
  ]
}
```

### 4.3 内存管理
- 关卡切换时清理上一关动态生成的液体节点
- 使用对象池 (NodePool) 复用液体方块和特效节点
- 音频资源按需加载，BGM常驻内存

### 4.4 微信小游戏特定优化
- 首包大小控制 **< 4MB**
- 使用 `wx.triggerGC()` 在关卡切换时主动触发垃圾回收
- 降低物理帧率（本游戏无物理，逻辑帧30fps足够）
- 适配刘海屏：读取 `safeArea` 调整UI布局

---

## 5. 关键技术决策

### 5.1 为什么不用Cocos物理引擎？
本游戏为纯逻辑益智游戏，液体移动完全由Tween动画控制，无需真实物理模拟。使用物理引擎反而增加开销和不可控性。

### 5.2 关卡数据存储方式
- 前100关打包进首包（JSON文件）
- 后续关卡使用分包加载或从服务器动态获取
- 支持热更新关卡配置，无需发版即可新增关卡

### 5.3 颜色渲染方案
- 液体方块使用基础Sprite + Color属性
- 不采用多张贴图，通过程序调色实现主题切换
- 颜色配置表：
```typescript
export const COLOR_PALETTES = {
    default: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    candy: ['#FF69B4', '#FF1493', '#FFB6C1', '#FFA07A', '#FFD700'],
    // ...
};
```

### 5.4 输入响应优化
- 倒水动画播放期间**屏蔽输入**，防止快速连点导致状态错乱
- 使用 `input.on(Input.EventType.TOUCH_END)` 而非TOUCH_START，避免误触
- 双击检测间隔：300ms

---

## 6. 开发里程碑

| 阶段 | 内容 | 预估工时 |
|------|------|----------|
| **M1** | 项目搭建 + 核心玩法（瓶子、倒水、通关判定） | 3天 |
| **M2** | 关卡系统 + 存档 + 提示/撤销 | 2天 |
| **M3** | UI全流程（菜单、选关、结算、设置） | 3天 |
| **M4** | 微信SDK接入（登录、分享、广告、排行榜） | 3天 |
| **M5** | 音效、特效、 polish、性能优化 | 2天 |
| **M6** | 测试、调优、上架准备 | 2天 |
| **总计** | | **15天** |

---

## 7. 当前实现状态

> 更新时间: 2026-04-30

### 7.1 已完成

- `Gameplay.scene` 已挂接 `GameManager`，预览场景即可进入游戏主流程。
- 已按 TDD 目录创建脚本结构：
  - `Core/`: `GameManager`、`StorageManager`、`EventManager`、`AudioManager`、`UIManager`、`SDKManager`
  - `Gameplay/`: `LevelManager`、`Bottle`、`PourController`、`WaterSortRules`、`HintSystem`、`UndoSystem`
  - `Data/`: `GameConfig`、`GameData`、`LevelConfig`
  - `UI/`: 主菜单、选关、游戏、暂停、结算、设置、排行榜面板脚本占位
  - `WeChat/`: `WXAPI`、`AdManager`、`ShareManager` 占位封装
- 当前 UI 采用运行时动态创建，不依赖 Prefab 或美术资源；可正常显示主菜单、选关页、Gameplay HUD、瓶子和液体。
- 关卡加载已支持扫描 `chapter1` 至 `chapter4`，不再假设每章固定 25 关。
- 已实现基础玩法：
  - 点击选择瓶子
  - 合法倒水判定
  - 连续同色层一次性倾倒
  - 容量限制
  - 胜利判定
  - 撤销、重置、提示入口
  - 通关结算、星级、金币奖励、本地存档
- 已修复 Cocos `.meta` 文件 BOM 问题，所有 `.meta` 使用无 BOM UTF-8。
- 已修复白色按钮文字不可见问题，按钮文字会根据按钮背景自动选择深/浅色。

### 7.2 当前运行方式

1. 使用 Cocos Creator 3.8.8 打开项目。
2. 打开 `assets/Scenes/Gameplay.scene`。
3. 点击预览运行。
4. 预览器中的 FPS/DrawCall 面板来自 Cocos `Show FPS`，不是游戏 UI。

### 7.3 技术备注

- 当前阶段优先保证玩法闭环，瓶子、液体、按钮、弹窗都由 `GameManager` 和 `Bottle` 运行时绘制。
- 后续接入美术资源时，建议将运行时绘制的按钮、瓶子、弹窗逐步替换为 Prefab，但保持 `LevelManager` 与 `WaterSortRules` 不依赖 UI。
- Cocos 资源挂接依赖 `.meta` UUID；如果脚本 `.meta` 被编辑器重建，需要检查 `Gameplay.scene` 中 `GameManager` 的组件引用是否仍有效。
- TypeScript 检查命令：

```bash
node "C:\ProgramData\cocos\editors\Creator\3.8.8\resources\app.asar.unpacked\node_modules\typescript\lib\tsc.js" --noEmit --skipLibCheck
```

### 7.4 待完成

- 将当前运行时 UI 拆分为 Prefab：主菜单、选关、HUD、暂停、结算弹窗。
- 接入美术资源：瓶子、液体、按钮、背景、特效。
- 补齐倒水动画表现：倾斜瓶子、水流、落水水花、液体填充/缩减同步。
- 完善暂停面板、设置面板、排行榜、每日签到、主题商店、成就。
- 接入微信小游戏能力：分享、广告、排行榜开放数据域、震动、安全区适配。
- 做关卡难度与经济奖励调优。
