import Link from "next/link";
import type { ReactNode } from "react";
import { formCardClass } from "@/components/ui/form-classes";

type AuthPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPageShell({ title, description, children, footer }: AuthPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/map"
          className="mb-6 inline-flex text-sm font-medium text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          ← Back to map
        </Link>
        <div className={formCardClass}>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          ) : null}
          <div className="mt-5">{children}</div>
          {footer ? <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">{footer}</div> : null}
        </div>
        <p className="mt-4 text-center text-[10px] text-zinc-500 dark:text-zinc-500">
          Secured with Supabase
        </p>
      </div>
    </div>
  );
}
