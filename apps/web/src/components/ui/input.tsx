import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
	HTMLInputElement,
	React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
	<input
		ref={ref}
		type={type}
		className={cn(
			"flex h-11 w-full rounded-[12px] border border-[rgba(26,18,8,0.08)] bg-[rgba(26,18,8,0.03)] px-[14px] py-[11px] font-jakarta text-[#1A1208] text-[13px] outline-none transition-colors placeholder:text-[rgba(26,18,8,0.4)] focus:border-[#C47D00] disabled:opacity-50 motion-reduce:transition-none",
			className,
		)}
		{...props}
	/>
));
Input.displayName = "Input";

export { Input };
