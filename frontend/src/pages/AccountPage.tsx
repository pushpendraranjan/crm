import { useQuery } from '@tanstack/react-query';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function AccountPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery<{ users: User[] }>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((response) => response.data),
    enabled: user?.role === 'ADMIN',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">{data?.users.length ?? 0} registered users</p>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-700">Failed to load accounts. Please try again.</p>
        ) : !data?.users.length ? (
          <p className="p-6 text-sm text-gray-500">No accounts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.users.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{account.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{account.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{account.role}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}