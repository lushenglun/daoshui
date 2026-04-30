# 《倒水大师》代码审查报告

> **日期**: 2026-04-30
> **审查范围**: assets/Scripts/ 全部 TypeScript 代码
> **引擎版本**: Cocos Creator 3.8.8

---

## 一、架构总览

### 1.1 模块依赖图

```
GameManager (主入口，单例)
    ├── LevelManager ←→ WaterSortRules (核心规则引擎)
    ├── Bottle (瓶子渲染组件)
    ├── PourController (倒水动画)
    ├── StorageManager (本地存档)
    ├── EventManager (全局事件)  ← 未被使用
    ├── UIManager (弹窗管理)     ← 仅14行，未发挥作用
    ├── AudioManager (音效)      ← 空方法
    └── WXAPI / AdManager / ShareManager (微信SDK)

UI面板类 (MainMenuPanel/GameplayPanel/...)
    └── 大部分是空壳，GameManager 未使用它们

HintSystem / UndoSystem
    └── 存在但 LevelManager 直接调用了 WaterSortRules，未使用这两个类
```

### 1.2 核心问题：GameManager 过于臃肿

**GameManager.ts (425行)** 承担了以下职责：
- 游戏状态机管理（5种状态切换）
- 主菜单界面绘制（按钮、标签、背景）
- 选关界面绘制（25个关卡按钮网格）
- 游戏界面绘制（HUD、瓶子布局、功能按钮）
- 通关结算弹窗绘制
- 用户输入处理（瓶子点击、撤销、提示、重置）
- 动画协调（倒水动画播放 + 数据更新同步）
- 通用UI工厂（createButton/createLabel/createPanel/drawBackground）

**违反单一职责原则**。建议拆分为：
- `GameManager` — 只保留状态机和场景切换逻辑
- `UIFactory` — 提取 createButton/createLabel/createPanel/drawBackground
- `MainMenuView` / `LevelSelectView` / `GameplayView` / `ResultView` — 各界面独立

---

## 二、Bug 清单

### 🔴 P0 — 严重（会导致运行时错误或数据丢失）

#### Bug-1: StorageManager 存档浅合并导致嵌套数据丢失

**位置**: `StorageManager.ts` 第20行

**代码**:
```typescript
this.data = { ...createDefaultSaveData(), ...JSON.parse(raw) };
```

**问题**: 展开运算符 `...` 是浅拷贝。如果存档中的 `settings` 只包含 `musicEnabled`，合并后 `settings.soundEnabled` 和 `settings.vibrationEnabled` 会丢失（被 `JSON.parse(raw).settings` 完全覆盖）。

**影响**: 玩家关闭音效后，下次进游戏音效设置恢复默认；连续签到进度异常。

**修复**: 使用深度合并函数。

---

#### Bug-2: Bottle 选中动画与抖动动画冲突

**位置**: `Bottle.ts` 第72-76行（setSelected）和第79-86行（playShake）

**代码**:
```typescript
// setSelected
 tween(this.node).stop();  // 只 stop 了当前组件上的 tween
tween(this.node).to(0.12, { position: ... }).start();

// playShake
 tween(this.node).to(0.05, { position: ... }).to(...).start();
```

**问题**: `tween(this.node).stop()` 只能停止通过该 tween 链启动的动画。但 playShake 中的 tween 是另一个实例，无法被 stop。快速连续点击时，两个 tween 会同时操作同一个节点的 position，导致位置错乱。

**影响**: 瓶子位置偏移、选中状态视觉异常。

**修复**: 用一个统一的 tween tag 或 tweenID 来管理，playShake 前先 stop 所有 tween。

---

#### Bug-3: Bottle 抖动后位置与选中状态不一致

**位置**: `Bottle.ts` 第79-86行

**代码**:
```typescript
playShake(): void {
    const original = this.node.position.clone();
    tween(this.node)
        .to(0.05, { position: new Vec3(original.x - 12, original.y, 0) })
        ...
        .to(0.05, { position: original })  // 回到 original
        .start();
}
```

**问题**: `original` 保存的是调用时刻的位置。如果瓶子当前处于**选中状态**（已经上浮14px），抖动结束后会回到 `original`（即继续上浮14px的位置），看起来是对的... 

但等等，如果选中状态下调用 playShake，original 已经是上浮后的位置，回到 original 是对的。问题在于：如果在抖动过程中调用 setSelected(false)，setSelected 里的 tween 会把节点往下移动14px，而 playShake 的 tween 也在操作 position，两者冲突。

更根本的问题是：**Bottle 不知道自己当前是否处于选中状态的位置偏移**。setSelected 直接修改 position.y，但没有记录偏移量。

**修复**: 用 `this.selected` 状态 + 固定偏移量来计算目标位置，而不是直接 tween 到绝对坐标。

---

#### Bug-4: 倒水动画期间数据与视觉不同步

**位置**: `GameManager.ts` 第252-265行

**代码**:
```typescript
const action = this.levelManager.pour(fromIndex, index);  // 数据已更新
...
await PourController.playFlow(...);  // 动画播放中，瓶子数据已变但视觉上还没变
this.isAnimating = false;
this.refreshGameplay();  // 动画结束后才刷新视觉
```

**问题**: `levelManager.pour()` 立即修改了 `currentState`，但视觉上瓶子还是旧状态。动画播放期间（0.34秒），数据和视觉不一致。如果动画被打断或出错，玩家会看到"跳变"。

**影响**: 倒水动画期间，如果玩家快速点击其他瓶子（虽然 isAnimating 屏蔽了输入，但视觉上瓶子状态是旧的）。

**修复**: 动画播放前记录旧状态，动画完成后一次性刷新；或者在动画开始时就用旧状态渲染流动液体，动画结束后再刷新瓶子。

---

### 🟡 P1 — 中等（潜在问题或边界情况）

#### Bug-5: ColorUtils hex 格式校验缺失

**位置**: `ColorUtils.ts` 第4-9行

**代码**:
```typescript
export function colorFromHex(hex: string, alpha = 255): Color {
    const normalized = hex.replace('#', '');
    const value = Number.parseInt(normalized, 16);
    // ...
}
```

**问题**: 如果 `hex = '#GGG'` 或 `hex = ''`，`parseInt` 返回 `NaN`，导致 `Color(NaN, NaN, NaN, alpha)`，渲染为黑色或不可见。

**修复**: 添加格式校验，非法输入时返回默认颜色并打 warning。

---

#### Bug-6: EventManager 内存泄漏风险

**位置**: `EventManager.ts`

**问题**: 
1. 没有 `once` 方法
2. 没有自动清理已销毁组件的监听器
3. 如果组件A监听了事件，组件A被销毁后，handler 仍然留在 Set 中，形成闭包引用，导致组件A无法被垃圾回收。

**修复**: 添加 `once` 方法；提供 `offAll(eventName)` 或自动弱引用机制。

---

#### Bug-7: GameManager 过度使用非空断言 `!`

**位置**: `GameManager.ts` 全文件

**问题**: 代码中有大量 `this.viewRoot!`、`this.popupLayer!`、`this.bottleLayer!` 等非空断言。如果某个 layer 因为异常未被正确初始化，运行时会出现 `Cannot read property 'xxx' of null` 报错。

**修复**: 添加运行时 null 检查，用 `?.` 可选链或提前 return。

---

#### Bug-8: 选关界面关卡数上限硬编码

**位置**: `GameManager.ts` 第98行

**代码**:
```typescript
const maxLevel = Math.max(25, save.currentLevel + 8);
```

**问题**: 硬编码为25关，但实际有150关。玩家通关25关后，选关界面不显示更多关卡。

**修复**: 动态读取章节配置获取总关卡数。

---

### 🟢 P2 — 低（代码整洁度/设计问题）

#### Bug-9: UI面板类是空壳/未被使用

**位置**: `UI/` 目录下全部面板类

**问题**: 
- `MainMenuPanel.ts` — 只有7行空类
- `GameplayPanel.ts` — 有属性定义但 GameManager 没有使用它
- `PausePanel.ts` / `RankPanel.ts` / `ResultPanel.ts` / `SettingsPanel.ts` / `LevelSelectPanel.ts` — 全部是空壳

GameManager 自己用 `createButton`/`createLabel`/`createPanel` 绘制了所有 UI，完全没有使用这些面板类。

**修复方案**: 要么删除这些空壳类，要么将 GameManager 中的 UI 绘制逻辑迁移到对应的面板类中。

---

#### Bug-10: HintSystem / UndoSystem 未被使用

**位置**: `Gameplay/HintSystem.ts`、`Gameplay/UndoSystem.ts`

**问题**: 
- `LevelManager` 自己实现了 `undoStack` 和 `undo()` 方法，没有使用 `UndoSystem` 类
- `LevelManager` 直接调用 `WaterSortRules.findHint()`，没有使用 `HintSystem` 类

这两个类的存在是多余的。

**修复**: 删除这两个类，或在 LevelManager 中使用它们。

---

#### Bug-11: GameplayPanel 属性类型与实际不匹配

**位置**: `GameplayPanel.ts` 第7-9行

**代码**:
```typescript
levelLabel: Label | null = null;
stepLabel: Label | null = null;
coinLabel: Label | null = null;
```

**问题**: 这些属性从未被赋值（没有 `@property` 装饰器，也没有在代码中设置）。即使 GameManager 使用了 GameplayPanel，这些标签也是 null。

---

## 三、修复计划

| 优先级 | Bug | 修复文件 | 预计改动量 |
|--------|-----|----------|-----------|
| P0 | 存档浅合并 | StorageManager.ts | 小 |
| P0 | 动画冲突 | Bottle.ts | 中 |
| P0 | 抖动位置 | Bottle.ts | 小 |
| P0 | 数据视觉不同步 | GameManager.ts | 中 |
| P1 | hex校验 | ColorUtils.ts | 小 |
| P1 | 内存泄漏 | EventManager.ts | 小 |
| P1 | 非空断言 | GameManager.ts | 中 |
| P1 | 选关上限 | GameManager.ts | 小 |
| P2 | 空壳类清理 | UI/* + Gameplay/* | 小 |
