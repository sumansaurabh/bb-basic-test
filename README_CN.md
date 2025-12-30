# Next.js 项目

一个使用 TypeScript 和 Tailwind CSS 构建的简单 Next.js 应用程序。

## 技术栈

- **Next.js 15.4.6** - React 框架
- **React 19.1.0** - UI 库
- **TypeScript 5** - 类型安全
- **Tailwind CSS 4** - 样式框架
- **ESLint** - 代码检查工具

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

运行开发服务器：

```bash
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

创建生产环境构建：

```bash
pnpm build
```

### 启动生产服务器

运行生产环境服务器：

```bash
pnpm start
```

### 代码检查

运行 ESLint 检查代码：

```bash
pnpm lint
```

## 项目结构

```
nextjs-repo/
├── src/
│   └── app/
│       ├── page.tsx          # 主页面组件
│       ├── layout.tsx        # 根布局组件
│       └── globals.css       # 全局样式
├── public/                   # 静态资源文件
├── package.json              # 项目依赖配置
├── tsconfig.json             # TypeScript 配置
├── next.config.ts            # Next.js 配置
├── tailwind.config.ts        # Tailwind CSS 配置
└── eslint.config.mjs         # ESLint 配置
```

## 可用脚本

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm lint` - 运行代码检查

## 部署

### Vercel 部署

最简单的部署方式是使用 [Vercel 平台](https://vercel.com)：

1. 将代码推送到 Git 仓库
2. 在 Vercel 中导入项目
3. Vercel 会自动检测 Next.js 并进行配置
4. 点击部署即可

### Docker 部署

项目包含 Dockerfile，可以使用 Docker 进行部署：

```bash
# 构建镜像
docker build -t nextjs-app .

# 运行容器
docker run -p 3000:3000 nextjs-app
```

### Google Cloud Run 部署

使用提供的部署脚本：

```bash
./deploy.sh
```

## 开发指南

### 添加新页面

在 `src/app` 目录下创建新文件夹和 `page.tsx` 文件：

```typescript
// src/app/about/page.tsx
export default function About() {
  return <h1>关于我们</h1>
}
```

### 使用 Tailwind CSS

在组件中直接使用 Tailwind 类名：

```typescript
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-blue-600">
        欢迎使用 Next.js
      </h1>
    </div>
  )
}
```

### TypeScript 支持

项目完全支持 TypeScript，可以为组件添加类型：

```typescript
interface Props {
  title: string
  description?: string
}

export default function Card({ title, description }: Props) {
  return (
    <div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}
```

## 环境变量

在项目根目录创建 `.env.local` 文件来配置环境变量：

```env
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=your_database_url
```

## 了解更多

- [Next.js 文档](https://nextjs.org/docs) - 学习 Next.js 特性和 API
- [React 文档](https://react.dev) - 学习 React
- [Tailwind CSS 文档](https://tailwindcss.com/docs) - 学习 Tailwind CSS
- [TypeScript 文档](https://www.typescriptlang.org/docs) - 学习 TypeScript

## 许可证

本项目为私有项目。

## 贡献

欢迎提交问题和拉取请求！

## 支持

如有问题，请创建 Issue 或联系项目维护者。
