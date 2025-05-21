import {createClient} from "@/utils/supabase/server";
import {redirect} from "next/navigation";
import {logout} from "@/utils/supabase/actions";

const buttonStyle = 'rounded bg-sky-600 px-4 py-2 text-sm text-white data-active:bg-sky-700 data-hover:bg-sky-500'

export default async function Page() {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.getUser()
	if (error || !data?.user) {
		redirect('/login')
	}

	return (
		<div className="flex flex-col gap-2 border-2 items-center rounded-lg p-4 bg-white/5">
		<h1>Admin portal</h1>
			<p>Hello {data.user.email}</p>
			<button className={buttonStyle} onClick={logout}><span>Logout</span></button>
		</div>
	)
}