# 基础 Next.js 网站

一个使用 TypeScript 和 Tailwind CSS 的简单 Next.js 应用程序。

## 快速开始

### 开发环境

运行开发服务器：
```bash
pnpm dev
```
打开 [http://localhost:3000](http://localhost:3000) 查看网站。

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

运行 ESLint 检查：
```bash
pnpm lint
```

## 项目结构
- `src/app/page.tsx` - 主页组件
- `src/app/layout.tsx` - 根布局组件
- `src/app/globals.css` - 全局样式
- `public/` - 静态资源

## 技术栈

- **框架**: Next.js 15.4.6
- **React**: 19.1.0
- **TypeScript**: 5.x
- **样式**: Tailwind CSS 4.x
- **代码规范**: ESLint

## 系统要求

- Node.js 20 或更高版本
- pnpm 包管理器

## 安装步骤

1. 克隆仓库
2. 安装依赖：
   ```bash
   pnpm install
   ```
3. 运行开发服务器：
   ```bash
   pnpm dev
   ```

## 部署

本项目支持多种部署方式：

### Vercel（推荐）
使用 Vercel 进行一键部署，这是 Next.js 的原生平台。

### Google Cloud Run
请参阅 [GCP.md](./GCP.md) 了解 Google Cloud Run 部署详情。

### Docker
使用提供的 Dockerfile 构建和部署：
```bash
docker build -t nextjs-app .
docker run -p 3000:3000 nextjs-app
```

## 许可证

Private

## 相关文档

- [English README](./README.md)
- [Google Cloud Run 部署指南](./GCP.md)
- [Cloud Run 修复说明](./CLOUDRUN_FIX.md)
