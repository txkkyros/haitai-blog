import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  ghDeleteFile,
  ghGetFile,
  ghListDir,
  ghPutFile,
  githubEnabled,
} from "./github";

/** 仓库里的相对路径（GitHub 模式用） */
const REPO_POSTS_DIR = "content/posts";
/** 本地绝对路径（本地模式用） */
const LOCAL_POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type DraftPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: string;
};

export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  updatedAt: number;
};

/** 只允许字母、数字、横线、下划线和中日韩文字，挡住路径穿越。 */
const SLUG_PATTERN = /^[\w\u4e00-\u9fff\u3040-\u30ff-]{1,120}$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !slug.includes("..");
}

function assertSlug(slug: string): void {
  if (!isValidSlug(slug)) {
    throw new Error(`非法的文件名：${slug}`);
  }
}

function localPath(slug: string): string {
  assertSlug(slug);
  return path.join(LOCAL_POSTS_DIR, `${slug}.md`);
}

/** 后台改动的保存方式：配置了 GitHub 就提交到仓库，否则写本地文件。 */
export function storageMode(): "github" | "local" {
  return githubEnabled() ? "github" : "local";
}

export async function listPosts(): Promise<PostSummary[]> {
  if (githubEnabled()) {
    const entries = await ghListDir(REPO_POSTS_DIR);
    const files = entries.filter((e) => e.type === "file" && e.name.endsWith(".md"));

    const posts = await Promise.all(
      files.map(async (entry) => {
        const file = await ghGetFile(entry.path);
        const data = file ? matter(file.content).data : {};
        const slug = entry.name.replace(/\.md$/, "");

        return {
          slug,
          title: String(data.title ?? slug),
          date: String(data.date ?? "1970-01-01"),
          updatedAt: 0,
        };
      }),
    );

    return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  if (!fs.existsSync(LOCAL_POSTS_DIR)) return [];

  return fs
    .readdirSync(LOCAL_POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const full = path.join(LOCAL_POSTS_DIR, file);
      const raw = fs.readFileSync(full, "utf8");
      const { data } = matter(raw);

      return {
        slug,
        title: String(data.title ?? slug),
        date: String(data.date ?? "1970-01-01"),
        updatedAt: fs.statSync(full).mtimeMs,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function readDraft(slug: string): Promise<DraftPost | null> {
  const parse = (raw: string): DraftPost => {
    const { data, content } = matter(raw);

    return {
      slug,
      title: String(data.title ?? slug),
      date: String(data.date ?? new Date().toISOString().slice(0, 10)),
      excerpt: String(data.excerpt ?? ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      content: content.replace(/^\n+/, ""),
    };
  };

  if (githubEnabled()) {
    assertSlug(slug);
    const file = await ghGetFile(`${REPO_POSTS_DIR}/${slug}.md`);
    return file ? parse(file.content) : null;
  }

  const full = localPath(slug);
  if (!fs.existsSync(full)) return null;
  return parse(fs.readFileSync(full, "utf8"));
}

export async function saveDraft(
  draft: DraftPost,
  previousSlug?: string,
): Promise<void> {
  assertSlug(draft.slug);

  const file = matter.stringify(draft.content.replace(/^\n+/, ""), {
    title: draft.title,
    date: draft.date,
    excerpt: draft.excerpt,
    tags: draft.tags,
  });

  const renamed = Boolean(previousSlug && previousSlug !== draft.slug);

  if (githubEnabled()) {
    const target = `${REPO_POSTS_DIR}/${draft.slug}.md`;

    if (renamed) {
      assertSlug(previousSlug as string);
      const old = await ghGetFile(`${REPO_POSTS_DIR}/${previousSlug}.md`);
      if (old) {
        await ghDeleteFile(
          `${REPO_POSTS_DIR}/${previousSlug}.md`,
          `重命名文章：${previousSlug} → ${draft.slug}`,
          old.sha,
        );
      }
    }

    const existing = await ghGetFile(target);
    await ghPutFile(
      target,
      file,
      `${existing ? "更新" : "新建"}文章：${draft.title || draft.slug}`,
      existing?.sha,
    );
    return;
  }

  if (!fs.existsSync(LOCAL_POSTS_DIR)) {
    fs.mkdirSync(LOCAL_POSTS_DIR, { recursive: true });
  }

  if (renamed) {
    const old = localPath(previousSlug as string);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }

  fs.writeFileSync(localPath(draft.slug), file, "utf8");
}

export async function deleteDraft(slug: string): Promise<boolean> {
  assertSlug(slug);

  if (githubEnabled()) {
    const target = `${REPO_POSTS_DIR}/${slug}.md`;
    const file = await ghGetFile(target);
    if (!file) return false;
    await ghDeleteFile(target, `删除文章：${slug}`, file.sha);
    return true;
  }

  const full = localPath(slug);
  if (!fs.existsSync(full)) return false;
  fs.unlinkSync(full);
  return true;
}
