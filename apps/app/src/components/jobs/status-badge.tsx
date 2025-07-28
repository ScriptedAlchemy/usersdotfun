import { Badge } from '~/components/ui/badge';

export function StatusBadge({ status }: { status: string }) {
  const color = {
    running: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    pending: 'bg-yellow-500',
  }[status] || 'bg-gray-500';

  return <Badge className={`${color} text-white`}>{status}</Badge>;
}
