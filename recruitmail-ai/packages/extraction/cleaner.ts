export function cleanEmailBody(input: string): string {
  return input
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/From:.*$/gim, '')
    .replace(/Sent:.*$/gim, '')
    .replace(/To:.*$/gim, '')
    .replace(/Subject:.*$/gim, '')
    .replace(/https?:\/\/\S+/g, (match) => (match.length > 120 ? `${match.slice(0, 120)}...` : match))
    .trim();
}
