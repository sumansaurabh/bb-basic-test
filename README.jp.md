# Basic Next.js Website

TypeScriptとTailwind CSSを使用したシンプルなNext.jsアプリケーション。

## はじめに

### 開発
開発サーバーを起動します。
```bash
pnpm dev
```
[http://localhost:3000](http://localhost:3000) を開いてウェブサイトを表示します。

### ビルド
プロダクションビルドを作成します。
```bash
pnpm build
```

### プロダクション
プロダクションサーバーを起動します。
```bash
pnpm start
```

### Linting
ESLintを実行します。
```bash
pnpm lint
```

## プロジェクト構造
- `src/app/page.tsx` - メインページコンポーネント
- `src/app/layout.tsx` - ルートレイアウトコンポーネント
- `src/app/globals.css` - グローバルスタイル
- `public/` - 静的アセット
