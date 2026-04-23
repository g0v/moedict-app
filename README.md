# 萌典 — 離線版 App

**moedict-app** 是[萌典](https://www.moedict.tw/)的原生離線版本，以 [Capacitor](https://capacitorjs.com/) 將同一套 React 前端打包為 Android、iOS 與 macOS 應用程式。所有辭典資料、筆順動畫與全文檢索索引皆隨 App 一起安裝，不需網路即可使用。

## 與 moedict.tw 的關係

本專案不包含任何 React 原始碼。`src/` 是一個 symlink，指向 [moedict.tw](https://github.com/g0v/moedict.tw) 的 git submodule：

```
moedict-app/
  src -> moedict.tw/src     ← symlink，零重複
  moedict.tw/               ← git submodule（淺層 clone）
  capacitor.config.ts       ← 原生 App 設定
  scripts/prepare-data.sh   ← 從 submodule 複製辭典資料至 public/
  android/ ios/ macos/      ← Capacitor 原生專案
```

兩個專案共用**完全相同**的 `src/`。離線行為由 `src/offline-api.ts` 以執行環境偵測自動切換：

```typescript
// offline-api.ts — 在 Capacitor 中攔截 fetch；在網頁版完全不執行
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  // monkey-patch fetch → 從本地檔案服務辭典資料
}
```

| | moedict.tw | moedict-app |
|---|---|---|
| 部署方式 | Cloudflare Workers + R2 | Capacitor 原生 App |
| 資料來源 | R2 bucket（即時） | 本地檔案（打包時固定） |
| API 處理 | Worker `fetch` handler | `offline-api.ts` fetch 攔截 |
| 原始碼 | 此處為 canonical source | symlink → submodule |

## 收錄內容

| 語言 | 來源 | 條目數 | URL 前綴 |
|------|------|--------|----------|
| 臺灣華語 | 教育部《重編國語辭典修訂本》 | 160,000+ | `/` |
| 臺灣台語 | 教育部《臺灣台語常用詞辭典》 | 20,000+ | `/'` |
| 臺灣客語 | 教育部《臺灣客語辭典》 | 14,000+ | `/:` |
| 兩岸詞典 | 中華文化總會 | — | `/~` |

另含英／法／德文對照（CC-CEDict、CFDict、HanDeDict）及 4,806 字的筆順動畫資料。

## 開發

### 首次設定

```bash
git clone --recurse-submodules https://github.com/g0v/moedict-app.git
cd moedict-app
npm install          # 也會自動 init submodule
npm run prepare-data # 從 submodule 複製辭典資料至 public/
npm run dev
```

### 同步上游更新

當 moedict.tw 有新功能或修正時：

```bash
cd moedict.tw && git pull origin main && cd ..
git add moedict.tw
git commit -m "Update moedict.tw submodule"
```

### 建置 Android APK

```bash
npm run build:android  # prepare-data → tsc → vite build → cap sync
```

然後用 Android Studio 開啟 `android/` 進行簽章與發佈。

### 建置 iOS / macOS

```bash
npm run build
npx cap sync ios       # 或 npx cap sync macos
```

然後用 Xcode 開啟對應目錄。

note: 請用 `ios/App/App.xcworkspace` 開啟（不是開 App.xcodeproj）

## 技術架構

```
moedict.tw/src/（React 19 + TypeScript + Vite 7）
         ↓ symlink
    moedict-app 的 Vite build
         ↓
    Capacitor 7 sync
    ┌────┼────┐
 Android  iOS  macOS
```

- **React 19** + **React Router 7** — UI 與路由
- **Vite 7** — 開發與打包
- **Capacitor 7** — 原生 App 容器
- **Fuse.js** — 全文模糊搜尋（Web Worker 背景執行）
- **環境偵測** — `window.Capacitor` 判斷是否啟用離線 API 攔截

## 資料來源與授權

辭典本文著作權為**教育部**所有，採用 [CC BY-ND 3.0 臺灣](https://creativecommons.org/licenses/by-nd/3.0/tw/deed.zh_TW) 授權。

兩岸詞典由[中華文化總會](http://www.gacc.org.tw/)提供，採用 [CC BY-NC-ND 3.0 臺灣](https://creativecommons.org/licenses/by-nc-nd/3.0/tw/deed.zh_TW) 授權。

英／法／德文對照表採用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh_TW) 授權。

筆劃資料來源為教育部「[國字標準字體筆順學習網](https://stroke-order.learningweb.moe.edu.tw/)」。

程式碼由唐鳳以 [CC0 1.0 公眾領域貢獻宣告](https://creativecommons.org/publicdomain/zero/1.0/deed.zh_TW) 釋出。

## 相關專案

- [moedict.tw](https://github.com/g0v/moedict.tw) — 線上版前端（Cloudflare Workers）
- [moedict-webkit](https://github.com/g0v/moedict-webkit) — 原始前端實作
- [moedict-data](https://github.com/g0v/moedict-data) — 原始辭典資料
- [moedict-process](https://github.com/g0v/moedict-process) — 資料轉換流程

---

[g0v](https://g0v.tw/) 零時政府社群專案
