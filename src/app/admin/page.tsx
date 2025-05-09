import {redirect} from "next/navigation"
import {signIn, auth, providerMap} from "@/auth"
import {AuthError} from "next-auth"
import {Button, Description, Field, Input, Label} from "@headlessui/react";
import {clsx} from "clsx";

const SIGNIN_ERROR_URL = "/error"

export default async function Page(props: {
	searchParams: Promise<{ callbackUrl: string | undefined }>
}) {
	const resolvedSearchParams = await props.searchParams;

	return (
		<div className="flex flex-col gap-2">
			<form
				action={async (formData) => {
					"use server"
					try {
						await signIn("credentials", formData)
					} catch (error) {
						if (error instanceof AuthError) {
							return redirect(`${SIGNIN_ERROR_URL}?error=${error}`)
						}
						throw error
					}
				}}
			>
				<Field>
					<Label htmlFor="email" className="text-sm/6 font-medium">Email</Label>
					<Description className="text-sm/6 text-black/50">Use your real name so people will recognize
						you.</Description>
					<Input name="email" id="email" className={clsx(
						'mt-3 block w-full rounded-lg border-2 bg-white/5 px-3 py-1.5 text-sm/6',
						'focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25'
					)}
					/>
				</Field>
				<Field>
					<Label htmlFor="password" className="text-sm/6 font-medium">Password</Label>
					<Description className="text-sm/6 text-black/50">Use your real name so people will recognize
						you.</Description>
					<Input name="password" id="password" className={clsx(
						'mt-3 block w-full rounded-lg border-2 bg-white/5 px-3 py-1.5 text-sm/6',
						'focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25'
					)}/>
				</Field>
				<Button type='submit'
						className="rounded bg-sky-600 px-4 py-2 text-sm text-white data-active:bg-sky-700 data-hover:bg-sky-500">
					<span>Sign in</span>
				</Button>
			</form>
			{Object.values(providerMap).map((provider) => (
				<form
					key={provider.id}
					action={async () => {
						"use server"
						try {
							await signIn(provider.id, {
								redirectTo: resolvedSearchParams?.callbackUrl ?? "",
							})
						} catch (error) {
							// Signin can fail for a number of reasons, such as the user
							// not existing, or the user not having the correct role.
							// In some cases, you may want to redirect to a custom error
							if (error instanceof AuthError) {
								return redirect(`${SIGNIN_ERROR_URL}?error=${error}`)
							}

							// Otherwise if a redirects happens Next.js can handle it
							// so you can just re-thrown the error and let Next.js handle it.
							// Docs:
							// https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
							throw error
						}
					}}
				>

					<Button type='submit'
							className="rounded bg-sky-600 px-4 py-2 text-sm text-white data-active:bg-sky-700 data-hover:bg-sky-500">
						<span>Sign in with {provider.name}</span>
					</Button>
				</form>
			))}
		</div>
	)
}