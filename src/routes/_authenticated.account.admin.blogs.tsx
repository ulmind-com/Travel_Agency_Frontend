import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Eye, ExternalLink } from "lucide-react";
import { getAdminBlogs, deleteAdminBlog } from "@/services/blogs.service";
import { format } from "date-fns";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/account/admin/blogs")({
  component: AdminBlogs,
});

function AdminBlogs() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;

  const [page, setPage] = useState(0);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminBlogs", page],
    queryFn: () => getAdminBlogs({ skip: page * 10, limit: 10 }),
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      await deleteAdminBlog(id);
      refetch();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-cream-50">Journal CMS</h1>
          <p className="text-sm text-cream-50/60 mt-1">Manage luxury travel journal articles</p>
        </div>
        <Link
          to="/account/admin/blogs/editor"
          className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-gold/90"
        >
          <Plus className="size-4" />
          Write Article
        </Link>
      </div>

      <div className="rounded-2xl border border-cream-50/10 bg-ink-900/50 p-6 backdrop-blur-md">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded bg-cream-50/5" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-cream-50/70">
              <thead className="border-b border-cream-50/10 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-50/10">
                {data?.data.map((blog) => (
                  <tr key={blog._id} className="transition-colors hover:bg-cream-50/5">
                    <td className="px-4 py-4 font-medium text-cream-50 max-w-xs truncate">
                      {blog.title}
                    </td>
                    <td className="px-4 py-4">{blog.category}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${
                        blog.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' :
                        blog.status === 'DRAFT' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-cream-50/20 text-cream-50'
                      }`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">{blog.stats.views}</td>
                    <td className="px-4 py-4">{format(new Date(blog.created_at), "MMM dd, yyyy")}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/blogs/${blog.slug}`}
                          target="_blank"
                          className="rounded p-1.5 text-cream-50/50 hover:bg-cream-50/10 hover:text-cream-50"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                        <Link
                          to={`/account/admin/blogs/editor`}
                          search={{ id: blog._id }}
                          className="rounded p-1.5 text-blue-400/50 hover:bg-blue-400/10 hover:text-blue-400"
                        >
                          <Edit2 className="size-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="rounded p-1.5 text-red-400/50 hover:bg-red-400/10 hover:text-red-400"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-cream-50/50">
                      No articles found. Start writing!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
