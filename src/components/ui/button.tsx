import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium outline-none cursor-pointer select-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out-soft)] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-ink-foreground hover:bg-ink/85 hover:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.5)]",
        lime: "bg-lime text-lime-foreground hover:bg-lime/85 hover:shadow-[0_8px_20px_-10px_rgba(160,200,30,0.7)]",
        secondary: "border border-line-strong bg-surface text-foreground hover:border-tint/30 hover:bg-tint/[0.04]",
        ghost: "text-muted hover:bg-tint/[0.06] hover:text-foreground",
        outline: "border border-line-strong bg-transparent text-foreground hover:border-ink hover:bg-ink hover:text-ink-foreground",
        glass: "border border-white/15 bg-white/[0.06] text-white hover:border-white hover:bg-white hover:text-[#10120a]",
        danger: "border border-danger/40 text-danger hover:bg-danger hover:text-white hover:border-danger",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        md: "h-10 px-5",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
