import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getBlogBySlug, translatePublicBlog } from "@/services/blogs.service";
import { format } from "date-fns";
import { Clock, ArrowLeft, Bookmark, Heart, Share2, Calendar, Loader2, Globe } from "lucide-react";
import { Container } from "@/components/layout/container";
import { toast } from "sonner";
import { useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

import heroBg from "@/assets/hero-slide-kyoto.jpg"; // Default fallback

export const Route = createFileRoute("/blogs/$slug")({
  component: BlogDetail,
});

function BlogDetail() {
  const { slug } = Route.useParams();
  const [currentLang, setCurrentLang] = useState("en");
  
  const { scrollYProgress, scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 400]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  const { data: blog, isLoading: isBlogLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => getBlogBySlug(slug),
  });

  const translateMutation = useMutation({
    mutationFn: (lang: string) => translatePublicBlog(slug, lang),
    onSuccess: () => toast.success("Translated beautifully."),
    onError: () => {
      toast.error("Could not translate at the moment.");
      setCurrentLang("en");
    }
  });

  const displayTitle = translateMutation.data?.title || blog?.title;
  const displaySubtitle = translateMutation.data?.subtitle || blog?.subtitle;
  const displayContent = translateMutation.data?.content || blog?.content;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setCurrentLang(lang);
    if (lang === "en") {
      translateMutation.reset();
    } else {
      translateMutation.mutate(lang);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  if (isBlogLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="size-12 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto" />
          <p className="text-[10px] uppercase tracking-widest text-ink-900/40">Curating story...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center gap-6">
        <h1 className="font-serif text-5xl text-ink-900">Story Not Found</h1>
        <Link to="/blogs" className="text-[11px] font-bold uppercase tracking-widest text-gold hover:text-ink-900 transition-colors">
          Return to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen relative selection:bg-gold/20 selection:text-ink-900">
      
      {/* Sticky Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 h-[3px] bg-gold z-[100] origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Floating Header Utilities */}
      <div className="absolute top-8 left-6 right-6 z-50 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          <Link to="/blogs" className="group flex items-center gap-3 rounded-full bg-white/40 backdrop-blur-md border border-white/20 pl-2 pr-5 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-900 transition-all hover:bg-white/80 shadow-sm">
            <div className="bg-white rounded-full p-1.5 shadow-sm group-hover:-translate-x-0.5 transition-transform">
              <ArrowLeft className="size-3" /> 
            </div>
            Journal
          </Link>
          
          <div className="relative group flex items-center bg-white/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 shadow-sm hover:bg-white/80 transition-all">
            <Globe className="size-3 text-ink-900/70 mr-2" />
            <select 
              value={currentLang}
              onChange={handleLanguageChange}
              className="appearance-none bg-transparent text-ink-900 text-xs focus:outline-none cursor-pointer font-bold uppercase tracking-widest pr-2"
              disabled={translateMutation.isPending}
            >
              <option value="en">EN</option>
              <option value="bn">BN</option>
              <option value="hi">HI</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
            </select>
            {translateMutation.isPending && (
              <Loader2 className="absolute -right-6 size-4 text-gold animate-spin" />
            )}
          </div>
        </div>
      </div>

      <article>
        {/* Parallax Hero Image */}
        <div className="relative h-[80vh] w-full overflow-hidden bg-ink-900">
          <motion.img 
            style={{ y: heroY, opacity: heroOpacity }}
            src={blog.hero_image?.url || heroBg} 
            alt={displayTitle} 
            className="absolute inset-0 w-full h-[120%] object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cream-50 via-cream-50/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/30 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-24 text-center">
            <AnimatePresence mode="wait">
              <motion.div 
                key={displayTitle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-6 drop-shadow-sm">
                  {blog.category}
                </p>
                <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight text-ink-900 max-w-5xl mx-auto mb-8 drop-shadow-sm">
                  {displayTitle}
                </h1>
                {displaySubtitle && (
                  <p className="text-lg md:text-2xl text-ink-900/70 max-w-3xl mx-auto leading-relaxed font-light">
                    {displaySubtitle}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Content Section */}
        <Container>
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 -mt-12 relative z-20 pb-32">
            
            {/* Sticky Engagement Sidebar */}
            <div className="hidden lg:block w-20 shrink-0">
              <div className="sticky top-32 flex flex-col items-center gap-8 py-8 px-2 rounded-full border border-ink-900/10 bg-white/50 backdrop-blur-md shadow-sm">
                <button className="group text-ink-900/40 hover:text-red-500 transition-all flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full group-hover:bg-red-50 transition-colors">
                    <Heart className="size-5" />
                  </div>
                  <span className="text-[9px] font-bold tracking-widest">{blog.stats.likes || 0}</span>
                </button>
                <div className="w-8 h-px bg-ink-900/10" />
                <button className="group text-ink-900/40 hover:text-gold transition-all">
                  <div className="p-3 rounded-full group-hover:bg-gold/10 transition-colors">
                    <Bookmark className="size-5" />
                  </div>
                </button>
                <div className="w-8 h-px bg-ink-900/10" />
                <button onClick={handleShare} className="group text-ink-900/40 hover:text-blue-500 transition-all">
                  <div className="p-3 rounded-full group-hover:bg-blue-50 transition-colors">
                    <Share2 className="size-5" />
                  </div>
                </button>
              </div>
            </div>

            {/* Main Rich Text Content */}
            <div className="flex-1 max-w-3xl mx-auto lg:mx-0">
              {/* Author Meta Info */}
              <div className="flex items-center justify-between pb-8 mb-12 border-b border-ink-900/10">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-gradient-to-tr from-gold to-yellow-300 text-ink-900 flex items-center justify-center font-serif text-xl shadow-md">
                    {blog.author_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink-900 tracking-wide">{blog.author_name || "Editorial Team"}</p>
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-ink-900/50 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="size-3" /> {format(new Date(blog.published_at || blog.created_at), "MMM dd, yyyy")}</span>
                      <span className="w-1 h-1 rounded-full bg-ink-900/20" />
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {blog.reading_time} min read</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* The Content */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentLang}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="prose prose-lg md:prose-xl prose-headings:font-serif prose-headings:font-normal prose-headings:text-ink-900 prose-p:text-ink-900/80 prose-p:leading-relaxed prose-a:text-gold hover:prose-a:text-gold/80 prose-img:rounded-3xl prose-img:shadow-lg prose-blockquote:border-l-gold prose-blockquote:bg-gold/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:font-serif prose-blockquote:text-2xl prose-blockquote:leading-snug prose-blockquote:not-italic prose-blockquote:text-ink-900 first-letter:float-left first-letter:text-7xl first-letter:pr-4 first-letter:font-serif first-letter:text-ink-900 first-letter:pt-2"
                  dangerouslySetInnerHTML={{ __html: displayContent }} 
                />
              </AnimatePresence>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-16 pt-8 border-t border-ink-900/10 flex flex-wrap gap-3">
                  {blog.tags.map((tag: string) => (
                    <span key={tag} className="px-4 py-2 rounded-full border border-ink-900/10 text-[10px] uppercase tracking-widest text-ink-900/60 hover:border-gold hover:text-gold transition-colors cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </Container>
      </article>
    </div>
  );
}

