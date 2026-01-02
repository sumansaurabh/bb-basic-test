# 基本的な Next.js ウェブサイト

TypeScript と Tailwind CSS を使用したシンプルな Next.js アプリケーション。

## はじめに

### 開発
開発サーバーを実行します。
```bash
pnpm dev
```
[http://localhost:3000](http://localhost:3000) を開いてウェブサイトを表示します。

### ビルド
プロダクションビルドを作成します。
```bash
pnpm build
```

### 本番環境
プロダクションサーバーを起動します。
```bash
pnpm start
```

### Linting
ESLint を実行します。
```bash
pnpm lint
```

## プロジェクト構造
- `src/app/page.tsx` - メインページコンポーネント
- `src/app/layout.tsx` - ルートレイアウトコンポーネント
- `src/app/globals.css` - グローバルスタイル
- `public/` - 静的アセット
