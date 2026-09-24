# Online 正式後端驗證 — 2026-09-24

## 執行範圍
- 使用 script.js 既有正式 endpoint。只送出使用者指定的 3 次 Online POST，沒有自動重試。
- 前端 `ONLINE_MESSAGE_BACKEND_READY = false` 未變動。
- Full / Wedding 沒有正式寫入測試；依使用者提供的新部署原始碼審查。
- 新增本機 CLI `online-backend-live.mjs`；沒有修改 dev.html 或加入網站入口。tools/ 已由 GitHub Pages 設定排除。
- 沒有修改 Apps Script、Commit 或 Push。

## 實際請求與回應
時間：台北 2026-09-24 13:26:33–13:26:42。

| 次數 | submissionId | message | POST |
|---|---|---|---|
| 1 | 3d406d0a-7f48-406d-a6c5-f49e79813e7d | 這是一筆 Online 留言測試 | HTTP 200，success=true，action=created |
| 2 | 4881ca84-993c-4a55-940f-81735ad7b6ca | 這是第二筆同名 Online 留言測試 | HTTP 200，success=true，action=created |
| 3 | 與第 2 次完全相同 | 與第 2 次完全相同 | HTTP 200，回傳相同結果 |

三次原始 POST 回應均為：
```json
{"success":true,"action":"created","message":"謝謝你的祝福！"}
```
每次隨後 JSONP 查詢均為 HTTP 200：
```json
{"ready":true,"success":true,"action":"created","message":"謝謝你的祝福！"}
```

共同 payload：invite=online、name=Online 測試、phone/ceremony/banquet/note 空字串、online=會參加、people/vegetarian 字串 0。新增兩個 UUID，第三次完整重用第二次 payload。

## 證據與限制
- API 已證明空電話可被接受，兩次新 ID 都回報 created，重播回傳相同成功結果。
- API 沒有 row number、資料回讀或 row count。使用者先確認「欄位皆正確」，隨後明確確認「只有 2 列，兩則留言都保留」。因此本次 Sheet 欄位、同名第二列新增、第一列保留、同 ID 即時重送未新增第三列，均由使用者人工核對通過（未提供列號）。
- 新版程式碼的 rowData 順序仍為時間、invite、name、phone、ceremony、banquet、online、people、vegetarian、note、message，共 11 欄；數字正規化使本次 people/vegetarian 寫入數字 0。
- online 不呼叫 findExistingGuestRow，故不同 ID 的同名留言走新增列。
- 同 ID 防重在 ScriptLock 內先查成功快取，有效時直接回傳，不再寫入。
- 目前防重依賴 RESULT_CACHE_SECONDS=300，submissionId 沒有持久寫入 Sheet。快取失效後重播可再次新增，不能保證永久防重。
- Google 官方文件也說明快取 expiration 是建議值，可能提前移除：https://developers.google.com/apps-script/reference/cache/cache#putkey,-value,-expirationinseconds
- 未為測試快取失效而額外 POST，以免新增非授權測試列。

## Full / Wedding 程式碼審查
- invite 非 online 且電話空白：拒絕。
- invite 非 online：isValidPhone 驗證至少 8 位數字。
- invite 非 online：findExistingGuestRow 仍使用正規化姓名＋電話查找，存在則 updated。
- 電話文字格式仍保留前導 0；十一欄順序不變。
- 審查正常；未修改 Full/Wedding 正式資料。

## Console / Network
- 實際三次 POST 與當下三次 JSONP：沒有網路錯誤，均 HTTP 200。
- 額外 Chrome 本機唯讀 JSONP 測試：初次本機測試頁缺少 favicon 造成連線拒絕，已在測試頁加入 data favicon 修正；不是 Apps Script 的錯誤。
- 重跑後瀏覽器 console error=0、network failure=0，兩次正式 JSONP 都 HTTP 200。
- 此時已超過 300 秒；回傳 ready=false。瀏覽器傳輸通過，但已無成功快取，與初次測試的 ready=true 分別記錄。沒有重送 POST。

## 是否可解除限制
本次指定的短時間三次請求、API 與模式分支審查通過；使用者已確認 Sheet 欄位正確、只有兩列且兩則留言都保留。就本次驗收範圍而言，已具備解除前端限制的條件，但僅有短時間快取防重。如果要求相同 submissionId 在任意時間重送都不能新增，現行 Cache-only 方案不達標，需要持久保存 ID 並在鎖內查重。依使用者指示仍保持 ONLINE_MESSAGE_BACKEND_READY=false，未自動解除。

## 原始記錄
- /private/tmp/wedding-online-backend-3d406d0a-7f48-406d-a6c5-f49e79813e7d.json
- /private/tmp/wedding-online-backend-3d406d0a-7f48-406d-a6c5-f49e79813e7d.browser.json
- /private/tmp/wedding-online-backend-3d406d0a-7f48-406d-a6c5-f49e79813e7d.browser-initial.json
