import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthShell } from "@/components/auth/auth-shell";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { authService } from "@/services/auth.service";
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
          className="w-full rounded-full bg-ink-900 py-4 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-ink-900/60">
          Already a member?{" "}
          <Link to="/auth/login" className="text-ink-900 underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}