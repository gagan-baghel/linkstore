import Link from "next/link"

export function PublicFooter() {
  return (
    <footer className="mt-10 border-t border-white/60 bg-white/55 py-6 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/50">
      <div className="container flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} AffiliateHub. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
            Home
          </Link>
          <Link href="/auth/login" className="hover:text-slate-900 dark:hover:text-white">
            Login
          </Link>
          <Link href="/auth/register" className="hover:text-slate-900 dark:hover:text-white">
            Register
          </Link>
        </div>
      </div>
    </footer>
  )
}

