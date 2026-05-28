"use client";

import { Button } from "@north/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@north/ui/components/dropdown-menu";
import { Skeleton } from "@north/ui/components/skeleton";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/auth-client";

export default function UserMenu() {
	const router = useRouter();
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setLoading(false);
		});
		const { data } = supabase.auth.onAuthStateChange((_event, next) => {
			setSession(next);
		});
		return () => {
			data.subscription.unsubscribe();
		};
	}, []);

	if (loading) return <Skeleton className="h-9 w-24" />;

	if (!session) {
		return (
			<Link href="/login">
				<Button variant="outline">Sign in</Button>
			</Link>
		);
	}

	const email = session.user.email ?? "Admin";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" />}>
				{email}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Admin</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>{email}</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={async () => {
							await supabase.auth.signOut();
							router.push("/login");
						}}
					>
						Sign out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
