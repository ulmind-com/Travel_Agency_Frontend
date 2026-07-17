import { useState } from "react";
import { X, Loader2, ShieldCheck, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { authService } from "@/services/auth.service";
import { apiErrorMessage } from "@/lib/api";

type TwoFaMethod = "TOTP" | "EMAIL_OTP" | "RECOVERY_CODE";

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "2fa">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // 2FA challenge state
  const [preAuthToken, setPreAuthToken] = useState("");
  const [methods, setMethods] = useState<TwoFaMethod[]>([]);
  const [method, setMethod] = useState<TwoFaMethod>("TOTP");
  const [code, setCode] = useState("");
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);

  if (!isOpen) return null;

  const finish = async () => {
    await refresh();
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await authService.login(email, password);
        if (res.requires_2fa && res.pre_auth_token) {
          const available = (res.methods ?? ["TOTP"]) as TwoFaMethod[];
          setPreAuthToken(res.pre_auth_token);
          setMethods(available);
          setMethod(available[0]);
          setCode("");
          setMode("2fa");
          if (available[0] === "EMAIL_OTP") {
            const sent = await authService.request2faEmailOtp(res.pre_auth_token);
            setOtpSentTo(sent.to);
          }
          return;
        }
        toast.success("Successfully logged in");
        await finish();
      } else if (mode === "register") {
        await authService.register({ name, email, password });
        await authService.login(email, password);
        toast.success("Account created successfully");
        await finish();
      } else {
        await authService.verify2fa(preAuthToken, code, method);
        toast.success("Identity verified — welcome back");
        await finish();
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Authentication failed"));
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = async (m: TwoFaMethod) => {
    setMethod(m);
    setCode("");
    if (m === "EMAIL_OTP" && !otpSentTo) {
      try {
        const sent = await authService.request2faEmailOtp(preAuthToken);
        setOtpSentTo(sent.to);
        toast.info(`Code sent to ${sent.to}`);
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not send the code"));
      }
    }
  };

  const inputClass = "w-full rounded-2xl border border-ink-900/10 bg-cream-50/50 px-4 py-3.5 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-ink-900/30 focus:shadow-[0_0_0_3px_rgba(28,25,23,0.05)] focus:outline-none transition-shadow";

  const METHOD_META: Record<TwoFaMethod, { label: string; icon: typeof ShieldCheck; hint: string }> = {
    TOTP: { label: "Authenticator", icon: ShieldCheck, hint: "Enter the 6-digit code from your authenticator app." },
    EMAIL_OTP: { label: "Email code", icon: Mail, hint: otpSentTo ? `We sent a code to ${otpSentTo}.` : "We'll email you a one-time code." },
    RECOVERY_CODE: { label: "Recovery code", icon: KeyRound, hint: "Use one of your saved recovery codes." },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/20 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-ink-900/40 hover:text-ink-900 hover:bg-ink-900/5 rounded-full transition-colors"
        >
          <X className="size-5" />
        </button>

        <h2 className="font-serif text-2xl text-ink-900 mb-1">
          {mode === "login" ? "Welcome back" : mode === "register" ? "Create an account" : "Verify it's you"}
        </h2>
        <p className="text-sm text-ink-900/60 mb-6">
          {mode === "login"
            ? "Sign in to continue your booking"
            : mode === "register"
              ? "Sign up to track your bookings and payments"
              : METHOD_META[method].hint}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <input type="text" placeholder="Full Name" required value={name}
              onChange={(e) => setName(e.target.value)} className={inputClass} />
          )}
          {mode !== "2fa" && (
            <>
              <input type="email" placeholder="Email address" required value={email}
                onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              <input type="password" placeholder="Password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </>
          )}

          {mode === "2fa" && (
            <>
              {methods.length > 1 && (
                <div className="flex gap-1.5">
                  {methods.map((m) => {
                    const Meta = METHOD_META[m];
                    return (
                      <button key={m} type="button" onClick={() => switchMethod(m)}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium transition-colors ${
                          method === m ? "bg-ink-900 text-cream-50" : "border border-ink-900/10 text-ink-900/60 hover:text-ink-900"}`}>
                        <Meta.icon className="size-3.5" /> {Meta.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <input
                type="text" inputMode={method === "RECOVERY_CODE" ? "text" : "numeric"}
                autoFocus required value={code}
                placeholder={method === "RECOVERY_CODE" ? "XXXX-XXXX-XXXX" : "6-digit code"}
                onChange={(e) => setCode(e.target.value)}
                className={`${inputClass} text-center text-lg tracking-[0.35em]`}
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "2fa" && code.trim().length < 4)}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-ink-900 px-8 py-3.5 text-[12px] font-medium uppercase tracking-widest text-cream-50 hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "login" ? "Sign In" : mode === "register" ? "Sign Up" : "Verify"}
          </button>
        </form>

        <div className="mt-6 text-center">
          {mode === "2fa" ? (
            <button type="button" onClick={() => { setMode("login"); setCode(""); setOtpSentTo(null); }}
              className="text-xs uppercase tracking-widest font-medium text-ink-900/50 hover:text-gold transition-colors">
              Back to sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-xs uppercase tracking-widest font-medium text-ink-900/50 hover:text-gold transition-colors"
            >
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
