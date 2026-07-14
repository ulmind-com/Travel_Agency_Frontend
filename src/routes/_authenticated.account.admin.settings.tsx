import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { useAuth } from "@/lib/auth-context";
import { apiErrorMessage } from "@/lib/api";
import { cmsService } from "@/services/cms.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute(
  "/_authenticated/account/admin/settings",
)({
  head: () => ({
    meta: [
      { title: "Site Settings — Admin · Ulmind Travel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettingsPage,
});

const DEFAULT_ABOUT_US = {
  headline: "Crafting journeys of quiet luxury.",
  description: "Ulmind Travel curates highly personalized, premium experiences.",
  mission: "To redefine travel through personalization.",
  vision: "To be the leading luxury travel concierge.",
};

const DEFAULT_SEO = {
  metaTitle: "Ulmind Travel — Quiet luxury, curated journeys",
  metaDescription: "Private itineraries and concierge-led escapes.",
  robots: "index, follow",
};

const DEFAULT_POLICIES = {
  privacyPolicy: "Your privacy is important to us...",
  termsOfService: "By using our platform...",
  refundPolicy: "Refunds are processed within 7 business days...",
};

function AdminSettingsPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("about");
  
  const [aboutUs, setAboutUs] = useState(DEFAULT_ABOUT_US);
  const [seo, setSeo] = useState(DEFAULT_SEO);
  const [policies, setPolicies] = useState(DEFAULT_POLICIES);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/account", replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      cmsService.get("about_us", DEFAULT_ABOUT_US),
      cmsService.get("seo_settings", DEFAULT_SEO),
      cmsService.get("policies", DEFAULT_POLICIES),
    ]).then(([about, seoData, pol]) => {
      if (alive) {
        setAboutUs(about);
        setSeo(seoData);
        setPolicies(pol);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="grid min-h-[40vh] place-items-center px-6">
        <p className="text-sm text-ink-900/50">Checking access…</p>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      if (activeTab === "about") await cmsService.save("about_us", aboutUs);
      if (activeTab === "seo") await cmsService.save("seo_settings", seo);
      if (activeTab === "policies") await cmsService.save("policies", policies);
      toast.success("Settings published successfully");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const patchAbout = (p: Partial<typeof DEFAULT_ABOUT_US>) => setAboutUs((s) => ({ ...s, ...p }));
  const patchSeo = (p: Partial<typeof DEFAULT_SEO>) => setSeo((s) => ({ ...s, ...p }));
  const patchPolicies = (p: Partial<typeof DEFAULT_POLICIES>) => setPolicies((s) => ({ ...s, ...p }));

  return (
    <div className="admin-studio">
      <Container className="py-8 sm:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-10 sm:gap-6">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              Admin · Configuration
            </p>
            <h1 className="font-serif text-2xl text-ink-900 sm:text-4xl lg:text-5xl">
              Site Settings
            </h1>
            <p className="mt-3 max-w-lg text-sm text-ink-900/60">
              Manage global content, policies, and search engine optimization settings.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-2 text-[12px] uppercase tracking-widest text-cream-50 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Publish Tab
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid w-full max-w-md grid-cols-3 bg-white/50 backdrop-blur border border-ink-900/10 p-1">
            <TabsTrigger value="about" className="rounded-full text-xs uppercase tracking-wider data-[state=active]:bg-ink-900 data-[state=active]:text-white">About Us</TabsTrigger>
            <TabsTrigger value="seo" className="rounded-full text-xs uppercase tracking-wider data-[state=active]:bg-ink-900 data-[state=active]:text-white">SEO</TabsTrigger>
            <TabsTrigger value="policies" className="rounded-full text-xs uppercase tracking-wider data-[state=active]:bg-ink-900 data-[state=active]:text-white">Policies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="space-y-6 rounded-3xl border border-ink-900/10 bg-white p-6 sm:p-8">
            <div className="grid gap-6">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Headline</span>
                <input
                  value={aboutUs.headline}
                  onChange={(e) => patchAbout({ headline: e.target.value })}
                  className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Description</span>
                <textarea
                  value={aboutUs.description}
                  onChange={(e) => patchAbout({ description: e.target.value })}
                  className="min-h-[120px] w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                />
              </label>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Mission</span>
                  <textarea
                    value={aboutUs.mission}
                    onChange={(e) => patchAbout({ mission: e.target.value })}
                    className="min-h-[100px] w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Vision</span>
                  <textarea
                    value={aboutUs.vision}
                    onChange={(e) => patchAbout({ vision: e.target.value })}
                    className="min-h-[100px] w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                  />
                </label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 rounded-3xl border border-ink-900/10 bg-white p-6 sm:p-8">
             <div className="grid gap-6">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Meta Title</span>
                <input
                  value={seo.metaTitle}
                  onChange={(e) => patchSeo({ metaTitle: e.target.value })}
                  className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Meta Description</span>
                <textarea
                  value={seo.metaDescription}
                  onChange={(e) => patchSeo({ metaDescription: e.target.value })}
                  className="min-h-[100px] w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Robots txt</span>
                <input
                  value={seo.robots}
                  onChange={(e) => patchSeo({ robots: e.target.value })}
                  className="w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                />
              </label>
            </div>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6 rounded-3xl border border-ink-900/10 bg-white p-6 sm:p-8">
            <div className="grid gap-6">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Privacy Policy</span>
                <textarea
                  value={policies.privacyPolicy}
                  onChange={(e) => patchPolicies({ privacyPolicy: e.target.value })}
                  className="min-h-[200px] w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Terms of Service</span>
                <textarea
                  value={policies.termsOfService}
                  onChange={(e) => patchPolicies({ termsOfService: e.target.value })}
                  className="min-h-[200px] w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-widest text-ink-900/50">Refund Policy</span>
                <textarea
                  value={policies.refundPolicy}
                  onChange={(e) => patchPolicies({ refundPolicy: e.target.value })}
                  className="min-h-[200px] w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:border-ink-900/30 focus:outline-none"
                />
              </label>
            </div>
          </TabsContent>

        </Tabs>
      </Container>
    </div>
  );
}
