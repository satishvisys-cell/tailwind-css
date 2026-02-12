import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function createSmtpAccount(formData: FormData) {
  'use server';

  const email = String(formData.get('email') || '').trim();
  const smtpHost = String(formData.get('smtpHost') || '').trim();
  const smtpPort = Number(formData.get('smtpPort') || 993);
  const smtpUser = String(formData.get('smtpUser') || '').trim();
  const smtpPass = String(formData.get('smtpPass') || '');

  if (!email || !smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) return;

  await prisma.mailAccount.upsert({
    where: {
      provider_email: {
        provider: 'SMTP',
        email,
      },
    },
    update: {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
    },
    create: {
      provider: 'SMTP',
      email,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
    },
  });

  revalidatePath('/accounts');
}

export default async function AccountsPage() {
  const accounts = await prisma.mailAccount.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Mail Accounts</h2>

      <div className="flex gap-3">
        <a href="/api/oauth/google" className="bg-blue-600 text-white px-4 py-2 rounded">Connect Gmail</a>
        <a href="/api/oauth/microsoft" className="bg-slate-800 text-white px-4 py-2 rounded">Connect Outlook</a>
      </div>

      <form action={createSmtpAccount} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <h3 className="md:col-span-2 font-medium">Add SMTP/IMAP Account</h3>
        <input name="email" placeholder="Email" className="border rounded p-2" required />
        <input name="smtpHost" placeholder="IMAP Host (e.g. imap.gmail.com)" className="border rounded p-2" required />
        <input name="smtpPort" type="number" defaultValue={993} className="border rounded p-2" required />
        <input name="smtpUser" placeholder="IMAP Username" className="border rounded p-2" required />
        <input name="smtpPass" type="password" placeholder="IMAP Password" className="border rounded p-2" required />
        <button type="submit" className="bg-emerald-600 text-white rounded px-4 py-2">Save Account</button>
      </form>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Provider</th>
              <th className="p-3">Email</th>
              <th className="p-3">Created</th>
              <th className="p-3">Mailbox</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-t">
                <td className="p-3">{account.provider}</td>
                <td className="p-3">{account.email}</td>
                <td className="p-3">{account.createdAt.toISOString().slice(0, 10)}</td>
                <td className="p-3"><Link className="text-blue-600" href={`/mail/${account.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
