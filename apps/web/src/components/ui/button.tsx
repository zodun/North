"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

// North-tuned shadcn-style button. Primary = Signal Gold.
const buttonVariants = cva(
	"inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-bold font-jakarta text-[13px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(62,207,191,0.55)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
	{
		variants: {
			variant: {
				default: "bg-[#F5C842] text-[#05050E] hover:bg-[#E8B84B]",
				outline:
					"border border-[rgba(14,20,32,0.12)] bg-transparent text-[#0E1420] hover:bg-[rgba(14,20,32,0.04)]",
				ghost: "text-[#0E1420] hover:bg-[rgba(14,20,32,0.04)]",
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
