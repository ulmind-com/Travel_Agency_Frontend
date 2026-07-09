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
    <AuthShell subtitle="Members entry" title="Sign in to Ulmind">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@domain.com"
            {...register("email")}
            className={inputClass}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            {...register("password")}
            className={inputClass}
          />
        </Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-ink-900 py-4 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-ink-900/60">
          New here?{" "}
          <Link to="/auth/register" className="text-ink-900 underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-900/40 focus:border-ink-900/40 focus:outline-none";

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
      <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-ink-900/50">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}