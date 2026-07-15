"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-6xl font-black gradient-text">Oops</p>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Something went wrong
        </h1>
        <p className="mt-2 text-slate-400">
          An unexpected error occurred. Please try again.
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
