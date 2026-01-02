# 基本的な Next.js ウェブサイト

TypeScript と Tailwind CSS を使用したシンプルな Next.js アプリケーション。

## はじめに

### 開発環境
開発サーバーを起動する：
```bash
pnpm dev
```
[http://localhost:3000](http://localhost:3000) を開いてウェブサイトを表示します。

### ビルド
本番用ビルドを作成する：
```bash
pnpm build
```

### 本番環境
本番サーバーを起動する：
```bash
pnpm start
```

### リント
ESLint を実行する：
```bash
pnpm lint
```

## プロジェクト構造
- `src/app/page.tsx` - メインページコンポーネント
- `src/app/layout.tsx` - ルートレイアウトコンポーネント
- `src/app/globals.css` - グローバルスタイル
- `public/` - 静的アセット
