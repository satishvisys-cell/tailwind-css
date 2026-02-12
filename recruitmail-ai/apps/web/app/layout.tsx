import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'RecruitMail AI',
  description: 'Extract jobs from recruiter emails',
};

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/extracted', label: 'Extracted Jobs' },
  { href: '/posted', label: 'Posted Jobs' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen grid grid-cols-[240px_1fr]">
          <aside className="bg-slate-900 text-white p-6 space-y-3">
            <h1 className="font-semibold text-xl">RecruitMail AI</h1>
            <nav className="space-y-2">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded px-3 py-2 hover:bg-slate-700">
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
