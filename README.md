# 海苔的博客

一个用 Next.js + Markdown 搭的个人博客。文章是 `content/posts` 里的 `.md` 文件，同时带一个本地管理后台，可以在浏览器里写。

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000。

日常使用直接双击项目根目录的 **`启动博客.cmd`**：它会用 dev 模式起服务（后台保存后前台立刻生效），再开一条公网隧道，窗口里会打印可以分享的 `https://xxxx.lhr.life` 地址。关掉窗口，网址就失效。

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
- 保存后前台更新：本地 `npm run dev` 立即生效，线上等 Vercel 重新部署（约 1 分钟）

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

## 构建与运行

```bash
npm run build
npm run start
```

前台页面（首页、文章列表、文章详情、关于）在**构建时**读取 `content/` 并静态化，所以用 `npm run start` 时改完文章要重新构建。本地写作建议直接用 `npm run dev`，每次请求都会重新读文件。

## 部署到 Vercel

后台有两种存储模式，由环境变量决定：

| 模式 | 触发条件 | 保存时做什么 |
|---|---|---|
| 本地 | 没有 `GITHUB_TOKEN` | 写当前机器的 `content/` 文件 |
| GitHub | 配了 `GITHUB_TOKEN` + `GITHUB_REPO` | 提交到仓库，Vercel 检测到后自动重新部署 |

线上**必须**用 GitHub 模式：Vercel 的文件系统是只读的，后台直接写文件会失败。

### 部署步骤

1. 在 GitHub 建一个空仓库（Public / Private 都行），不要勾选初始化 README。
2. 本地把代码推上去：

   ```bash
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

3. 生成访问令牌：GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**。仓库范围只选这一个仓库，权限给 **Contents: Read and write**。
4. 打开 [vercel.com](https://vercel.com) → Add New → Project → 导入这个仓库。框架会被自动识别为 Next.js，构建命令不用改。
5. 在项目的 Environment Variables 里加这几项：

   | 变量 | 值 |
   |---|---|
   | `ADMIN_PASSWORD` | 你的后台密码 |
   | `ADMIN_SECRET` | 一串随机字符 |
   | `GITHUB_TOKEN` | 第 3 步生成的令牌 |
   | `GITHUB_REPO` | `用户名/仓库名` |
   | `GITHUB_BRANCH` | `main` |

6. Deploy，完成后访问 `https://项目名.vercel.app/admin` 登录。

### 上线后要知道的

- 后台保存 → 提交到仓库 → Vercel 重新部署（约 1 分钟）→ 前台更新。后台会提示「已提交到 GitHub，Vercel 正在重新部署」。
- Vercel 免费版每个项目只保留最近 **3 次**生产部署。
- `*.vercel.app` 域名可以直接用，不需要买域名。
- 想断绝所有已登录设备，改 `ADMIN_SECRET` 后重新部署即可。
- 正文里的图片目前需要外链（图床 / 仓库里的 `public/` 目录），后台还不支持上传。

## 结构

```text
app/
  page.tsx              首页
  posts/page.tsx        文章列表
  posts/[slug]/page.tsx 文章详情
  about/page.tsx        关于
  admin/page.tsx        后台首页（未登录显示登录框）
  admin/edit/page.tsx   文章编辑器
  admin/about/page.tsx  关于页面编辑器
  api/admin/login/      登录接口
  api/admin/logout/     退出接口
  api/admin/posts/      文章增删改接口
  api/admin/about/      关于页面保存接口
components/
  SiteHeader.tsx        页头
  SiteFooter.tsx        页脚
  PostCard.tsx          文章卡片
  admin/                后台组件
lib/
  posts.ts              前台读取与渲染
  admin-posts.ts        后台读写（自动切换本地 / GitHub）
  github.ts             GitHub Contents API 封装
  about.ts              关于页面读写
  auth.ts               密码校验与会话
content/posts/          文章目录
content/about.md        关于页面内容
```

## 技术栈

- Next.js 16（App Router）
- TypeScript
- `gray-matter` 解析 frontmatter
- `marked` 渲染 Markdown
- 手写 CSS，无 UI 框架
- 后台鉴权：HMAC 签名 cookie，无数据库
