import { type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

// ─── Button ───────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  fullWidth,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed select-none";

  const variants: Record<BtnVariant, string> = {
    primary:   "text-white shadow-sm",
    secondary: "bg-[var(--p-soft)] text-[var(--p)]",
    ghost:     "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--border)]",
    danger:    "bg-[var(--error-soft)] text-[var(--error)]",
  };

  const sizes: Record<BtnSize, string> = {
    sm: "h-9  px-4 text-sm  rounded-[var(--r-sm)]",
    md: "h-12 px-5 text-sm  rounded-[var(--r-md)]",
    lg: "h-14 px-6 text-base rounded-[var(--r-lg)]",
  };

  const primaryStyle = variant === "primary"
    ? { background: "var(--p)" } : {};

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={primaryStyle}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? <Spinner size={size === "sm" ? 14 : 18} /> : children}
    </button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      className="animate-spin"
      style={{ color: color || "currentColor" }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
    </svg>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}>
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          {...props}
          className={`
            w-full h-12 border rounded-[var(--r-md)] text-sm transition-all
            bg-[var(--bg-card)] text-[var(--text)]
            border-[var(--border)] focus:border-[var(--p)] focus:ring-2 focus:ring-[var(--p-soft)]
            ${prefix ? "pr-10" : "pr-4"}
            ${suffix ? "pl-10" : "pl-4"}
            ${error ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error-soft)]" : ""}
            ${className}
          `}
        />
        {suffix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        {...props}
        className={`
          w-full px-4 py-3 border rounded-[var(--r-md)] text-sm transition-all resize-none
          bg-[var(--bg-card)] text-[var(--text)]
          border-[var(--border)] focus:border-[var(--p)] focus:ring-2 focus:ring-[var(--p-soft)]
          ${error ? "border-[var(--error)]" : ""}
          ${className}
        `}
      />
      {error && <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = "primary" | "success" | "warning" | "error" | "neutral";

export function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, string> = {
    primary: "bg-[var(--p-soft)] text-[var(--p)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    error:   "bg-[var(--error-soft)] text-[var(--error)]",
    neutral: "bg-[var(--border)] text-[var(--text-secondary)]",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[var(--r-xs)] ${styles[variant]}`}>
      {children}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full font-bold overflow-hidden"
      style={{
        width: size, height: size,
        background: src ? "transparent" : "var(--p-soft)",
        color: "var(--p)",
        fontSize: size * 0.38,
      }}
    >
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      {label && <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>}
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className = "", onClick, padding = true }:
  { children: React.ReactNode; className?: string; onClick?: () => void; padding?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-[var(--r-xl)] border transition-all duration-150
        bg-[var(--bg-card)] border-[var(--border)]
        ${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.99]" : ""}
        ${padding ? "p-4" : ""}
        ${className}
      `}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {children}
    </div>
  );
}

// ─── Sheet (Bottom drawer) ────────────────────────────────────────────────────

export function Sheet({ open, onClose, children, title }: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.2s ease" }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[var(--r-xl)] overflow-hidden"
        style={{
          background: "var(--bg-card)",
          animation: "sheetUp 0.3s cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "92dvh",
        }}
      >
        <style>{`@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border-strong)" }} />
        </div>
        {title && (
          <div className="px-5 pb-3 pt-1 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>{title}</h3>
          </div>
        )}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(92dvh - 60px)" }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function Toast({ message, type = "success", visible }: {
  message: string;
  type?: "success" | "error" | "info";
  visible: boolean;
}) {
  const colors = {
    success: { bg: "var(--success)", icon: "✓" },
    error:   { bg: "var(--error)",   icon: "✕" },
    info:    { bg: "var(--info)",     icon: "ℹ" },
  };
  const c = colors[type];

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-[var(--r-lg)] text-white text-sm font-semibold shadow-lg transition-all duration-300"
      style={{
        background: c.bg,
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : -8}px)`,
        pointerEvents: "none",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">{c.icon}</span>
      {message}
    </div>
  );
}
