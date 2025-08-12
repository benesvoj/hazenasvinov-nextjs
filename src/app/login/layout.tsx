import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Portal - Přihlášení | TJ Sokol Svinov',
  description: 'Přihlaste se do administračního rozhraní TJ Sokol Svinov',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100">
      {children}
    </div>
  )
}
