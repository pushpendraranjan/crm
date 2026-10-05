import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { LeadsResponse, LeadStatus, User } from '../types';
import { LeadStatusBadge } from '../components/StatusBadge';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Followup', 'Converted', 'Lost'];

export default function LeadsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const params = { page, limit: 10, search, status, assignedToId, location, propertyType, sortBy, sortOrder };

  const { data, isLoading, error, refetch } = useQuery<LeadsResponse>({
    queryKey: ['leads', params],
    queryFn: () => api.get('/leads', { params }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: usersData } = useQuery<{ users: User[] }>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: user?.role === 'ADMIN',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      toast.success('Lead deleted');
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.message || 'Delete failed');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilter = (key: string, value: string) => {
    if (key === 'status') setStatus(value);
    if (key === 'assignedToId') setAssignedToId(value);
    if (key === 'location') setLocation(value);
    if (key === 'propertyType') setPropertyType(value);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-gray-400">{sortBy === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.pagination.total ?? 0} total leads
          </p>
        </div>
        <Link to="/leads/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input pl-10"
                placeholder="Search by name or email..."
              />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </form>

          <select value={status} onChange={(e) => handleFilter('status', e.target.value)} className="input w-36">
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {user?.role === 'ADMIN' && (
            <select value={assignedToId} onChange={(e) => handleFilter('assignedToId', e.target.value)} className="input w-40">
              <option value="">All Agents</option>
              {usersData?.users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}

          <input
            value={location}
            onChange={(e) => handleFilter('location', e.target.value)}
            placeholder="Filter location..."
            className="input w-36"
          />

          <input
            value={propertyType}
            onChange={(e) => handleFilter('propertyType', e.target.value)}
            placeholder="Filter property..."
            className="input w-36"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center text-red-700" role="alert">
            <p>Failed to load leads. Please try again.</p>
            <button onClick={() => refetch()} className="btn-secondary">Retry</button>
          </div>
        ) : !data?.leads?.length ? (
          <div className="py-16 flex flex-col items-center text-gray-400">
            <Filter className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">No leads found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
            <Link to="/leads/new" className="btn-primary mt-4">Add first lead</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Name <SortIcon field="name" />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Property</th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status <SortIcon field="status" />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned To</th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created <SortIcon field="createdAt" />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      {lead.budget && (
                        <p className="text-xs text-gray-500">₹{Number(lead.budget).toLocaleString('en-IN')}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.phone && <p className="text-sm text-gray-700">{lead.phone}</p>}
                      {lead.email && <p className="text-xs text-gray-500">{lead.email}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {lead.propertyType && <p className="text-sm text-gray-700">{lead.propertyType}</p>}
                      {lead.location && <p className="text-xs text-gray-500">{lead.location}</p>}
                    </td>
                    <td className="px-6 py-4"><LeadStatusBadge status={lead.status} /></td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">
                        {lead.assignedTo?.name || <span className="text-gray-400">Unassigned</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/leads/${lead.id}/edit`}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(lead.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, data.pagination.total)} of {data.pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">Page {page} of {data.pagination.totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
              className="btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Delete Lead?</h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone. The lead and all its follow-ups will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
