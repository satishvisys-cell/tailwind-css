import { prisma } from '@/lib/prisma';

type Props = { params: { accountId: string } };

export default async function MailboxPage({ params }: Props) {
  const account = await prisma.mailAccount.findUnique({ where: { id: params.accountId } });
  if (!account) return <div>Account not found.</div>;

  const emails = await prisma.email.findMany({
    where: { mailAccountId: account.id },
    orderBy: { receivedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Mailbox: {account.email}</h2>

      <form action="/api/email" method="post" className="inline-block">
        <input type="hidden" name="accountId" value={account.id} />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">Fetch Latest Emails</button>
      </form>

      <div className="space-y-3">
        {emails.map((email) => (
          <div key={email.id} className="bg-white border rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{email.subject}</h3>
              <span className="text-xs text-slate-500">{email.receivedAt.toISOString()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap line-clamp-4">{email.bodyText}</p>
            <div className="flex gap-3">
              <details>
                <summary className="cursor-pointer text-blue-700">View</summary>
                <pre className="text-xs mt-2 bg-slate-100 p-3 rounded overflow-auto">{email.bodyText}</pre>
              </details>
              <form action={`/api/extract/${email.id}`} method="post">
                <button disabled={email.extracted} className="bg-emerald-600 disabled:bg-slate-300 text-white px-3 py-1 rounded">
                  {email.extracted ? 'Extracted' : 'Extract Job'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
