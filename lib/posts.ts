import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

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

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      return readMeta(slug, raw);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * 页面路由里的 `params.slug` 是百分号编码的（API 路由里却不是），
 * 中文文件名必须解码一次才能对上磁盘上的文件。
 */
function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export function getPost(slug: string): Post | null {
  const clean = normalizeSlug(slug);
  const file = path.join(POSTS_DIR, `${clean}.md`);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf8");
  const { content } = matter(raw);
  const meta = readMeta(clean, raw);

  return {
    ...meta,
    html: marked.parse(content, { async: false }) as string,
  };
}

export function getAdjacentPosts(slug: string): {
  newer: PostMeta | null;
  older: PostMeta | null;
} {
  const clean = normalizeSlug(slug);
  const posts = getAllPosts();
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
