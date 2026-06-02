# 《倒水乐乐乐》上线审核清理记录

> 日期：2026-05-20  
> 分支：`codex-release-audit-cleanup`  
> 目标：提交微信审核前，临时屏蔽开发、测试、Mock 与未完成提示类内容。

## 本次清理

- 发布配置确认：
  - `GAME_CONFIG.VERSION = '0.5.1'`
  - `GAME_CONFIG.BUILD.IS_RELEASE = true`
  - `GAME_CONFIG.BUILD.HIDE_AD_ENTRIES_IN_REVIEW = true`
  - `GAME_CONFIG.AD.MOCK_ENABLED = false`
- 审核期隐藏主菜单广告入口：
  - 看视频领金币
- 审核期隐藏局内广告入口：
  - 金币不足后的看视频提示 / 撤销补充入口
  - 结算页双倍奖励入口
  - 签到补签看视频入口
- 发布版隐藏开发入口：
  - 设置页 GM 按钮
  - 设置页手动同步按钮
  - 主菜单排行榜入口
  - 排行榜周榜占位按钮与编辑器预览提示
- 审核期隐藏广告关联运营内容：
  - 成就列表中的“广告达人”
  - 主题商店中的广告观看解锁主题 `vip`
- 发布版隐藏主菜单内部版本标签，避免出现 `v0.5`、测试/运营版等内部文案。
- 隐私协议弹窗文案替换为正式说明口径，不再出现“后续接入/将接入”等占位提示。
- 广告 Mock 逻辑增加发布版兜底：`IS_RELEASE = true` 时即使误开 `MOCK_ENABLED`，也不会进入 Mock 流程。

## 保留内容

- 设置页保留版本号 `0.5.1`，用于用户反馈与客服排查。
- 审核期隐藏广告入口，但广告框架代码保留，待流量主开通并配置真实广告位后可恢复入口。
- 排行榜逻辑保留但发布版入口隐藏，待开放数据域完整接入后恢复。

## 验证

- `tsc --noEmit --skipLibCheck`
- `git diff --check`

## 复原建议

审核通过并需要恢复开发工具时：

1. 将 `GAME_CONFIG.BUILD.IS_RELEASE` 改回 `false`。
2. 将 `GAME_CONFIG.BUILD.HIDE_AD_ENTRIES_IN_REVIEW` 改回 `false`。
3. 若真实广告位已开通，保持 `GAME_CONFIG.AD.MOCK_ENABLED = false` 并填写真实 `AD_UNIT_IDS`。
4. 若本地开发需要广告 Mock，可在非发布版临时打开 `GAME_CONFIG.AD.MOCK_ENABLED`。
