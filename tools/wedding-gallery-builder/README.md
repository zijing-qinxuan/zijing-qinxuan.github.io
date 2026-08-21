# 婚紗照片批次處理工具

這是只在 macOS 本機執行的開發工具。它使用系統內建的 `sips`，不需安裝 npm 圖片套件，也不會呼叫任何線上服務。

## 使用方式

1. 將原始婚紗照片放入 `tools/wedding-gallery-builder/original/`。
2. 支援 `.jpg`、`.jpeg`、`.png`（副檔名大小寫皆可）。
3. 檔案會依原始檔名的自然順序排列，例如 `IMG_001`、`IMG_002`、`IMG_003`。
4. 在專案根目錄執行：

   ```sh
   npm run build-gallery
   ```

   也可以直接執行：

   ```sh
   node tools/wedding-gallery-builder/build-gallery.js
   ```

## 輸出位置

每次成功執行會同時產生本機預覽與網站資產：

- `tools/wedding-gallery-builder/output/thumb/`
- `tools/wedding-gallery-builder/output/large/`
- `tools/wedding-gallery-builder/output/wedding-gallery-data.js`
- `assets/wedding-gallery/thumb/`
- `assets/wedding-gallery/large/`
- `assets/wedding-gallery/wedding-gallery-data.js`

所有照片都成功處理後才會替換既有輸出。若來源為空、格式不支援或任一圖片損壞，工具會顯示錯誤並保留原本網站資產。

## 圖片規格

工具只縮小、不放大、不裁切，完整保留原始比例，並輸出 JPEG：

| 用途 | 橫式長邊上限 | 直式長邊上限 | 起始品質 | 單檔目標上限 |
| --- | ---: | ---: | ---: | ---: |
| Carousel thumb | 1600px | 1400px | 80 | 500KB |
| Lightbox large | 3000px | 2500px | 85 | 1.5MB |

若檔案超過目標上限，工具會逐步降低 JPEG 品質，必要時再降低長邊；不會為了湊檔案大小而放大較小的原圖。

## 命名與排序

輸出檔名完全由工具產生，只包含英文、數字與連字號：

- 第一張：`01-cover.jpg`、`01-cover-large.jpg`
- 其餘：`02.jpg`、`02-large.jpg`、`03.jpg`、`03-large.jpg`……

要調整照片順序，只需調整 `original/` 內的檔名排序。未來新增照片後重新執行同一指令，不需要手動修改 Carousel 或 Lightbox HTML。

自動產生的 alt 文字格式為 `Zeric and Lily wedding photo 01`。若正式上線需要逐張描述照片內容，可在建置後人工校正 `assets/wedding-gallery/wedding-gallery-data.js`，但下次批次建置會重新產生該檔案。

## 僅測試、不發布

需要測試另一個來源資料夾而不覆寫網站時，可執行：

```sh
node tools/wedding-gallery-builder/build-gallery.js \
  --source /path/to/test-originals \
  --output /path/to/test-output \
  --no-publish
```

`original/` 與 `output/` 的內容已由 `.gitignore` 排除；工具程式本身則透過根目錄 `_config.yml` 的 `exclude: tools` 排除於 GitHub Pages 建置之外。
