import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { ghGetFile, ghPutFile, githubEnabled } from "./github";

const ABOUT_FILE = path.join(process.cwd(), "content", "about.md");
const REPO_ABOUT_FILE = "content/about.md";

export function readAbout(): string {
  if (!fs.existsSync(ABOUT_FILE)) return "";
  return fs.readFileSync(ABOUT_FILE, "utf8");
}

export function writeAbout(content: string): void {
  const dir = path.dirname(ABOUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(ABOUT_FILE, content, "utf8");
}

/** 后台保存：配置了 GitHub 就提交到仓库，否则写本地文件。 */
export async function writeAboutAsync(content: string): Promise<void> {
  if (githubEnabled()) {
    const existing = await ghGetFile(REPO_ABOUT_FILE);
    await ghPutFile(
      REPO_ABOUT_FILE,
      content,
      existing ? "更新关于页面" : "创建关于页面",
      existing?.sha,
    );
    return;
  }

  writeAbout(content);
}

export function renderAbout(source: string): string {
  return marked.parse(source, { async: false }) as string;
}
