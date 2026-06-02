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
4. Enable cloud-authoritative save mode:
   - `GAME_CONFIG.SAVE.CLOUD_AUTHORITATIVE = true`
   - After openid is resolved, localStorage is no longer used as the persistent source for user progress.
   - If a cloud record exists, it directly replaces the runtime save.
   - If no cloud record exists, the current runtime default save initializes a new cloud record.
5. Cloud save reads/writes query by business `key` only, and rely on WeChat cloud database creator-only permissions for user isolation:

```ts
db.collection('kv_saves').where({ key }).limit(1).get()
```

6. Store `ownerOpenId` only as an audit/debug field. Do not trust a client-provided `_openid` in query conditions.
7. If openid cannot be resolved, cloud save read/write is skipped. In cloud-authoritative mode, this data is only a runtime fallback and should not be treated as a durable save.

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

- Some users who previously relied on local-only progress may no longer see that progress once cloud-authoritative mode is enabled and no cloud record exists. This is intentional for the new policy: cloud is the only durable save.
- Existing valid records created by the same user's `_openid` remain readable when the collection permission is creator-only.
- If `kv_saves` is accidentally configured as public read/write, the `where({ key })` query can again expose cross-user saves. Treat the permission setting as a release blocker.
