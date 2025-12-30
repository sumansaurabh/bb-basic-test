# 基础 Next.js 网站

一个简单的 Next.js 应用程序，使用 TypeScript 和 Tailwind CSS。

## 快速开始

### 开发环境
运行开发服务器：
```bash
pnpm dev
```
在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看网站。

### 构建
创建生产环境构建：
```bash
pnpm build
```

### 生产环境
启动生产服务器：
```bash
pnpm start
```

### 代码检查
运行 ESLint：
```bash
pnpm lint
```

## 项目结构
- `src/app/page.tsx` - 主页面组件
- `src/app/layout.tsx` - 根布局组件
- `src/app/globals.css` - 全局样式
- `public/` - 静态资源

## 技术栈
- **Next.js 15.4.6** - React 框架
- **React 19.1.0** - UI 库
- **TypeScript 5** - 类型安全
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **pnpm** - 包管理器

## 依赖项

### 生产依赖
- react (19.1.0)
- react-dom (19.1.0)
- next (15.4.6)
- typescript (^5)
- @types/node (^20)
- @types/react (^19)
- @types/react-dom (^19)

### 开发依赖
- @tailwindcss/postcss (^4)
- tailwindcss (^4)
- eslint (^9)
- eslint-config-next (15.4.6)
- @eslint/eslintrc (^3)
