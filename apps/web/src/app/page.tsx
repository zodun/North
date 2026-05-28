import { redirect } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase-server";

export default async function Home() {
	const supabase = await getServerSupabase();
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (session) redirect("/admin");
	redirect("/login");
}
