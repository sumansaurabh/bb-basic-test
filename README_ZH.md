# 基础 Next.js 网站

一个简单的 Next.js 应用程序，使用 TypeScript 和 Tailwind CSS 构建。

## 快速开始

### 开发环境
运行开发服务器：
```bash
pnpm dev
```
打开 [http://localhost:3000](http://localhost:3000) 在浏览器中查看网站。

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
- **框架**: Next.js 15.4.6
- **UI 库**: React 19.1.0
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **代码规范**: ESLint

## 安装依赖

使用 pnpm 安装项目依赖：
```bash
pnpm install
```

## 部署

本项目可以部署到以下平台：
- Vercel（推荐）
- Google Cloud Run
- 其他 Node.js 托管平台

### Google Cloud Run 部署
详细的 GCP 部署说明请参阅 [GCP.md](GCP.md)。

## 许可证

本项目为私有项目。

## 相关文档
- [English README](README.md) - 英文版说明文档
- [GCP 部署指南](GCP.md) - Google Cloud Platform 部署详细说明
- [Cloud Run 修复文档](README_CLOUDRUN_FIXES.md) - Cloud Run 相关问题修复
