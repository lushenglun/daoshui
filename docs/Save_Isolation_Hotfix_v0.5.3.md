# V0.5.3 Save Isolation Hotfix

## Background

V0.5.2 has a cloud save isolation issue: different WeChat users can read the same `kv_saves` record when the collection query only filters by the business `key`.

Example failure:

- User A reaches level 30.
- User B opens the game and receives level 30.

## Root Cause

The previous client query was:

```ts
db.collection('kv_saves').where({ key }).limit(1).get()
```

If the cloud database permission is too broad, this can return another user's record with the same `key`.

## Fix

1. Add cloud function `getOpenId`.
2. Call the cloud function after `wx.login`.
3. Store `social.openId` in save data.
4. Scope local save keys by openid:
   - legacy key: `water_sort_save_v1`
   - scoped key: `water_sort_save_v1_${openid}`
   - first login on an upgraded client migrates the current legacy local save into the scoped key when no scoped save exists yet.
5. Cloud save reads/writes use a user-scoped business `key` plus `ownerOpenId`:

```ts
const key = `${GAME_CONFIG.SAVE.SAVE_KEY}_cloud_${safeOpenId}`;
db.collection('kv_saves').where({ key, ownerOpenId: openId }).limit(1).get()
```

6. Store `ownerOpenId` as a second isolation marker. Collection permissions must still be restricted, but save isolation must not rely on permissions alone.
7. If openid cannot be resolved, cloud save read/write is skipped and only local shadow save is kept.
8. Legacy records using the old shared key are read only when `ownerOpenId`, `_openid`, or `value.social.openId` explicitly matches the current openid. Never import a shared legacy record for a new user.

## Deployment Notes

Before uploading V0.5.3:

1. After every Cocos Creator WeChat build, re-check the generated project at `build/wechatgame`.
2. Cocos build may overwrite the generated folder. Confirm or restore:
   - `build/wechatgame/cloudfunctions/getOpenId/index.js`
   - `build/wechatgame/cloudfunctions/getOpenId/package.json`
   - `build/wechatgame/project.config.json`
3. Confirm `project.config.json` contains:

```json
"cloudfunctionRoot": "cloudfunctions/"
```

4. In WeChat DevTools, confirm the left resource manager shows `cloudfunctions/getOpenId`.
5. Right click `cloudfunctions/getOpenId` and deploy/upload dependencies.
6. Confirm the cloud database collection `kv_saves` permission is restricted to creator-only read/write. Do not use public read/write permissions.
7. Run with two different WeChat accounts:
   - Account A reaches a different level from Account B.
   - Console should show `[WXAPI] openid resolved by cloud function: getOpenId`.
   - `kv_saves` should contain separate records with different `key` values and different `_openid` / `ownerOpenId`.

## Risk Notes

- Some users who previously received another user's public cloud save may no longer see that progress after the fix. This is intentional because the previous progress was not reliably attributable to them.
- Existing valid records created with the old shared key are migrated only if they explicitly match the current openid.
- If `kv_saves` is accidentally configured as public read/write, user-scoped keys reduce cross-user overwrite risk, but the permission setting is still a release blocker.
