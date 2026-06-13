"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

// North-tuned shadcn-style button. Primary = Signal Gold.
const buttonVariants = cva(
	"inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-bold font-jakarta text-[13px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(196,125,0,0.4)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
	{
		variants: {
			variant: {
				default:
					"bg-[#C47D00] text-white shadow-[0_3px_12px_rgba(196,125,0,0.3)] hover:bg-[#A36200]",
				outline:
					"border border-[rgba(26,18,8,0.12)] bg-transparent text-[#1A1208] hover:bg-[rgba(245,240,232,0.8)]",
				ghost: "text-[#1A1208] hover:bg-[rgba(245,240,232,0.8)]",
			},
			size: {
				default: "h-11 px-4 py-2",
				sm: "h-9 px-3 text-[12px]",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				ref={ref}
				className={cn(buttonVariants({ variant, size }), className)}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
