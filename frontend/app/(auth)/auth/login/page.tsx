import type { Metadata } from "next"

import { LoginForm } from "@/components/LoginForm"

export const metadata: Metadata = { title: "Login" }

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center from-stone-100 via-amber-50/20 to-stone-200 p-6 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 md:p-10">
      <div className="grid w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-stone-900 md:max-w-3xl md:grid-cols-2">
        <div className="flex flex-col justify-center p-6 md:p-8">
          <LoginForm />
        </div>

        <div className="relative hidden border-l border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-800 md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000"
            alt="Cozy workspace"
            className="absolute inset-0 h-full w-full object-cover opacity-80 grayscale-[20%] contrast-[95%] dark:opacity-60"
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-stone-950/50 to-transparent p-8">
            <p className="text-lg font-medium italic text-white">
              &ldquo;AI intergrated code learning platform&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
