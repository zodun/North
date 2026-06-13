import type { Metadata } from "next";
import { SignInBackground } from "./background";
import { ProductSignIn } from "./form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
	return (
		<div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[#EDF1F8] px-4 py-8">
			<SignInBackground />

			{/* Card */}
			<div
				className="relative z-10 w-full max-w-[360px] animate-card-spring rounded-[24px] border border-[rgba(14,20,32,0.10)] backdrop-blur-[48px]"
				style={{
					background: "rgba(255,255,255,0.92)",
					padding: "22px 26px 20px",
				}}
			>
				{/* Top accent gradient line */}
				<div
					aria-hidden="true"
					className="absolute top-0 right-[10%] left-[10%] h-px"
					style={{
						background:
							"linear-gradient(90deg, transparent, rgba(245,200,66,0.7), rgba(62,207,191,0.5), transparent)",
					}}
				/>

				<ProductSignIn />
			</div>
		</div>
	);
}
