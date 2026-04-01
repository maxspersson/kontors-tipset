import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Kontors-tipset",
  description: "VM-tipset för kontoret",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="bg-neutral-950 text-neutral-100">
        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
    
    {/* LEFT: LOGO */}
    <Link
      href="/"
      className="text-sm font-semibold tracking-[0.25em] text-neutral-400 hover:text-white transition"
    >
      KONTORS-TIPSET
    </Link>

    {/* CENTER: NAV */}
    <nav className="hidden items-center gap-8 text-sm md:flex">
      <Link
        href="/tippa"
        className="text-neutral-400 hover:text-white transition"
      >
        Tippa
      </Link>

      <Link
        href="/tabell"
        className="text-neutral-400 hover:text-white transition"
      >
        Tabell
      </Link>

      <Link
        href="/liga"
        className="text-neutral-400 hover:text-white transition"
      >
        Liga
      </Link>

      <Link
        href="/regler"
        className="text-neutral-400 hover:text-white transition"
      >
        Regler
      </Link>
    </nav>

    {/* RIGHT: USER / STATUS (placeholder) */}
    <div className="flex items-center gap-3">
      <div className="hidden rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-400 sm:block">
        VM 2026
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-neutral-200">
        MP
      </div>
    </div>
  </div>
</header>

        {/* PAGE CONTENT */}
        <main>{children}</main>
      </body>
    </html>
  );
}