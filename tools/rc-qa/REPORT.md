# 婚禮網站 Release Candidate 審查與修正報告

日期：2026-09-10。基準：本次工作開始時乾淨的 Git 工作目錄。

已完成審查、最小範圍修正、自動驗證及回歸修正。保留一頁式、既有視覺、RSVP canonical values、Apps Script endpoint、invite 規則與座位查詢資料／邏輯。**沒有 Commit、Push 或部署。**

目前可交付人工驗收，但不能宣稱所有發布條件已齊備：正式 gallery 實際為 **22 張**，需求指定 23 張；線上婚禮 URL 尚未填入；座位資料仍是原有三筆示例形式的資料。

## A. 發現的問題與優先級

| 優先級 | 問題 | 處理結果 |
| --- | --- | --- |
| Critical | 未發現已證實的前端秘密洩漏或會直接破壞正式資料的問題 | 後端驗證／實際資料寫入不在本次可讀程式範圍內，未假稱驗證完成 |
| High | 婚禮核心卡、到場指引、FAQ 及英文仍有錯誤入場時間 | 全部統一為 14:00；15:00 正式開始 |
| High | 婚宴核心資訊缺少 20:30 送客 | 補上時間卡與中英文 FAQ |
| High | 原始頁面只有一個婚禮停車地點，與要求的三個不符 | 從 Git 歷史恢復原本另兩個停車地點、照片、原地圖連結及翻譯，保留 Times 停車場 |
| High | RSVP 成功後 UI 切換前先解除 submitting，存在再次送出的短暫空窗 | 保持鎖定直到成功畫面顯示；隱藏表單也不接受重送 |
| High | JSONP 每秒發出新請求，慢回應時可能重疊；舊回應需與 submissionId 關聯 | 同時最多一個輪詢請求；清理／晚到回呼與目前 submissionId 綁定 |
| High | 本機 dashboard 導向的預覽仍可呼叫正式 RSVP | localhost／file 預覽阻止正式 POST，提供雙語提示；正式 endpoint 完全不變 |
| High（待確認） | 資料檔、Git 資產與本機 original 都只有 01～22 | 保留現有 22 張與順序；尚缺第 23 張來源，不以重複照片湊數 |
| Medium | 桌機相簿多層 opacity／scale 過渡，手機另用 JS scrollLeft 補間 | 統一 track transform 420ms；固定 stage；移除自動輪播及重複淡入 |
| Medium | 小型 dots 只有 8～14px 寬 | 改為每顆 44×44px，固定排列，保留全部直接選圖功能 |
| Medium | RSVP 收合只設 aria-hidden，仍可能進入鍵盤焦點 | 加上 inert；Lightbox 背景亦暫時 inert 並還原 |
| Medium | 初始主要 hash 被清除，重開分享錨點可能回 Hero | 保留錨點，字型／版面就緒後定位；gallery 舊別名仍支援 |
| Medium | Quick Nav 桌機標籤與要求不一致 | 統一婚禮／婚宴／婚紗／分享及 Ceremony／Banquet／Gallery／Share，描述性 aria-label 保留 |
| Medium | 非婚宴邀請的分享文字仍提到婚宴 | Wedding／Online 改用婚禮分享文字；Full 仍維持婚宴分享內容 |
| Medium | 多處 backdrop-filter 與 More blur 增加繪製成本 | 改用接近不透明／不透明的原色系背景，移除模糊效果 |
| Medium | 浮動回頂端可能重疊頁面底部 CTA | 用 IntersectionObserver 偵測底部主要按鈕；接近 CTA 時暫時隱藏 |
| Low | 預設 lang 與指定格式不同、通用相簿 alt 未提供中文、地址英文順序不適合 | 使用 zh-TW／en；補雙語 alt；地址採英文街道先、鄉鎮縣市後 |
| Low | 過時卡片 selector、成功動畫與手機定位輔助程式 | 確認無引用／已被替代後移除；不盲目重構其餘 CSS |

回歸測試另抓出並修正：曾回覆使用者啟動時的 scroll 狀態初始化順序，以及成功畫面延遲捲動可能覆蓋回頂端操作。測試工具也修正為等待 smooth scroll 真正停止、使用新文件 URL，避免把尚在捲動或舊文件誤判成回歸。

## B. 實際修改

| 類別 | 修改 |
| --- | --- |
| HTML | 日期／時間與時區、場地、地址、送客卡、三個婚禮停車選項、RSVP inert、分享 meta 名稱、保留深連結 |
| CSS | 延用原視覺；手機婚禮入場／開始並排；婚宴時間卡排列；相簿比例與 dots；44px 控制；移除高成本模糊與廢棄樣式 |
| JavaScript | RSVP 防重送／輪詢保護／本機隔離；統一相簿定位；減少 resize 綁定；內容尺寸變更更新閱讀進度；焦點及捲動還原；CTA 避讓 |
| Translation | 14:00／15:00、送客、場地完整名稱與地址、停車、預覽提示、相簿 alt、各模式分享文案；切語言不 reload、不清表單、不重建相簿 |
| Gallery | 沿用 wedding-gallery-data.js 與 thumb／large；現有 22 張原檔、輸出圖片及排序均未改寫 |
| Performance | 保留單一 passive scroll + RAF；Quick Nav、底部 CTA 用 IO；內容高度用 ResizeObserver；相簿只動 transform |
| Accessibility | inert、aria-current、44px dots／語言／選單控制、Lightbox 背景隔離與焦點還原、Reduced Motion、雙語 alt／label |

## C. 清除的舊程式

- 手機 scrollLeft RAF 補間、Bezier 求值及相關狀態／完成回呼。
- 自動輪播 timer、hover／focus／可見性專用綁定及不用的 autoplay 狀態。
- 相簿重複 opacity／scale 過渡與 More 的 blur 過渡。
- 不使用的 RSVP deadline 常數、舊成功動畫及不再使用的定位 callback／source 參數。
- 無引用的 `.card`、`.card__body`、`.card__content`、`.card__footer`、`.travel-card`、`.travel-grid`、`.section-header--left`、`.lightbox-overlay` 樣式。

本次基準實作已沒有 tabs／tabpanel／panel-stage，也沒有 Carousel swipe handler；未虛稱這次刪除了它們。Lightbox 原本的觸控手勢仍保留，Carousel 沒有 touchmove 攔截。

## D. 效能與動畫

- window scroll listener：**1 → 1**，閱讀進度與回頂端共用；沒有新增重複 scroll listener。
- Carousel：桌機／手機共用 transform 420ms，cubic-bezier(0.22,1,0.36,1)；stage 高度固定；切換不改文件高度，不重建照片 DOM。
- 移除自動換圖；Previous／Next／dots／返回第一張／點圖 Lightbox／鍵盤操作全部保留。
- 第一張 thumb eager，其餘起初 lazy；使用者指定照片時提高該 thumb 載入優先度；所有圖片 async decoding。
- 首頁不載入 large；首次 Lightbox 僅目前／前／後三個大圖網址。測試停用快取時同一網址可能有重複資源紀錄，驗證按不同網址計算。
- 現有 thumb：4,251,774 bytes；large：17,442,517 bytes。圖片位元內容未變；未新增超大原圖。
- 分享圖沿用 1200×630、91,388 bytes 的橫式婚紗照。
- script.js：96,047 → 91,911 bytes；styles.css：125,796 → 123,144 bytes。翻譯與 HTML 因補齊內容稍增，未引入框架或第三方套件。
- A 進場一次：Hero／reveal／圖片揭示保留；reveal 後 unobserve、will-change 回 auto。
- B 可視且載入中：skeleton 保留，載入後停止。
- C 必須持續：只有正在送出／查詢中的 spinner；功能結束即停止。
- D 可刪：自動輪播、scroll cue 浮動、重複相簿淡入、背景與選單模糊已移除。
- 固定 Header、卡片、More、相簿箭頭、回頂端等不再使用 backdrop-filter。

這些是實作與功能量測；未宣稱實機 FPS、Lighthouse 分數或真實使用者 CLS 改善幅度。

## E. 最新資料確認

- 婚禮：**2026/12/26，14:00 入場，15:00 開始**。
- 場地：**王國聚會所－竹東會眾**。
- 地址：**新竹縣竹東鎮長春路三段 376 號 2 樓**。
- 英文：**Kingdom Hall of Jehovah’s Witnesses — Zhudong Congregation**；2F, No. 376, Sec. 3, Changchun Rd., / Zhudong Township, Hsinchu County。
- 婚宴：**晶宴會館－御豐館，2F 星辰劇場；17:00 入場、18:00 開席、20:30 送客**。
- RSVP：**2026/11/1 前**；提示為「回覆完成後，若要更新資料，請使用相同姓名及聯絡電話即可」，英文使用指定完整句。
- 英文姓名：**Zeric & Lily**；標題：**到場指引／Arrival Guide**、**一個小提醒**。
- 已搜尋指定舊資料與原有錯誤入場時間；網站來源不再殘留相關錯誤文字，保留正確的 14:00 入場。

## F. 自動驗證

| 範圍 | 結果／界線 |
| --- | --- |
| Chrome | 320、375、390、430、1280、1440、1680；full／wedding／online × zh-TW／en，共 42 組通過 |
| Edge | 同上 42 組通過 |
| Safari 桌機 | 1280、1440、1680；full／wedding／online × zh-TW／en；共 18 組通過，使用原生 Safari WebDriver 並核對實際 viewport |
| 手機 | Chrome／Edge device metrics 模擬；不等同實際 iPhone 瀏覽器 |
| 結構／資產 | npm test：HTML nesting、JS syntax、duplicate id、href／src／ARIA 引用、圖片尺寸與解碼、翻譯 key 對齊通過 |
| Console | Chrome／Edge 矩陣沒有頁面 JS exception／console error |
| 功能 | Accordion、FAQ、More、語言、Quick Nav、Gallery、Lightbox、返回第一張、回頂端、RSVP 序列化與成功流程通過 |
| 擴充測試 | 初始 deep link、sticky／scroll spy、進度更新、CTA 避讓、全部 22 張比例／順序、循環、無 swipe、焦點／inert／捲動還原、resize、Reduced Motion 通過 |
| RSVP | 攔截 POST／JSONP 模擬 created／updated／pending／error；驗證重複提交只有一個 POST、電話前導 0、原中文 canonical 值、submissionId、note、message、人數與模式欄位 |
| Timeout | 驗證 timeout handler 清理請求與恢復重試狀態；不宣稱已實測所有真實慢網路情況 |
| Seat | 開放前與 2026-12-19 00:00:00 +08:00 邊界通過；原示例查詢結果通過；seatData 及查詢結構未改 |
| Builder | 既有 npm script + 直／橫測試圖，--no-publish 成功；正式 gallery 位元內容未變 |
| 外部連結 | 6 個短網址地圖、婚宴 Google Maps search、Google Photos 共 8 個 URL 回應 200；正式 dev.html 為 404 |
| Security | 未發現前端密碼／API secret／Google credentials／admin credential；公開 Apps Script URL 不是 secret；endpoint 與 seatData 比對均不變 |
| 文字對比 | 主要／次要／muted／accent-dark／error 對淺色頁面背景約 13.79／5.14／4.86／5.02／5.27:1；照片疊字仍需實機視覺確認 |

使用者任務路徑保持：婚禮時間直接向下滑可見；婚宴與照片可用 Quick Nav；婚宴停車經一層 Accordion；座位查詢直接在婚宴後；照片分享有明確 CTA。Online 延用原本不顯示 FAQ、現場停車與座位的規則。

## G. 發布前需人工確認

1. **第 23 張正式婚紗來源**：目前只有 22 張，需提供來源後才能滿足 23 張要求。
2. **正式 RSVP 後端**：沒有寫入正式資料，也沒有修改 Apps Script。真實同姓名＋電話是否更新同一列、created／updated／status 回傳與後端輸入驗證，需要在您允許的正式驗收流程確認。
3. **座位資料**：仍是原本三筆示例形式資料；需確認正式桌次準備方式。本次不改資料結構或查詢邏輯。
4. **線上連結**：ONLINE_MEETING_URL 原本為空；保留原有「婚禮前提供」提示，需於提供正式連結時完成設定。
5. **實際 iPhone Safari／Edge／Chrome**：safe-area、動態網址列、旋轉、慣性滑動、鍵盤、圖片是否閃爍及 LINE 內建瀏覽器需實機確認。
6. **停車現況**：另外兩個停車選項由原 Git 歷史恢復，地圖可開啟；請確認仍適用最新場地與現場可停區域。
7. **分享權限／預覽**：HTTP 200 不代表登入帳號有照片上傳權限；需實際 Google Photos 上傳及 LINE 分享預覽確認。
8. **正式站尚未更新**：本次只修改本機工作目錄；待人工確認後再決定提交與發布。

## H. 修改檔案

既有檔案：index.html、styles.css、script.js、i18n.js、.gitignore、_config.yml、package.json。

新增驗證與報告：tools/rc-qa/static.py、translations.cjs、browser.mjs、safari.mjs、links.py、README.md、REPORT.md。

未修改：wedding-gallery-data.js、所有婚紗輸出圖片、gallery builder、Apps Script、正式 RSVP endpoint、seatData。dev.html 仍僅本機且未加入 Git；dev.js／dev.css 原本不存在，已預先加入 ignore／Pages exclude。
