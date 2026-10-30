/**
 * 极简 GitHub Contents API 封装。
 *
 * 配置了 GITHUB_TOKEN + GITHUB_REPO 时，后台的写入会变成提交到仓库，
 * 由 Vercel 检测到 push 后自动重新部署；没有配置时后台走本地文件系统。
 */

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";

export function githubEnabled(): boolean {
  return Boolean(TOKEN && REPO);
}

export function githubRepo(): string {
  return REPO ?? "";
}

export type GitHubEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
};

function encodePath(filePath: string): string {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "haitai-blog",
  };
}

function repoUrl(suffix: string): string {
  return `https://api.github.com/repos/${REPO}${suffix}`;
}

/** 读单个文件；不存在返回 null。 */
export async function ghGetFile(
  filePath: string,
): Promise<{ content: string; sha: string } | null> {
  const response = await fetch(
    repoUrl(`/contents/${encodePath(filePath)}?ref=${encodeURIComponent(BRANCH)}`),
    { headers: headers(), cache: "no-store" },
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`GitHub 读取失败 ${response.status}`);
  }

  const data = (await response.json()) as {
    content?: string;
    sha: string;
    encoding?: string;
  };

  const raw = data.content
    ? Buffer.from(data.content, (data.encoding as BufferEncoding) || "base64").toString("utf8")
    : "";

  return { content: raw, sha: data.sha };
}

/** 列目录；不存在返回空数组。 */
export async function ghListDir(dirPath: string): Promise<GitHubEntry[]> {
  const response = await fetch(
    repoUrl(`/contents/${encodePath(dirPath)}?ref=${encodeURIComponent(BRANCH)}`),
    { headers: headers(), cache: "no-store" },
  );

  if (response.status === 404) return [];

  if (!response.ok) {
    throw new Error(`GitHub 列目录失败 ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) return [];

  return data.map((entry) => ({
    name: String(entry.name),
    path: String(entry.path),
    type: entry.type === "dir" ? "dir" : "file",
    sha: String(entry.sha),
  })) as GitHubEntry[];
}

/** 新建或更新文件。传了 sha 就是更新。 */
export async function ghPutFile(
  filePath: string,
  content: string,
  message: string,
  sha?: string,
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: BRANCH,
  };

  if (sha) body.sha = sha;

  const response = await fetch(repoUrl(`/contents/${encodePath(filePath)}`), {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub 写入失败 ${response.status}：${detail.slice(0, 180)}`);
  }
}

/** 新建或更新文件（base64 内容，用于图片等二进制）。 */
export async function ghPutFileRaw(
  filePath: string,
  base64Content: string,
  message: string,
  sha?: string,
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content: base64Content,
    branch: BRANCH,
  };

  if (sha) body.sha = sha;

  const response = await fetch(repoUrl(`/contents/${encodePath(filePath)}`), {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub 写入失败 ${response.status}：${detail.slice(0, 180)}`);
  }
}

export async function ghDeleteFile(
  filePath: string,
  message: string,
  sha: string,
): Promise<void> {
  const response = await fetch(repoUrl(`/contents/${encodePath(filePath)}`), {
    method: "DELETE",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub 删除失败 ${response.status}：${detail.slice(0, 180)}`);
  }
}
