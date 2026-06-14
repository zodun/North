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
			"flex h-11 w-full rounded-[12px] border border-[rgba(14,20,32,0.08)] bg-[rgba(14,20,32,0.03)] px-[14px] py-[11px] font-jakarta text-[#0E1420] text-[13px] outline-none transition-colors placeholder:text-[rgba(14,20,32,0.55)] focus:border-[#3ECFBF] disabled:opacity-50 motion-reduce:transition-none",
			className,
		)}
		{...props}
	/>
));
Input.displayName = "Input";

export { Input };
