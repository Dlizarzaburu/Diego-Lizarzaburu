import { Reveal } from "@/components/Reveal";

// ─────────────────────────────────────────────────────────────────────────────
// Senior 2027 executive board.
// Order matches the request. Drop a photo URL into `photo` for each member when
// you have the images (put files in /public and use e.g. "/board/andrea.jpg").
// Until then, an elegant gradient monogram is shown.
//
// NOTE: The 4th/5th names were interpreted from "Mariana Lucia Lizarzaburu" as
// two people. Adjust the names/order here freely.
// ─────────────────────────────────────────────────────────────────────────────
type Member = { name: string; role?: string; photo?: string };

const BOARD: Member[] = [
  { name: "Andrea Jaen", photo: undefined },
  { name: "Angelina Calvo", photo: undefined },
  { name: "Diego Lizarzaburu", photo: undefined },
  { name: "Mariana Lizarzaburu", photo: undefined },
  { name: "Lucia Lizarzaburu", photo: undefined },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ExecBoard() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-grid-glow opacity-40" />
      <div className="container-x relative">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-ember-warm">
              🎃 The team behind the year
            </p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              Senior 2027 Executive Board
            </h2>
            <p className="mt-3 text-slate-400">
              The five students making every S27 event happen.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-8 sm:gap-10">
          {BOARD.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.08}>
              <figure className="group flex w-32 flex-col items-center text-center sm:w-36">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-accent-gradient opacity-60 blur-md transition group-hover:opacity-100" />
                  <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-white/20 sm:h-32 sm:w-32">
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photo}
                        alt={m.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ink-700 to-ink-800 text-2xl font-black text-white">
                        {initials(m.name)}
                      </div>
                    )}
                  </div>
                </div>
                <figcaption className="mt-4 text-sm font-bold text-white">
                  {m.name}
                </figcaption>
                {m.role && (
                  <span className="text-xs text-violetx-bright">{m.role}</span>
                )}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
