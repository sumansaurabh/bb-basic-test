# 基礎 Next.js 網站

一個簡單的帶有 TypeScript 和 Tailwind CSS 的 Next.js 應用程式。

## 開始使用

### 開發
運行開發伺服器：
```bash
pnpm dev
```
打開 [http://localhost:3000](http://localhost:3000) 查看網站。

### 建置
創建生產建置：
```bash
pnpm build
```

### 生產
啟動生產伺服器：
```bash
pnpm start
```

### 程式碼檢查
運行 ESLint：
```bash
pnpm lint
```

## 專案結構
- `src/app/page.tsx` - 主頁面元件
- `src/app/layout.tsx` - 根佈局元件
- `src/app/globals.css` - 全域樣式
- `public/` - 靜態資源