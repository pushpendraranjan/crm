import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Role } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' as Role });
  const [isCreating, setIsCreating] = useState(false);
  const { data, isLoading, error } = useQuery<{ users: User[] }>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((response) => response.data),
    enabled: user?.role === 'ADMIN',
  });

  const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Account created');
      setForm({ name: '', email: '', password: '', role: 'AGENT' });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (creationError) {
      if (axios.isAxiosError(creationError)) {
        toast.error(creationError.response?.data?.message || 'Failed to create account');
      } else {
        toast.error('Failed to create account');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">{data?.users.length ?? 0} registered users</p>
      </div>

      <section className="card">
        <h2 className="mb-4 font-semibold text-gray-800">Create account</h2>
        <form onSubmit={handleCreateAccount} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            aria-label="Full name"
            required
            minLength={1}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="input"
            placeholder="Full name"
          />
          <input
            aria-label="Email address"
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="input"
            placeholder="Email address"
          />
          <input
            aria-label="Initial password"
            required
            minLength={6}
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="input"
            placeholder="Initial password"
          />
          <select
            aria-label="Account role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
            className="input"
          >
            <option value="AGENT">Agent</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" disabled={isCreating} className="btn-primary">
            {isCreating ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </section>

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