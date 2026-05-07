# 《倒水乐乐乐》音频需求规格书

> **文档版本**: v1.0  
> **日期**: 2026-05-07  
> **目标读者**: 音频制作团队 / 音效设计师  
> **对应游戏版本**: v0.5.1

---

## 1. 项目背景

《倒水乐乐乐》是一款微信小游戏平台的益智类倒水排序游戏。玩家通过点击瓶子将同色液体倒在一起，完成关卡目标。游戏风格**轻松休闲、清新明快**，目标受众为 12+ 泛休闲玩家。

**音频设计目标**：
- 强化操作反馈，让每一次点击都有「爽感」
- BGM 不喧宾夺主，适合长时间游玩
- 音效风格统一：轻快、水晶感、微卡通
- 总音频包大小控制在 **< 2MB**（微信小游戏首包限制）

---

## 2. 音频分类总览

| 类别 | 数量 | 说明 |
|---|---|---|
| **BGM** | 3 首 | 主菜单、关卡游玩、胜利结算 |
| **UI 音效** | 6 个 | 按钮、面板、开关等界面交互 |
| **Gameplay 核心音效** | 10 个 | 倒水、选中、错误、撤销等 |
| **系统反馈音效** | 10 个 | 签到、成就、金币、主题等 |
| **合计** | **29 个** | — |

---

## 3. BGM（背景音乐）

### 3.1 规格要求

- **格式**: MP3（微信小游戏兼容性最佳）
- **码率**: 128kbps
- **循环**: 所有 BGM 需首尾无缝循环
- **音量**: 由程序动态控制（默认 50%，玩家可在设置面板调节）

### 3.2 BGM 清单

#### BGM_01 — 主菜单 (`bgm_main_menu`)

| 属性 | 要求 |
|---|---|
| **触发场景** | 主菜单、选关页、设置面板、排行榜等所有非游戏界面 |
| **情绪** | 轻松、愉悦、略带期待感 |
| **风格参考** | 《Monument Valley》主菜单 / 《Two Dots》BGM |
| **配器建议** | 木吉他拨弦 + 轻电子 Pad + 轻打击乐（沙锤、拍手） |
| **BPM** | 90-100 |
| **时长** | 60-90 秒循环 |
| **音量层级** | 背景层，不干扰音效 |

#### BGM_02 — 关卡游玩 (`bgm_gameplay`)

| 属性 | 要求 |
|---|---|
| **触发场景** | 进入任意关卡后开始播放，暂停时淡出，恢复时淡入 |
| **情绪** | 专注、轻紧张感、但不焦虑 |
| **风格参考** | 《Lily's Garden》关卡 BGM / 《Merge Dragons》轻专注氛围 |
| **配器建议** | 轻钢琴琶音 + 合成器 Pluck + 极轻打击乐 |
| **BPM** | 100-110 |
| **时长** | 60-90 秒循环 |
| **特殊要求** | 与主菜单 BGM 同调性或近调性，切换时自然过渡 |

#### BGM_03 — 胜利结算 (`bgm_level_complete`)

| 属性 | 要求 |
|---|---|
| **触发场景** | 通关成功瞬间开始播放，结算面板关闭后淡出 |
| **情绪** | 欢快、成就感、小庆祝 |
| **风格参考** | 《Candy Crush》通关庆祝音效延展版 |
| **配器建议** | 明亮 Bell + 弦乐拨奏 + 轻鼓点，尾段可带一点小上扬 |
| **BPM** | 110-120 |
| **时长** | 8-12 秒（非循环，单次播放） |
| **特殊要求** | 与 BGM_01 调性一致，可作为 BGM_01 的「胜利变奏」 |

---

## 4. UI 音效

### 4.1 规格要求

- **格式**: MP3 或 OGG（优先 MP3）
- **码率**: 96kbps
- **长度**: 0.3-1.5 秒
- **音量**: 由程序动态控制（默认 80%，玩家可关闭）

### 4.2 UI 音效清单

#### SFX_UI_01 — 按钮点击 (`sfx_button_click`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 所有按钮点击（包括主菜单、弹窗、选关页） |
| **风格** | 清脆、短促、有确认感 |
| **参考** | iOS 系统点击音的「轻快版」 |
| **时长** | 0.1-0.2 秒 |
| **音高** | 中高音区，略带弹性 |

#### SFX_UI_02 — 面板弹出 (`sfx_panel_open`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 任何面板/弹窗出现（暂停、设置、结算、签到等） |
| **风格** | 柔和的气泡膨胀感 |
| **参考** | 橡皮球轻弹 + 空气释放感 |
| **时长** | 0.3-0.5 秒 |
| **特殊要求** | 与面板 0.2-0.3 秒的 scale 动画同步 |

#### SFX_UI_03 — 面板关闭 (`sfx_panel_close`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 面板/弹窗关闭 |
| **风格** | 面板弹出的「逆过程」，轻微吸气/收缩感 |
| **时长** | 0.2-0.3 秒 |

#### SFX_UI_04 — 开关切换 (`sfx_toggle_switch`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 设置面板中音乐/音效/震动开关切换 |
| **风格** | 机械感 + 轻弹感 |
| **参考** | iOS 开关切换音的「更脆版」 |
| **时长** | 0.1-0.15 秒 |

#### SFX_UI_05 — 返回/取消 (`sfx_back_cancel`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 返回按钮、取消操作、关闭面板 |
| **风格** | 比点击音更低沉、更短 |
| **时长** | 0.1 秒 |

#### SFX_UI_06 — 锁定/不可点击 (`sfx_locked`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击未解锁的关卡、未解锁的主题、金币不足时 |
| **风格** | 轻微沉闷的「咚」声，带拒绝感但不刺耳 |
| **时长** | 0.15-0.2 秒 |

---

## 5. Gameplay 核心音效

### 5.1 规格要求

- **格式**: MP3
- **码率**: 96-128kbps
- **长度**: 0.2-2.0 秒
- **要求**: 这些音效是玩家最高频听到的，必须精致、不疲劳

### 5.2 Gameplay 音效清单

#### SFX_GAME_01 — 瓶子选中 (`sfx_bottle_select`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击选中一个瓶子 |
| **风格** | 水晶般的「叮」声，清脆明亮 |
| **参考** | 玻璃杯轻碰的高音 |
| **时长** | 0.15-0.25 秒 |
| **音高** | 较高，带一点混响尾音 |

#### SFX_GAME_02 — 瓶子取消选中 (`sfx_bottle_deselect`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击空白处取消选中、倒入成功后自动取消 |
| **风格** | 选中音的「软化版」，更短、更轻 |
| **时长** | 0.1-0.15 秒 |

#### SFX_GAME_03 — 倒水成功 (`sfx_pour_success`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 液体从一个瓶子成功倒入另一个瓶子 |
| **风格** | 水流注入的「咕噜」声 + 轻微气泡声 |
| **参考** | 向玻璃杯中倒水的短促版本 |
| **时长** | 0.3-0.5 秒（与倒水动画 0.5 秒匹配） |
| **特殊要求** | 倒多格（2-4 格）时，音效可按比例延长或叠加 |

#### SFX_GAME_04 — 倒水错误 (`sfx_pour_error`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击了不能倒入的目标瓶（颜色不匹配/目标已满） |
| **风格** | 轻微「嘟——」的拒绝音，不刺耳 |
| **参考** | 错误提示音的「温柔版」 |
| **时长** | 0.2-0.3 秒 |
| **音高** | 中低音，比选中音低一个八度 |

#### SFX_GAME_05 — 瓶子抖动 (`sfx_bottle_shake`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 错误操作时瓶子左右抖动（视觉反馈） |
| **风格** | 液体在瓶中晃动的「哗啦」短声 |
| **时长** | 0.3 秒（与抖动动画 0.3 秒匹配） |
| **特殊要求** | 与 SFX_GAME_04 同时播放，形成「视觉+听觉」双重错误反馈 |

#### SFX_GAME_06 — 撤销 (`sfx_undo`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击撤销按钮，液体倒流回源瓶 |
| **风格** | 时间倒流的「嗖——」声，或反向倒水声 |
| **参考** | 磁带倒带的短促版 |
| **时长** | 0.3-0.4 秒 |

#### SFX_GAME_07 — 重置 (`sfx_reset`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击重置按钮，关卡回到初始状态 |
| **风格** | 轻微的「刷——」刷新声 |
| **时长** | 0.3-0.5 秒 |

#### SFX_GAME_08 — 提示 (`sfx_hint`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击提示按钮，系统高亮建议操作的两个瓶子 |
| **风格** | 魔法般的「叮铃」声，带一点神秘感 |
| **参考** | 解谜游戏提示音 |
| **时长** | 0.4-0.6 秒 |

#### SFX_GAME_09 — 双击自动倒水 (`sfx_auto_pour`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 双击瓶子，系统自动找到目标并完成倒水 |
| **风格** | 比普通倒水声更流畅、更快速，带一点「智能感」 |
| **时长** | 0.3-0.4 秒 |
| **特殊要求** | 可复用 SFX_GAME_03，但pitch稍微提高 10% 以示区别 |

#### SFX_GAME_10 — 通关胜利 (`sfx_level_win`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 所有瓶子颜色统一，通关判定成功的瞬间 |
| **风格** | 欢快的「叮叮叮」三连音 + 轻鼓点 |
| **参考** | 《Candy Crush》Sugar Crush 音效的简化版 |
| **时长** | 1.0-1.5 秒 |
| **特殊要求** | 这是游戏最核心的正向反馈，必须让玩家感到「爽」 |

---

## 6. 系统反馈音效

### 6.1 规格要求

- **格式**: MP3
- **码率**: 96kbps
- **长度**: 0.5-2.5 秒

### 6.2 系统反馈音效清单

#### SFX_SYS_01 — 星星亮起 (`sfx_star_appear`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 结算面板中，每颗星星依次亮起（最多 3 颗，间隔 0.3 秒） |
| **风格** | 明亮的「叮」声，每颗星音高递增 |
| **参考** | 《Angry Birds》星级评价音 |
| **时长** | 0.3-0.4 秒/颗 |
| **特殊要求** | 3 颗星建议做 3 个变调版本（do-mi-sol），或同一个音效 pitch 递增播放 |

#### SFX_SYS_02 — 金币获得 (`sfx_coins_get`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 通关奖励、签到奖励、看视频奖励等任何金币增加时 |
| **风格** | 硬币掉落的「叮铃」声，多个硬币可叠加 |
| **参考** | 街机投币音的轻量版 |
| **时长** | 0.3-0.5 秒 |

#### SFX_SYS_03 — 钻石获得 (`sfx_diamonds_get`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 获得钻石奖励时 |
| **风格** | 比金币更「珍贵」的声音，带水晶质感 |
| **参考** | 宝石碰撞的清脆声 |
| **时长** | 0.4-0.6 秒 |

#### SFX_SYS_04 — 签到成功 (`sfx_checkin_success`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击签到按钮，领取当日奖励 |
| **风格** | 轻快的「叮叮」+ 小鼓点，比金币获得更喜庆 |
| **时长** | 0.5-0.8 秒 |

#### SFX_SYS_05 — 连续签到达成 (`sfx_streak_bonus`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 连续签到 7 天/14 天，触发加成奖励时 |
| **风格** | 小型庆祝感，比签到成功更隆重 |
| **时长** | 0.8-1.2 秒 |

#### SFX_SYS_06 — 成就解锁 (`sfx_achievement_unlock`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 达成成就条件，成就图标从灰变亮的瞬间 |
| **风格** | 辉煌的铜管/号角短音，带荣誉感 |
| **参考** | 《魔兽世界》成就解锁音的轻量版 |
| **时长** | 1.0-1.5 秒 |

#### SFX_SYS_07 — 成就奖励领取 (`sfx_achievement_claim`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 点击已达成成就的「领取」按钮 |
| **风格** | 比成就解锁更轻快，类似打开礼盒 |
| **时长** | 0.5-0.8 秒 |

#### SFX_SYS_08 — 主题解锁 (`sfx_theme_unlock`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 首次解锁一个新主题（满足条件或购买） |
| **风格** | 魔法般的「唰——」声，带色彩感 |
| **时长** | 0.6-1.0 秒 |

#### SFX_SYS_09 — 主题切换 (`sfx_theme_switch`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 在主题商店中切换使用主题 |
| **风格** | 轻微的「刷」刷新声，比主题解锁更短更轻 |
| **时长** | 0.3-0.4 秒 |

#### SFX_SYS_10 — 每日挑战完成 (`sfx_daily_challenge_complete`)

| 属性 | 要求 |
|---|---|
| **触发时机** | 完成当日挑战关卡 |
| **风格** | 比通关胜利更「竞技感」，带一点紧张释放 |
| **时长** | 1.0-1.5 秒 |

---

## 7. 技术交付规范

### 7.1 文件格式与命名

```
音频文件命名规范：{类型}_{功能}_{变体}.{格式}

类型前缀：
- bgm_   = 背景音乐
- sfx_   = 音效

示例：
- bgm_main_menu.mp3
- bgm_gameplay.mp3
- bgm_level_complete.mp3
- sfx_button_click.mp3
- sfx_pour_success.mp3
- sfx_star_appear_01.mp3  (第1颗)
- sfx_star_appear_02.mp3  (第2颗)
- sfx_star_appear_03.mp3  (第3颗)
```

### 7.2 音频参数

| 参数 | BGM | SFX |
|---|---|---|
| **格式** | MP3 | MP3 |
| **码率** | 128kbps | 96kbps |
| **采样率** | 44100Hz | 44100Hz |
| **声道** | 立体声 | 单声道（减少包体） |
| **循环标记** | BGM 需设置循环点 | 不适用 |
| **动态范围** | 标准化至 -3dB | 标准化至 -1dB |

### 7.3 包体控制

- **目标总大小**: < 2MB
- **BGM 占比**: ~1.2MB（3 首 × ~400KB）
- **SFX 占比**: ~600KB（26 个 × ~23KB）
- 若超出，优先压缩 BGM 码率至 96kbps，或缩减 BGM 时长

### 7.4 交付清单

请按以下结构交付：

```
倒水乐乐乐_Audio_v1.0/
├── BGM/
│   ├── bgm_main_menu.mp3
│   ├── bgm_gameplay.mp3
│   └── bgm_level_complete.mp3
├── SFX/
│   ├── UI/
│   │   ├── sfx_button_click.mp3
│   │   ├── sfx_panel_open.mp3
│   │   ├── sfx_panel_close.mp3
│   │   ├── sfx_toggle_switch.mp3
│   │   ├── sfx_back_cancel.mp3
│   │   └── sfx_locked.mp3
│   ├── Gameplay/
│   │   ├── sfx_bottle_select.mp3
│   │   ├── sfx_bottle_deselect.mp3
│   │   ├── sfx_pour_success.mp3
│   │   ├── sfx_pour_error.mp3
│   │   ├── sfx_bottle_shake.mp3
│   │   ├── sfx_undo.mp3
│   │   ├── sfx_reset.mp3
│   │   ├── sfx_hint.mp3
│   │   ├── sfx_auto_pour.mp3
│   │   └── sfx_level_win.mp3
│   └── System/
│       ├── sfx_star_appear_01.mp3
│       ├── sfx_star_appear_02.mp3
│       ├── sfx_star_appear_03.mp3
│       ├── sfx_coins_get.mp3
│       ├── sfx_diamonds_get.mp3
│       ├── sfx_checkin_success.mp3
│       ├── sfx_streak_bonus.mp3
│       ├── sfx_achievement_unlock.mp3
│       ├── sfx_achievement_claim.mp3
│       ├── sfx_theme_unlock.mp3
│       ├── sfx_theme_switch.mp3
│       └── sfx_daily_challenge_complete.mp3
└── Audio_Spec_v1.0.pdf  (本文档)
```

---

## 8. 程序接入说明（供开发参考）

### 8.1 AudioManager 接口设计

```typescript
class AudioManager {
    // 音量与开关（绑定设置面板）
    static musicEnabled: boolean;
    static soundEnabled: boolean;
    static bgmVolume: number;   // 0.0 ~ 1.0
    static sfxVolume: number;   // 0.0 ~ 1.0

    // BGM 控制
    static playBgm(name: 'main_menu' | 'gameplay' | 'level_complete'): void;
    static stopBgm(): void;
    static pauseBgm(): void;
    static resumeBgm(): void;

    // SFX 播放（可同时播放多个，互不干扰）
    static playSfx(name: string): void;

    // 便捷方法（已映射到具体 SFX）
    static playButton(): void;
    static playPanelOpen(): void;
    static playPanelClose(): void;
    static playBottleSelect(): void;
    static playBottleDeselect(): void;
    static playPour(): void;
    static playPourError(): void;
    static playBottleShake(): void;
    static playUndo(): void;
    static playReset(): void;
    static playHint(): void;
    static playAutoPour(): void;
    static playLevelWin(): void;
    static playStar(starIndex: 1 | 2 | 3): void;
    static playCoins(): void;
    static playDiamonds(): void;
    static playCheckIn(): void;
    static playStreakBonus(): void;
    static playAchievementUnlock(): void;
    static playAchievementClaim(): void;
    static playThemeUnlock(): void;
    static playThemeSwitch(): void;
    static playDailyChallengeComplete(): void;
}
```

### 8.2 关键触发点（开发对照表）

| 触发点 | 调用方法 | 所在文件 |
|---|---|---|
| 任意按钮点击 | `playButton()` | GameManager.ts 全局 |
| 面板弹出 | `playPanelOpen()` | 所有 `showXxxPanel()` 方法 |
| 面板关闭 | `playPanelClose()` | 关闭回调 |
| 瓶子选中 | `playBottleSelect()` | `selectBottle()` |
| 瓶子取消选中 | `playBottleDeselect()` | `selectBottle(-1)` |
| 倒水成功 | `playPour()` | `handleBottleTap()` 倒水逻辑后 |
| 倒水错误 | `playPourError()` | `handleBottleTap()` 错误分支 |
| 瓶子抖动 | `playBottleShake()` | `playShake()` 调用处 |
| 撤销 | `playUndo()` | `undo()` |
| 重置 | `playReset()` | `resetLevel()` |
| 提示 | `playHint()` | `applyHint()` |
| 通关胜利 | `playLevelWin()` | `completeLevel()` |
| 星星亮起 | `playStar(1/2/3)` | `createStarRating()` |
| 金币获得 | `playCoins()` | 所有金币奖励发放处 |
| 成就解锁 | `playAchievementUnlock()` | `updateAchievementProgress()` 检测到 completed 时 |

---

## 9. 参考视频 / 竞品参考

为帮助音频团队理解风格，建议提供以下参考：

1. **《Water Sort Puzzle》**（直接竞品）
   - 倒水音效、错误反馈、通关庆祝
2. **《Two Dots》**
   - 轻松休闲的 BGM 风格
3. **《Monument Valley》**
   - 清新、不干扰的音频设计哲学
4. **《Candy Crush Saga》**
   - 正向反馈音效的设计强度参考

---

## 10. 排期与验收

| 阶段 | 内容 | 预计时间 | 交付物 |
|---|---|---|---|
| **Phase 1** | BGM 3 首 Demo（各 15 秒预览） | 3 天 | 3 个 MP3 Demo |
| **Phase 2** | SFX 核心 10 个（Gameplay 类） | 3 天 | 10 个 MP3 |
| **Phase 3** | SFX 剩余 16 个 + BGM 完整版 | 3 天 | 16 个 MP3 + 3 个完整 BGM |
| **Phase 4** | 程序接入 + 调优反馈 | 2 天 | 修改后的音频文件 |
| **总计** | | **约 11 天** | 29 个音频文件 |

**验收标准**：
- [ ] 所有文件格式、码率、命名符合 §7 规范
- [ ] BGM 首尾无缝循环，无爆音/杂音
- [ ] SFX 无爆音，尾音干净
- [ ] 真机测试：iOS + Android 主流机型播放正常
- [ ] 包体总大小 < 2MB

---

## 11. 联系人与反馈

- **音频需求对接**: Silence Lu
- **程序接入对接**: 开发团队
- **反馈方式**: 在本文档基础上批注，或直接替换文件后标注版本号

**文档更新记录**：

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.0 | 2026-05-07 | 初版，覆盖 v0.5.1 全部音频需求 |
