import { cn } from "@/lib/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
}

export function Card({ className, padding = "md", hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-100 rounded-2xl shadow-card",
        padding === "sm"   && "p-4",
        padding === "md"   && "p-5",
        padding === "lg"   && "p-6",
        hover && "transition-shadow hover:shadow-card-md cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-bold text-gray-900 text-base", className)} {...props}>
      {children}
    </h3>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-xl", className)}
      {...props}
    />
  );
}
