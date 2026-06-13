import type { ReactNode } from "react";

export default function OnboardingLayout({
	children,
}: {
	children: ReactNode;
}) {
	return <div className="flex min-h-svh flex-col bg-[#EDF1F8]">{children}</div>;
}
