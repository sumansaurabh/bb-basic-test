# 基础 Next.js 网站

一个使用 TypeScript 和 Tailwind CSS 构建的简单 Next.js 应用程序。

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
运行 ESLint 代码检查：
```bash
pnpm lint
```

## 项目结构
```
nextjs-repo/
├── src/
│   └── app/
│       ├── api/                    # API 路由
│       │   ├── heavy-processing/   # 重型处理端点
│       │   └── test/               # 测试端点
│       ├── components/             # React 组件
│       │   ├── ClientHeavyComponents.tsx  # 客户端重型组件
│       │   └── ServerSideContent.tsx      # 服务端渲染内容
│       ├── page.tsx                # 主页面组件
│       ├── layout.tsx              # 根布局组件
│       ├── globals.css             # 全局样式
│       ├── loading.tsx             # 加载状态组件
│       ├── error.tsx               # 错误处理组件
│       └── not-found.tsx           # 404 页面
├── public/                         # 静态资源
├── Dockerfile                      # Docker 容器配置
├── cloudrun.yaml                   # Google Cloud Run 配置
└── package.json                    # 项目依赖
```

## 技术栈

- **框架**: [Next.js 15.4.6](https://nextjs.org/)
- **语言**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI 框架**: [React 19.1.0](https://react.dev/)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **代码检查**: [ESLint 9](https://eslint.org/)
- **包管理器**: [pnpm](https://pnpm.io/)

## 功能特性

- ⚡ **快速开发**: 使用 Next.js 的热模块替换（HMR）实现即时反馈
- 🎨 **现代样式**: 使用 Tailwind CSS 4 进行实用优先的样式设计
- 📱 **响应式设计**: 移动优先的响应式布局
- 🔒 **类型安全**: 完整的 TypeScript 支持
- 🚀 **优化生产**: 自动代码分割和优化
- 🐳 **容器化**: 包含 Docker 配置用于部署
- ☁️ **云就绪**: 配置用于 Google Cloud Run 部署

## 部署

### Docker 部署

构建 Docker 镜像：
```bash
docker build -t nextjs-app .
```

运行容器：
```bash
docker run -p 3000:3000 nextjs-app
```

### Google Cloud Run 部署

快速部署（30 秒）：
```bash
gcloud run services update bb-1 --memory=1Gi --cpu=1 --region=europe-west1 --project=penify-prod
```

完整部署（5 分钟）：
```bash
./deploy.sh
```

手动部署：
```bash
docker build -t gcr.io/penify-prod/bb-1:latest .
docker push gcr.io/penify-prod/bb-1:latest
gcloud run deploy bb-1 --image=gcr.io/penify-prod/bb-1:latest --memory=1Gi --cpu=1 --region=europe-west1 --project=penify-prod
```

## 性能优化

此项目包含以下生产环境优化：

- ✅ **内存管理**: 配置 1GB 内存限制，预留 30% 安全余量
- ✅ **优雅关闭**: 正确处理 SIGTERM、SIGINT、SIGPIPE 信号
- ✅ **响应压缩**: 启用 gzip 压缩以减少传输大小
- ✅ **独立输出**: 使用 Next.js 独立模式减小容器大小
- ✅ **图片优化**: 自动图片优化和延迟加载
- ✅ **包优化**: 优化的包导入以减少包大小
- ✅ **自动扩展**: 配置 0-10 个实例的自动扩展

## 开发指南

### 添加新页面

在 `src/app/` 目录下创建新文件夹：
```bash
mkdir src/app/new-page
touch src/app/new-page/page.tsx
```

### 添加 API 路由

在 `src/app/api/` 目录下创建新文件夹：
```bash
mkdir src/app/api/new-endpoint
touch src/app/api/new-endpoint/route.ts
```

### 添加组件

在 `src/app/components/` 目录下创建新组件：
```bash
touch src/app/components/MyComponent.tsx
```

## 环境要求

- **Node.js**: 20.x 或更高版本
- **pnpm**: 最新版本
- **操作系统**: Linux、macOS 或 Windows

## 故障排除

### 内存不足错误

如果遇到内存不足错误，增加 Node.js 堆大小：
```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

### 端口已被占用

如果 3000 端口已被占用，使用不同的端口：
```bash
PORT=3001 pnpm dev
```

### 构建失败

清除缓存并重新构建：
```bash
rm -rf .next node_modules .pnpm-store
pnpm install
pnpm build
```

## 相关文档

- [README_CLOUDRUN_FIXES.md](./README_CLOUDRUN_FIXES.md) - Cloud Run 错误修复详情
- [Next.js 文档](https://nextjs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 许可证

私有项目

## 贡献

欢迎提交问题报告和拉取请求。

---

*最后更新: 2025 年 12 月*
