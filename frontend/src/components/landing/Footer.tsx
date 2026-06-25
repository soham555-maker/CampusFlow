import Link from "next/link";
import { Wordmark } from "./primitives";

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "Features", href: "#features" },
      { label: "Roles", href: "#roles" },
      { label: "Under the hood", href: "#under-the-hood" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8">
      <div className="glass-soft rounded-3xl px-7 py-10 sm:px-10">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-[14px] leading-relaxed text-white/55">
              One platform for timetables, rooms, and people — that refuses to
              double-book.
            </p>
          </div>

          <div className="flex gap-14 sm:gap-20">
            {COLS.map((col) => (
              <div key={col.heading}>
                <h4 className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  {col.heading}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="cursor-pointer text-[14px] text-white/65 transition-colors duration-200 hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-white/50">
            © {new Date().getFullYear()} CampusFlow
          </p>
          <p className="text-[13px] text-white/50">
            Designed &amp; built by{" "}
            <span className="text-white/70">Soham</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
