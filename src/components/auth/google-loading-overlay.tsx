import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function GoogleLoadingOverlay({
  isVisible,
  message = "Signing in...",
}: {
  isVisible: boolean;
  message?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300); // Wait for fade out
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? "opacity-100 backdrop-blur-md bg-ink-900/60" : "opacity-0 backdrop-blur-none bg-transparent"
      }`}
    >
      <div
        className={`relative flex flex-col items-center justify-center p-10 rounded-[2.5rem] bg-ink-900/80 shadow-2xl border border-white/10 overflow-hidden transition-all duration-500 transform ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Glow effect behind the spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-gold/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Outer rotating dashed ring */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border border-dashed border-gold/40 animate-[spin_4s_linear_infinite]" />
          
          {/* Inner pulsating ring */}
          <div className="absolute inset-2 rounded-full border border-cream-50/20 animate-ping opacity-20" />

          {/* Google colors logo or generic loader inside */}
          <div className="relative bg-ink-900 rounded-full p-4 shadow-inner border border-white/5">
            <svg
              className="size-8"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h3 className="relative font-serif text-2xl text-cream-50 font-medium tracking-wide mb-2 animate-pulse">
          {message}
        </h3>
        <p className="relative text-sm text-cream-50/50 flex items-center gap-2">
          <Loader2 className="size-3 animate-spin" />
          Securing your session
        </p>
      </div>
    </div>
  );
}
