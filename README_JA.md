# ベーシック Next.js ウェブサイト

TypeScript と Tailwind CSS を使用したシンプルな Next.js アプリケーション。

## はじめに

### 開発
開発サーバーを実行：
```bash
pnpm dev
```
ウェブサイトを表示するには [http://localhost:3000](http://localhost:3000) を開いてください。

### ビルド
プロダクションビルドを作成：
```bash
pnpm build
```

### プロダクション
プロダクションサーバーを起動：
```bash
pnpm start
```

### リンティング
ESLint を実行：
```bash
pnpm lint
```

## プロジェクト構造
- `src/app/page.tsx` - メインページコンポーネント
- `src/app/layout.tsx` - ルートレイアウトコンポーネント
- `src/app/globals.css` - グローバルスタイル
- `public/` - 静的アセット
