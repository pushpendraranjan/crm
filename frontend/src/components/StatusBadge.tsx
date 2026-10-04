import { LeadStatus, FollowUpStatus } from '../types';

const leadStatusColors: Record<LeadStatus, string> = {
  New: 'bg-blue-100 text-blue-700',
  Contacted: 'bg-yellow-100 text-yellow-700',
  Followup: 'bg-purple-100 text-purple-700',
  Converted: 'bg-green-100 text-green-700',
  Lost: 'bg-red-100 text-red-700',
};

const followUpStatusColors: Record<FollowUpStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Done: 'bg-green-100 text-green-700',
  Cancelled: 'bg-gray-100 text-gray-600',
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leadStatusColors[status]}`}>
      {status}
    </span>
  );
}

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${followUpStatusColors[status]}`}>
      {status}
    </span>
  );
}
