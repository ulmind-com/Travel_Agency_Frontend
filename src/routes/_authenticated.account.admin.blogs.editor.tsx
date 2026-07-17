import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import YoutubeExtension from "@tiptap/extension-youtube";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAdminBlogs, createAdminBlog, updateAdminBlog } from "@/services/blogs.service";
import { mediaService } from "@/services/media.service";
import { Loader2, Save, Send, Image as ImageIcon, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/admin/blogs/editor")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    return {
      id: search.id as string | undefined,
    };
  },
  component: BlogEditor,
});

function BlogEditor() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [heroImage, setHeroImage] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      YoutubeExtension,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[400px] text-cream-50",
      },
    },
  });

  const { data: blogData } = useQuery({
    queryKey: ["adminBlog", id],
    queryFn: () => getAdminBlogs({ search: id }),
    enabled: !!id,
  });

  useEffect(() => {
    if (id && blogData?.data?.length) {
      const blog = blogData.data.find((b: any) => b._id === id);
      if (blog) {
        setTitle(blog.title || "");
        setSubtitle(blog.subtitle || "");
        setCategory(blog.category || "");
        setTags(blog.tags?.join(", ") || "");
        setHeroImage(blog.hero_image);
        if (editor) {
          editor.commands.setContent(blog.content || "");
        }
      }
    }
  }, [id, blogData, editor]);

  const saveMutation = useMutation({
    mutationFn: (status: "DRAFT" | "PUBLISHED") => {
      const payload = {
        title,
        subtitle,
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        content: editor?.getHTML(),
        hero_image: heroImage,
        status
      };
      return id ? updateAdminBlog(id, payload) : createAdminBlog(payload);
    },
    onSuccess: () => {
      toast.success("Blog saved successfully");
      navigate({ to: "/account/admin/blogs" });
    },
    onError: () => {
      toast.error("Failed to save blog");
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const uploaded = await mediaService.upload(file);
      setHeroImage(uploaded);
      toast.success("Hero image uploaded");
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/account/admin/blogs" className="p-2 rounded-full hover:bg-cream-50/10 transition-colors">
            <ArrowLeft className="size-5 text-cream-50" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl text-cream-50">{id ? "Edit Article" : "Write Article"}</h1>
            <p className="text-sm text-cream-50/60 mt-1">Crafting luxury travel stories</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => saveMutation.mutate("DRAFT")}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-cream-50/20 bg-transparent px-4 py-2 text-sm font-medium text-cream-50 hover:bg-cream-50/10"
          >
            <Save className="size-4" />
            Save Draft
          </button>
          <button
            onClick={() => saveMutation.mutate("PUBLISHED")}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink-900 hover:bg-gold/90"
          >
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-cream-50/10 bg-ink-900/50 p-6 backdrop-blur-md">
            <input
              type="text"
              placeholder="Article Title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-transparent text-4xl font-serif text-cream-50 placeholder:text-cream-50/30 focus:outline-none mb-4"
            />
            <input
              type="text"
              placeholder="Subtitle or short description..."
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full bg-transparent text-lg text-cream-50/70 placeholder:text-cream-50/30 focus:outline-none mb-8"
            />
            
            <div className="border-t border-cream-50/10 pt-6">
              {/* Tiptap Toolbar */}
              <div className="flex items-center gap-2 mb-4 bg-ink-900 rounded-lg p-2 border border-cream-50/10">
                <button
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-cream-50/20 text-gold' : 'text-cream-50 hover:bg-cream-50/10'}`}
                >
                  B
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded ${editor?.isActive('italic') ? 'bg-cream-50/20 text-gold' : 'text-cream-50 hover:bg-cream-50/10'}`}
                >
                  I
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-cream-50/20 text-gold' : 'text-cream-50 hover:bg-cream-50/10'}`}
                >
                  H2
                </button>
                <button
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={`p-2 rounded ${editor?.isActive('blockquote') ? 'bg-cream-50/20 text-gold' : 'text-cream-50 hover:bg-cream-50/10'}`}
                >
                  Quote
                </button>
              </div>
              <EditorContent editor={editor} className="bg-transparent" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-cream-50/10 bg-ink-900/50 p-6 backdrop-blur-md">
            <h3 className="font-serif text-lg text-cream-50 mb-4">Hero Image</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video rounded-lg border-2 border-dashed border-cream-50/20 bg-ink-900 flex flex-col items-center justify-center cursor-pointer hover:bg-ink-800 transition-colors overflow-hidden"
            >
              {isUploading ? (
                <Loader2 className="size-6 animate-spin text-gold" />
              ) : heroImage ? (
                <img src={heroImage.url} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon className="size-8 text-cream-50/30 mb-2" />
                  <span className="text-sm text-cream-50/50">Upload Hero Image</span>
                </>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="rounded-2xl border border-cream-50/10 bg-ink-900/50 p-6 backdrop-blur-md space-y-4">
            <h3 className="font-serif text-lg text-cream-50 mb-2">Taxonomy</h3>
            <div>
              <label className="text-xs text-cream-50/50 uppercase tracking-wider mb-1 block">Category</label>
              <input
                type="text"
                placeholder="e.g. Travel Guides"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg bg-ink-900 border border-cream-50/10 px-4 py-2 text-sm text-cream-50 focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-cream-50/50 uppercase tracking-wider mb-1 block">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="luxury, hotels, nature"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full rounded-lg bg-ink-900 border border-cream-50/10 px-4 py-2 text-sm text-cream-50 focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
