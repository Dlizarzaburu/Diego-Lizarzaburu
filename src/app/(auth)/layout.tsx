import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Logo className="mb-10" />
          {children}
          <p className="mt-10 text-center text-xs text-slate-500">
            <Link href="/" className="link-muted">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

      {/* Right: visual */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950/80 via-violetx/20 to-ink-950/90" />
        <div className="aurora" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <h2 className="max-w-md text-4xl font-black leading-tight text-white">
            One year. Every event.
            <br />
            <span className="gradient-text">Your ticket to it all.</span>
          </h2>
          <p className="mt-3 max-w-sm text-slate-300">
            Join thousands of Senior 2027 students and guests on the official
            events platform.
          </p>
        </div>
      </div>
    </div>
  );
}
