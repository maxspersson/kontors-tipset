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
        <header className="border-b border-neutral-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-widest text-neutral-400">
              KONTORS-TIPSET
            </Link>

            <nav className="flex items-center gap-6 text-sm">
              <Link href="/tippa" className="hover:text-white text-neutral-400">
                Tippa
              </Link>
              <Link href="/tabell" className="hover:text-white text-neutral-400">
                Tabell
              </Link>
              <Link href="/liga" className="hover:text-white text-neutral-400">
                Liga
              </Link>
              <Link href="/regler" className="hover:text-white text-neutral-400">
                Regler
              </Link>
            </nav>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main>{children}</main>
      </body>
    </html>
  );
}