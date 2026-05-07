# 《倒水乐乐乐》技术开发文档 (TDD)

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
    PAUSED,         // 暂停（v0.2 完善）
    SETTINGS,       // 设置面板（v0.2 新增）
    LEVEL_COMPLETE, // 关卡完成
    LEVEL_FAILED,   // 关卡失败（本游戏无严格失败，但保留状态）
}
```

状态转换图（v0.2 更新）：
```
LOADING → MAIN_MENU → LEVEL_SELECT → PLAYING
                      ↑             ↓ ↑
                      └──────── SETTINGS  PAUSED（可逆）
                                    ↓
                            LEVEL_COMPLETE
                                    ↓
                              LEVEL_SELECT / PLAYING(下一关)

PAUSED 状态子流转：
  PLAYING ──[暂停按钮/返回键/切后台]──→ PAUSED
  PAUSED  ──[继续游戏]────────────────→ PLAYING
  PAUSED  ──[重新开始]────────────────→ PLAYING（重置后）
  PAUSED  ──[返回主菜单]──────────────→ MAIN_MENU（需二次确认）
  PAUSED  ──[设置]───────────────────→ SETTINGS
  SETTINGS ──[关闭]──────────────────→ PAUSED（从暂停进入时）
  SETTINGS ──[关闭]──────────────────→ MAIN_MENU（从主菜单进入时）
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
    static showRewardedVideo(scene: 'hint' | 'undo' | 'double_coins' | 'free_coins'): Promise<RewardedResult>;
    static showInterstitial(levelId: number): Promise<boolean>;
    static showBanner(): void;
    static hideBanner(): void;
    static preloadAds(): void;
    static preloadRewardedVideo(): void;
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

> 当前版本: v0.4.0 广告体验版

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
- 选关页已改为读取已打包章节中的真实最大关卡 ID，不再依赖硬编码总数或访问私有缓存。
- Gameplay 已增加状态提示文本，用于反馈选择、无效操作、倒水、撤销、重置和提示结果。
- 已支持双击瓶子自动寻找可倒目标，降低试玩操作成本。
- v0.2 已实现暂停弹窗基础版：遮罩、继续游戏、重新开始、返回主菜单、二次确认、设置入口。
- v0.2 已实现设置面板基础版：音乐/音效/震动开关、适龄提示、隐私协议；v0.4 已移除去广告/IAP入口。
- v0.2 已扩展主菜单入口：签到、排行、设置、商店、每日挑战、成就。
- v0.2 已实现每日签到基础版：7日循环奖励，金币/钻石写入本地存档。
- v0.2 已补齐结算弹窗双倍奖励占位，等待微信激励视频广告接入。
- v0.2 已补齐结算星星动画：三颗空星常驻，获得星星按 0.3s 间隔依次亮起，单颗 0.4s 缩放回弹，并带 6 个光点散射。
- v0.2 已新增开发期 GM 工具：
  - 入口：主菜单/暂停菜单 → 设置 → 底部 `GM`。
  - 可查看当前存档摘要。
  - 可重置本地存档，重置前有二次确认。
- v0.3 已接入微信测试底座：
  - `WXAPI` 封装登录、分享、开放数据域消息、用户云排行榜字段写入。
  - `SDKManager` 启动后静默登录并触发云存档同步，失败不阻塞试玩。
  - `CloudSaveManager` 支持云函数预留与编辑器本地 shadow 存档降级，合并策略按 `lastSaveTime` + 进度/星级取高。
  - `ShareManager` 支持主菜单分享求助每日首次 50 金币奖励，以及结算分享炫耀。
  - `RankManager` 支持好友排行榜入口与编辑器预览数据，微信环境会向开放数据域发送绘制消息。
- v0.3 QA 修复记录（2026-05-01）：
  - 登录流程必须输出 mock/真实 login code 日志，便于 L01/L02 验收。
  - 主菜单分享求助奖励必须先判断当日领取状态，已领取时不再拉起重复奖励流程，提示“不重复发放”。

### 7.2 当前运行方式

1. 使用 Cocos Creator 3.8.8 打开项目。
2. 打开 `assets/Scenes/Gameplay.scene`。
3. 点击预览运行。
4. 预览器中的 FPS/DrawCall 面板来自 Cocos `Show FPS`，不是游戏 UI。

### 7.3 技术备注

- 当前阶段优先保证玩法闭环，瓶子、液体、按钮、弹窗都由 `GameManager` 和 `Bottle` 运行时绘制。
- 后续接入美术资源时，建议将运行时绘制的按钮、瓶子、弹窗逐步替换为 Prefab，但保持 `LevelManager` 与 `WaterSortRules` 不依赖 UI。
- Cocos 资源挂接依赖 `.meta` UUID；如果脚本 `.meta` 被编辑器重建，需要检查 `Gameplay.scene` 中 `GameManager` 的组件引用是否仍有效。
- `LevelManager` 负责关卡数据、合法目标枚举和章节缓存；UI 层不应直接读取其私有字段。
- 当前本地存档键为 `water_sort_save_v1`，由 `StorageManager` 统一读写。开发期优先使用 GM 面板重置存档，避免手动清错浏览器缓存。
- 弹窗状态回退要显式允许来源状态，例如局内 `PAUSED -> SETTINGS -> PAUSED`。不要只允许 `PLAYING` 打开暂停弹窗，否则设置面板关闭会被状态机拦截。
- 设置面板开关必须局部刷新，不应通过重建整个 SettingsPanel 更新状态，否则每次切换都会触发弹窗入场动画。
- 弹窗遮罩、弹窗主体和 GM 摘要等非按钮区域必须吞掉触摸事件，避免事件穿透到底层主菜单/选关按钮。
- TypeScript 检查命令：

```bash
node "C:\ProgramData\cocos\editors\Creator\3.8.8\resources\app.asar.unpacked\node_modules\typescript\lib\tsc.js" --noEmit --skipLibCheck
```

### 7.4 v0.4 云测性能优化记录

**云测输入**: `1778069087_wxcaa9c33b169f6043_testcloud_result.xlsx` 与同批次控制台日志。

**云测结论**:
- 测试结果成功，网络性能/兼容性评分均为 100。
- 启动性能 85，运行性能 84；10 台设备均提示建议优化。
- 启动耗时均值 4317ms，最慢设备约 6152ms；主要耗时集中在代码包下载与启动期 SDK 初始化。
- FPS 均值 59.0，低端设备 `vivo S1` 为 55 FPS。
- 内存均值 847.4MB，部分 Android 设备峰值超过 1GB。
- 控制台发现占位 Banner 广告位触发 `no advertisement`，并出现未处理 promise 错误。

**已完成优化**:
- `SDKManager.initialize()` 延后云初始化/登录同步与广告预加载，避免首屏刚出现时执行云存档和广告 SDK 调用。
- `AdManager` 增加广告位 ID 有效性检查；占位 ID 下直接短路，不再调用微信广告 API。
- `WXAPI.showBanner()` / `hideBanner()` / `preloadRewardedVideo()` 捕获 Promise 失败，避免广告错误进入未处理异常。
- `GameManager.renderBottles()` 在同一关内复用 Bottle 节点，只更新瓶内状态，减少倒水过程中的节点销毁、重建和 Graphics 分配。

**下轮云测关注**:
- 启动耗时是否下降，特别是低端 Android 的 6s+ 设备。
- 控制台是否不再出现 `no advertisement` 未处理错误。
- `vivo S1` FPS 是否从 55 向 60 回升，内存峰值是否下降。

### 7.5 v0.2 变更记录

**新增状态**: `SETTINGS` — 设置面板状态，可从 `PAUSED` 或 `MAIN_MENU` 进入。

**新增组件规格**:
- `ToggleSwitch` — 自定义开关组件，96×52px，胶囊轨道 + 44px 圆点，纯 Graphics 绘制。
- `RedDot` — 红点提示组件，20px 圆形脉冲动画，用于主菜单按钮。

**输入屏蔽规则更新**:
- `PAUSED` 状态下：瓶子点击无效、撤销/提示/重置按钮无效，仅响应弹窗内交互。
- `SETTINGS` 状态下：同理屏蔽 gameplay 输入。

**存档数据结构更新**:
- `PlayerSaveData.settings` 已绑定 `musicEnabled` / `soundEnabled` / `vibrationEnabled`。
- `PlayerSaveData.flags.hasShownAgeTip` 用于记录适龄提示是否已展示。

### 7.6 待完成

- [x] v0.1 核心玩法闭环（已完成）
- [x] **v0.2** 完善暂停面板（PausePanel）：遮罩、二次确认、基础弹出动效
- [x] **v0.2** 实现设置面板（SettingsPanel）：三开关、适龄提示、隐私协议占位
- [x] **v0.2** 结算界面：星星依次亮起动画、双倍奖励入口占位、下一关、返回选关闭环
- [x] **v0.2** 主菜单扩展：签到/排行/设置/商店/每日挑战/成就入口
- [x] **v0.2** 每日签到基础版：7日循环奖励、本地存档
- [x] **v0.2** GM 工具：查看存档摘要、二次确认重置存档
- [ ] **v0.2** AudioManager 基础实现：BGM/SFX 播放、音量控制
- [x] v0.3 微信登录与存档云同步（接口封装 + 编辑器降级 + 云函数预留）
- [x] v0.3 分享功能：文案库、分享触发、每日首次奖励发放
- [x] v0.3 好友排行榜：主域面板 + 开放数据域消息 + 编辑器预览数据
- [x] **v0.4** 激励视频广告：提示/撤销/双倍金币/通用奖励 四个点位（**Mock 模式已实现**，真实广告待流量主开通后切开关）
- [x] **v0.4** 插屏广告：关卡间隔策略（Mock 模式已实现）
- [x] **v0.4** Banner 广告：主菜单/选关/结算展示（Mock 模式已实现）
- [x] ~~v0.4 去广告内购~~ — 已决策关闭所有内购/直冲渠道，纯广告变现
- [x] **v0.5** 每日签到正式版：7天格子动画、连续签到加成、看视频补签、断签重置
- [x] **v0.5** 成就系统：10个成就配置、解锁动画、成就列表面板、领取奖励
- [x] **v0.5** 主题商店：7主题卡片预览（迷你瓶子绘制）、金币/钻石解锁、即时切换
- [x] **v0.5** 每日挑战：日期种子选关、无限重试、个人最佳记录、倒计时
- [x] **v0.5** 存档扩展：achievements / dailyChallenge / unlockedThemes / currentTheme / currentThemeId

### v0.5 留存运营系统实现记录（2026-05-07）

- 新增 `assets/Scripts/Data/V05Config.ts`，集中维护每日签到奖励、10个成就配置、7套主题配置。
- 扩展 `PlayerSaveData`：`achievements`、`dailyChallenge`、`unlockedThemes: string[]`、`currentTheme/currentThemeId`、补签周计数字段；`StorageManager.normalizeSaveData()` 兼容旧版数字主题存档。
- 主菜单入口已接入正式面板：每日签到、主题商店、每日挑战、成就；每日首次进入主菜单会延迟弹出签到面板。
- 激励广告 Mock 模式默认开启，补签场景使用 `check_in_makeup`，观看次数仍累计到 `ad_watcher_50` 与 VIP 主题进度。
- 每日挑战采用日期种子固定关卡，记录当天个人最佳步数，首次完成发放 100 金币，可无限重试。
- 通关、撤销、提示、分享、广告、每日挑战完成已接入成就进度检测；成就达成会播放顶部横幅，并可在成就面板领取奖励。
- 验证：`node "C:\ProgramData\cocos\editors\Creator\3.8.8\resources\app.asar.unpacked\node_modules\typescript\lib\tsc.js" --noEmit --skipLibCheck` 通过。
- [ ] 长期：将运行时 UI 拆分为 Prefab（可选优化）
- [ ] 长期：接入美术资源替换纯代码绘制（可选优化）
- [ ] 长期：关卡难度与经济奖励调优（根据上线数据）
