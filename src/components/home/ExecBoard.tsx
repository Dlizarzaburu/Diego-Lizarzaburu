import { Reveal } from "@/components/Reveal";
import { BoardAvatar } from "@/components/home/BoardAvatar";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Senior 2027 executive board. Members and their photo URLs are managed from
// the admin portal (/admin/board). Photo URLs may point anywhere (e.g. a
// hosted image link); if a photo is missing, an elegant gradient monogram is
// shown automatically. The defaults below are used only if no members exist.
// ─────────────────────────────────────────────────────────────────────────────
type Member = { name: string; role?: string; photo: string };

const DEFAULT_BOARD: Member[] = [
  { name: "Andrea Jaen", photo: "/board/andrea.jpg" },
  { name: "Angelina Calvo", photo: "/board/angelina.jpg" },
  { name: "Diego Lizarzaburu", photo: "/board/diego.jpg" },
  { name: "Mariana Diaz", photo: "/board/mariana.jpg" },
  { name: "Lucia Lizarzaburu", photo: "/board/lucia.jpg" },
];

async function loadBoard(): Promise<Member[]> {
  try {
    const rows = await prisma.boardMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (rows.length === 0) return DEFAULT_BOARD;
    return rows.map((r) => ({ name: r.name, photo: r.photoUrl ?? "" }));
  } catch {
    return DEFAULT_BOARD;
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function ExecBoard() {
  const BOARD = await loadBoard();
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
                <BoardAvatar
                  name={m.name}
                  photo={m.photo}
                  initials={initials(m.name)}
                />
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
