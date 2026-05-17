import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const badge = cva(
  "inline-flex items-center gap-1 font-semibold border rounded-full",
  {
    variants: {
      variant: {
        default:  "bg-brand-50 text-brand-700 border-brand-200",
        success:  "bg-green-50 text-green-700 border-green-200",
        warning:  "bg-amber-50 text-amber-700 border-amber-200",
        danger:   "bg-red-50 text-red-700 border-red-200",
        neutral:  "bg-gray-50 text-gray-600 border-gray-200",
        info:     "bg-blue-50 text-blue-700 border-blue-200",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badge({ variant, size }), className)} {...props}>
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-brand-500": variant === "default",
          "bg-green-500": variant === "success",
          "bg-amber-500": variant === "warning",
          "bg-red-500":   variant === "danger",
          "bg-gray-400":  variant === "neutral",
          "bg-blue-500":  variant === "info",
        })} />
      )}
      {children}
    </span>
  );
}
