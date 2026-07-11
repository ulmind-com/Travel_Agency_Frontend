import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, ArrowUpRight, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import axios from "axios";

import { cn } from "@/lib/utils";

export type StateTone = "neutral" | "gold" | "error";

type ActionButton = {
  label: string;
  onClick: () => void;
  loading?: boolean;
};

type ActionLink = {
  label: string;
  to: string;
};

export function StateCard({
  icon: Icon = Sparkles,
  eyebrow,
  title,
  description,
  tone = "neutral",
  primary,
  secondary,
  children,
}: {
  icon?: ComponentType<{ className?: string }>;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  tone?: StateTone;
  primary?: ActionButton | ActionLink;
  secondary?: ActionButton | ActionLink;
  children?: ReactNode;
}) {
  const toneRing =
    tone === "error"
      ? "from-rose-200/60 via-rose-100/0 to-transparent"
      : tone === "gold"
        ? "from-[color:var(--gold)]/25 via-[color:var(--gold)]/0 to-transparent"
        : "from-ink-900/10 via-ink-900/0 to-transparent";

  const iconWrap =
    tone === "error"
      ? "bg-gradient-to-br from-rose-50 to-white text-rose-500 ring-rose-200/60"
      : tone === "gold"
        ? "bg-gradient-to-br from-[color:var(--gold)]/15 to-white text-[color:var(--gold)] ring-[color:var(--gold)]/25"
        : "bg-gradient-to-br from-ink-900/[0.05] to-white text-ink-900/60 ring-ink-900/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-ink-900/8 bg-white/70 p-10 text-center backdrop-blur-xl sm:p-14"
    >
      {/* premium ambient glow */}
      <div className={cn("pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-br opacity-70", toneRing)} />
      <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-[color:var(--gold)]/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-ink-900/[0.04] blur-3xl" />
      {/* subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(rgba(28,25,23,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative grid size-20 place-items-center rounded-3xl shadow-[0_20px_50px_-24px_rgba(28,25,23,0.4)] ring-1",
            iconWrap,
          )}
        >
          <Icon className="size-8" />
          <span className="absolute -inset-2 -z-10 rounded-[28px] bg-gradient-to-br from-white/60 to-transparent blur-md" />
        </motion.div>

        {eyebrow && (
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-ink-900/8 bg-white/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-ink-900/55 backdrop-blur">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-5 font-serif text-3xl leading-tight text-ink-900 sm:text-[34px]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-900/55">
            {description}
          </p>
        )}
        {children && <div className="mt-6 w-full">{children}</div>}

        {(primary || secondary) && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {primary && renderAction(primary, "primary", tone)}
            {secondary && renderAction(secondary, "secondary", tone)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function renderAction(
  action: ActionButton | ActionLink,
  kind: "primary" | "secondary",
  tone: StateTone,
) {
  const base =
    "group inline-flex items-center gap-2 rounded-full px-6 py-3 text-[11px] font-medium uppercase tracking-[0.22em] transition-all active:scale-[0.98]";
  const primaryStyle =
    tone === "error"
      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_16px_40px_-16px_rgba(244,63,94,0.55)] hover:shadow-[0_20px_50px_-16px_rgba(244,63,94,0.7)]"
      : "bg-gradient-to-r from-ink-900 to-ink-800 text-cream-50 shadow-[0_16px_40px_-16px_rgba(28,25,23,0.55)] hover:shadow-[0_20px_50px_-16px_rgba(28,25,23,0.7)]";
  const secondaryStyle =
    "border border-ink-900/10 bg-white/80 text-ink-900/70 backdrop-blur hover:border-ink-900/25 hover:text-ink-900";
  const cls = cn(base, kind === "primary" ? primaryStyle : secondaryStyle);

  if ("to" in action) {
    return (
      <Link key={action.label} to={action.to} className={cls}>
        {action.label}
        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    );
  }
  return (
    <button
      key={action.label}
      type="button"
      onClick={action.onClick}
      disabled={action.loading}
      className={cn(cls, "disabled:opacity-60")}
    >
      {action.loading ? (
        <>
          <RefreshCw className="size-3.5 animate-spin" />
          Retrying…
        </>
      ) : (
        <>
          {action.label}
          <RefreshCw className="size-3.5 transition-transform group-hover:rotate-180" />
        </>
      )}
    </button>
  );
}

/** Returns the HTTP status of a rejected axios request, if any. */
export function httpStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}

/** Convenience: adminOnly state for endpoints the API restricts to customers. */
export function AdminScopeCard({
  section,
}: {
  section: string;
}) {
  return (
    <StateCard
      icon={ShieldCheck}
      tone="gold"
      eyebrow="Administrator account"
      title={`${section} isn’t available for admin accounts.`}
      description={
        <>
          This area is reserved for traveler profiles. Head to the Content
          Studio to curate the storefront your travelers see.
        </>
      }
      primary={{ label: "Open Content Studio", to: "/account/admin/hero" }}
      secondary={{ label: "Back to overview", to: "/account" }}
    />
  );
}

/** Convenience: generic connection error. */
export function ErrorStateCard({
  section,
  onRetry,
  retrying,
}: {
  section: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <StateCard
      icon={AlertTriangle}
      tone="error"
      eyebrow="Connection hiccup"
      title={`We couldn’t reach ${section}.`}
      description="The server took too long to respond. Give it another try — it usually comes back in a moment."
      primary={{ label: "Try again", onClick: onRetry, loading: retrying }}
      secondary={{ label: "Back to overview", to: "/account" }}
    />
  );
}