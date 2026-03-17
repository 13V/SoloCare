import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#1E3A5F] text-white",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-[#DC2626] text-white",
        outline: "text-foreground",
        success: "border-transparent bg-[#16A34A] text-white",
        warning: "border-transparent bg-[#D97706] text-white",
        expired: "border-transparent bg-[#DC2626] text-white",
        valid: "border-transparent bg-[#16A34A] text-white",
        expiring: "border-transparent bg-[#D97706] text-white",
        missing: "border-transparent bg-slate-400 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
