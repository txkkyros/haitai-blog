import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAdjacentPosts, getPost } from "@/lib/posts";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// 请求时读取文件，后台保存后刷新即可看到
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return { title: "文章未找到" };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const { newer, older } = getAdjacentPosts(slug);

  return (
    <article className="article">
      <header className="article-head">
        <div className="article-meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="meta-dot" />
          <span>{post.readingMinutes} 分钟阅读</span>
        </div>
        <h1 className="article-title">{post.title}</h1>
        <div className="article-tags">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <nav className="article-nav" aria-label="文章导航">
        {newer ? (
          <Link href={`/posts/${newer.slug}`}>
            <span>← 上一篇</span>
            <strong>{newer.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {older ? (
          <Link className="next" href={`/posts/${older.slug}`}>
            <span>下一篇 →</span>
            <strong>{older.title}</strong>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
