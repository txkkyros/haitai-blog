import PostCard from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";

// 请求时读取文件，后台保存后刷新即可看到
export const dynamic = "force-dynamic";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="home-head">
        <p className="home-signature">From 一片烂海苔</p>
      </section>

      {posts.length > 0 ? (
        <div className="post-grid">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="empty">还没有文章。</p>
      )}
    </>
  );
}
