import type { Metadata } from "next";
import { ProductSignIn } from "./form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0a] px-6">
			<div className="mb-10 text-center">
				<div className="mb-4 flex justify-center">
					<svg
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="white"
						strokeWidth={1.6}
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="9" />
						<path
							d="M15 9l-1.5 4.5L9 15l1.5-4.5L15 9z"
							fill="white"
							stroke="none"
						/>
					</svg>
				</div>
				<h1 className="font-semibold text-2xl text-white tracking-tight">
					Welcome to North
				</h1>
				<p className="mt-2 text-[14px] text-white/50">Find your direction.</p>
			</div>
			<ProductSignIn />
		</div>
	);
}
