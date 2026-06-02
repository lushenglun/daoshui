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
5. Cloud save reads/writes query by business `key` only, and rely on WeChat cloud database creator-only permissions for user isolation:

```ts
db.collection('kv_saves').where({ key }).limit(1).get()
```

6. Store `ownerOpenId` only as an audit/debug field. Do not trust a client-provided `_openid` in query conditions.
7. If openid cannot be resolved, cloud save read/write is skipped and only local shadow save is kept.

## Deployment Notes

Before uploading V0.5.3:

1. In WeChat DevTools, open the generated project at `build/wechatgame`.
2. Confirm `project.config.json` contains:

```json
"cloudfunctionRoot": "cloudfunctions/"
```

3. Right click `cloudfunctions/getOpenId` and deploy/upload dependencies.
4. Confirm the cloud database collection `kv_saves` permission is restricted to creator-only read/write. Do not use public read/write permissions.
5. Run with two different WeChat accounts:
   - Account A reaches a different level from Account B.
   - Console should show `[WXAPI] openid resolved by cloud function: getOpenId`.
   - `kv_saves` should contain separate records with different `_openid`.

## Risk Notes

- Some users who previously received another user's public cloud save may no longer see that progress after the fix. This is intentional because the previous progress was not reliably attributable to them.
- Existing valid records created by the same user's `_openid` remain readable when the collection permission is creator-only.
- If `kv_saves` is accidentally configured as public read/write, the `where({ key })` query can again expose cross-user saves. Treat the permission setting as a release blocker.
