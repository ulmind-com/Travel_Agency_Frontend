import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { authService } from "@/services/auth.service";

const SearchSchema = z.object({ redirect: z.string().optional() });

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type LoginValues = z.infer<typeof LoginSchema>;

export const Route = createFileRoute("/auth/login")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in · Ulmind Travel" },
      { name: "description", content: "Access your Ulmind private account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await authService.login(values.email, values.password);
      await refresh();
      toast.success("Welcome back");
      navigate({ to: redirect ?? "/account" });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Invalid credentials"));
    }
  };

  return (
    <AuthShell subtitle="Private members" title="Welcome back">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="off"
            placeholder="you@domain.com"
            {...register("email")}
            className={inputClass}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Your password"
            {...register("password")}
            className={inputClass}
          />
        </Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-cream-50 py-4 text-[12px] font-medium uppercase tracking-widest text-ink-900 transition-all duration-300 hover:bg-cream-100 hover:shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-cream-50/60">
          New here?{" "}
          <Link to="/auth/register" className="text-cream-50 underline underline-offset-4 transition-colors hover:text-gold">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-cream-50/15 bg-cream-50/[0.05] px-4 py-3.5 text-sm text-cream-50 placeholder:text-cream-50/35 focus:border-cream-50/30 focus:bg-cream-50/[0.08] focus:outline-none backdrop-blur-sm transition-colors";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-cream-50/50">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}
