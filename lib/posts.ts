import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { ghGetFile, ghListDir, githubEnabled } from "./github";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const REPO_POSTS_DIR = "content/posts";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  readingMinutes: number;
};

export type Post = PostMeta & {
  html: string;
};

function estimateReadingMinutes(content: string): number {
  const cjk = (content.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = (
    content.replace(/[\u4e00-\u9fff]/g, " ").match(/[A-Za-z0-9]+/g) ?? []
  ).length;
  return Math.max(1, Math.round(cjk / 350 + words / 200));
}

function readMeta(slug: string, raw: string): PostMeta {
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? "1970-01-01"),
    excerpt: String(data.excerpt ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingMinutes: estimateReadingMinutes(content),
  };
}

/**
 * 页面路由里的 `params.slug` 是百分号编码的（API 路由里却不是），
 * 中文文件名必须解码一次才能对上仓库里的文件。
 */
function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/** 文章列表：线上从 GitHub 实时读，本地读磁盘。 */
export async function getAllPosts(): Promise<PostMeta[]> {
  if (githubEnabled()) {
    const entries = await ghListDir(REPO_POSTS_DIR);
    const files = entries.filter(
      (entry) => entry.type === "file" && entry.name.endsWith(".md"),
    );

    const metas = await Promise.all(
      files.map(async (entry) => {
        const file = await ghGetFile(entry.path);
        if (!file) return null;
        return readMeta(entry.name.replace(/\.md$/, ""), file.content);
      }),
    );

    return metas
      .filter((meta): meta is PostMeta => meta !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) =>
      readMeta(
        file.replace(/\.md$/, ""),
        fs.readFileSync(path.join(POSTS_DIR, file), "utf8"),
      ),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function readSource(slug: string): Promise<string | null> {
  if (githubEnabled()) {
    const file = await ghGetFile(`${REPO_POSTS_DIR}/${slug}.md`);
    return file ? file.content : null;
  }

  const full = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

export async function getPost(slug: string): Promise<Post | null> {
  const clean = normalizeSlug(slug);
  const raw = await readSource(clean);
  if (raw === null) return null;

  const { content } = matter(raw);

  return {
    ...readMeta(clean, raw),
    html: marked.parse(content, { async: false }) as string,
  };
}

export async function getAdjacentPosts(slug: string): Promise<{
  newer: PostMeta | null;
  older: PostMeta | null;
}> {
  const clean = normalizeSlug(slug);
  const posts = await getAllPosts();
  const index = posts.findIndex((post) => post.slug === clean);
  if (index === -1) return { newer: null, older: null };

  return {
    newer: index > 0 ? posts[index - 1] : null,
    older: index < posts.length - 1 ? posts[index + 1] : null,
  };
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}
