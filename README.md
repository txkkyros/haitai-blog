# 海苔的博客

一个用 Next.js + Markdown 搭的个人博客。文章是 `content/posts` 里的 `.md` 文件，同时带一个本地管理后台，可以在浏览器里写。

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000。

## 管理后台

地址：**http://localhost:3000/admin**

第一次访问会要求输入密码。密码配置在 `.env.local`：

```env
ADMIN_PASSWORD=你的密码
ADMIN_SECRET=一串随机字符
```

`ADMIN_SECRET` 用来签名登录会话。换掉它，所有已登录的浏览器会立刻掉线。改完 `.env.local` 需要**重启服务**才生效。

后台能做的事：

- 列出所有文章，带日期和文件名
- 新建 / 编辑文章：标题、文件名、日期、摘要、标签、Markdown 正文
- 右侧实时预览
- 删除文章（二次确认）
- 保存后前台立即生效，不需要重新构建

登录状态存在 httpOnly cookie 里，有效期 7 天。点「退出登录」可以立即清除。

### 关于页面

后台顶部有两个标签：**文章** 和 **关于页面**。在「关于页面」里写的内容（Markdown）会直接渲染到 `/about`，保存即生效，不需要改代码。内容存在 `content/about.md`，为空时 `/about` 显示空白页。

## 写文章（手动方式）

也可以不用后台，直接在 `content/posts/` 新建 `.md` 文件。文件名就是 URL 里的 slug，例如 `my-post.md` → `/posts/my-post`。

开头写 frontmatter：

```yaml
---
title: 文章标题
date: "2026-10-30"
excerpt: 列表页显示的一句话摘要。
tags:
  - 随笔
---
```

正文用 Markdown 写，支持标题、列表、引用、代码块和图片。

> 文件名只允许文字、数字、横线和下划线，用来防止路径穿越。

## 构建与部署

```bash
npm run build
npm run start
```

首页、文章列表和文章详情都是请求时读取文件（`force-dynamic`），所以后台改完刷新就能看到。部署到 Vercel 等平台时，需要把 `ADMIN_PASSWORD`、`ADMIN_SECRET` 配成环境变量；如果部署到公网，建议同时把后台限制为只允许你自己的网络访问。

## 结构

```text
app/
  page.tsx              首页
  posts/page.tsx        文章列表
  posts/[slug]/page.tsx 文章详情
  about/page.tsx        关于
  admin/page.tsx        后台首页（未登录显示登录框）
  admin/edit/page.tsx   文章编辑器
  api/admin/login/      登录接口
  api/admin/logout/     退出接口
  api/admin/posts/      文章增删改接口
components/
  SiteHeader.tsx        页头
  SiteFooter.tsx        页脚
  PostCard.tsx          文章卡片
  admin/                后台组件
lib/
  posts.ts              前台读取与渲染
  admin-posts.ts        后台文件读写
  auth.ts               密码校验与会话
content/posts/          文章目录
```

## 技术栈

- Next.js 16（App Router）
- TypeScript
- `gray-matter` 解析 frontmatter
- `marked` 渲染 Markdown
- 手写 CSS，无 UI 框架
- 后台鉴权：HMAC 签名 cookie，无数据库
