"use client";

import { useState } from "react";

/** Circular board avatar. Shows the photo if it loads, otherwise an elegant
 * gradient monogram — so names look right before photos are uploaded. */
export function BoardAvatar({
  name,
  photo,
  initials,
}: {
  name: string;
  photo: string;
  initials: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-full bg-accent-gradient opacity-60 blur-md transition group-hover:opacity-100" />
      <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-white/20 sm:h-32 sm:w-32">
        {!failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ink-700 to-ink-800 text-2xl font-black text-white">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}
