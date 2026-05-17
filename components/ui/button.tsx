"use client";
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:   "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-brand-glow",
        secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-card",
        ghost:     "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        danger:    "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        success:   "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
        outline:   "border-2 border-brand-600 text-brand-600 hover:bg-brand-50",
      },
      size: {
        sm:   "h-8  px-3  text-sm  rounded-lg",
        md:   "h-10 px-4  text-sm  rounded-xl",
        lg:   "h-12 px-6  text-base rounded-xl",
        xl:   "h-14 px-8  text-base rounded-2xl",
        icon: "h-9  w-9   rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
