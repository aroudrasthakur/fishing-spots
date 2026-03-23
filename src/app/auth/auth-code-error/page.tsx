import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--page-bg)] px-4">
      <div className="max-w-md rounded-2xl border border-red-200/80 bg-white/95 p-8 text-center shadow-lg dark:border-red-900/50 dark:bg-zinc-900/95">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Could not sign you in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The confirmation link may have expired or was already used. Try signing in again, or
          request a new confirmation email from Supabase.
        </p>
        <Link
          href="/map"
          className="mt-6 inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Back to map
        </Link>
      </div>
    </div>
  );
}
