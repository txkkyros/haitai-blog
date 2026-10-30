import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "文章",
  description: "海苔的全部文章。",
};

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="page-head">
        <p className="section-kicker">02 / ARCHIVE</p>
        <h1 className="page-title">文章</h1>
        <p className="page-lede">
          按时间倒序排列。想到什么写什么，不定期更新。
        </p>
      </section>

      {posts.length > 0 ? (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug} className="post-list-item">
              <Link href={`/posts/${post.slug}`}>
                <time className="post-list-date" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                <span className="post-list-title">{post.title}</span>
                <span className="post-list-time">{post.readingMinutes} 分钟</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">还没有文章。</p>
      )}
    </>
  );
}
