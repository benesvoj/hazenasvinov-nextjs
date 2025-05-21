import {Button, Field, Input, Label} from "@headlessui/react";
import {clsx} from "clsx";
import {login} from "@/utils/supabase/actions";
import Link from "next/link";
import {publicRoutes} from "@/routes/routes";
import {translations} from "@/lib/translations";

const inputStyle = clsx('mt-3 block w-full rounded-lg border-2 bg-white/5 px-3 py-1.5 text-sm/6 focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25')
const buttonStyle = 'rounded bg-sky-600 px-4 py-2 text-sm text-white data-active:bg-sky-700 data-hover:bg-sky-500'
const labelStyle = 'text-sm/6 font-medium'

export default async function Page() {

	return (
		<div className="flex flex-col gap-2 border-2 items-center rounded-lg p-4 bg-white w-1/4">
			<form>
				<Field>
					<Label className={labelStyle} htmlFor="email">{translations.email}</Label>
					<Input className={inputStyle} id="email" name="email" type="email" required/>
				</Field>
				<Field>
					<Label className={labelStyle} htmlFor="password">{translations.password}</Label>
					<Input className={inputStyle} id="password" name="password" type="password" required/>
				</Field>
				<div className='flex gap-2 py-4'>
					<Button formAction={login} type='submit'
							className={buttonStyle}><span>{translations.login}</span></Button>

					{/*<Button formAction={signup} type='submit' className={buttonStyle}><span>{translations.signup}</span></Button>*/}
				</div>
			</form>
			<Link href={publicRoutes.home}>{translations.returnBackToHomepage}</Link>
		</div>
	)
}