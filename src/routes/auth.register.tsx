import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { authService } from "@/services/auth.service";
import { GoogleLoadingOverlay } from "@/components/auth/google-loading-overlay";
import { Field, inputClass } from "./auth.login";

const Schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  phone_number: z.string().optional(),
});
type Values = z.infer<typeof Schema>;

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Create account · Ulmind Travel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", email: "", password: "", phone_number: "" },
  });

  const onSubmit = async (values: Values) => {
    try {
      await authService.register(values);
      await authService.login(values.email, values.password);
      await refresh();
      toast.success("Welcome to Ulmind");
      navigate({ to: "/account" });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not create account"));
    }
  };

  return (
    <AuthShell subtitle="Become a member" title="Create your account">
      <div className="mb-6 flex flex-col gap-4">
        <button
          type="button"
          disabled={isGoogleLoading}
          onClick={async () => {
            try {
              await authService.loginWithGoogle(() => setIsGoogleLoading(true));
              await refresh();
              toast.success("Welcome to Ulmind");
              navigate({ to: "/account" });
            } catch (err) {
              toast.error(apiErrorMessage(err, "Google sign-up failed"));
              setIsGoogleLoading(false);
            }
          }}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-cream-50/20 bg-cream-50/[0.03] py-3.5 text-sm font-medium text-cream-50 transition-colors hover:bg-cream-50/10 disabled:opacity-50"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-cream-50/10"></div>
          <span className="text-[10px] uppercase tracking-widest text-cream-50/40">or with email</span>
          <div className="h-px flex-1 bg-cream-50/10"></div>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Full name" error={errors.name?.message}>
          <input {...register("name")} className={inputClass} placeholder="Your name" />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className={inputClass} placeholder="you@domain.com" />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input type="password" {...register("password")} className={inputClass} placeholder="At least 6 characters" />
        </Field>
        <Field label="Phone (optional)" error={errors.phone_number?.message}>
          <input {...register("phone_number")} className={inputClass} placeholder="+91 ..." />
        </Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-cream-50 py-4 text-[12px] font-medium uppercase tracking-widest text-ink-900 transition-all duration-300 hover:bg-cream-100 hover:shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-cream-50/60">
          Already a member?{" "}
          <Link to="/auth/login" className="text-cream-50 underline underline-offset-4 transition-colors hover:text-gold">
            Sign in
          </Link>
        </p>
      </form>
      <GoogleLoadingOverlay isVisible={isGoogleLoading} />
    </AuthShell>
  );
}