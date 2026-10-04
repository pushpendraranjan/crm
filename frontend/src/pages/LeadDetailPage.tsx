import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building2,
  Calendar, DollarSign, User, Plus, Check, X, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Lead, FollowUp, FollowUpStatus } from '../types';
import { LeadStatusBadge, FollowUpStatusBadge } from '../components/StatusBadge';
import api from '../lib/api';

interface FollowUpFormData {
  title: string;
  date: string;
  notes: string;
  status: FollowUpStatus;
}

const defaultFUForm: FollowUpFormData = { title: '', date: '', notes: '', status: 'Pending' };

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFUForm, setShowFUForm] = useState(false);
  const [editFU, setEditFU] = useState<FollowUp | null>(null);
  const [fuForm, setFuForm] = useState<FollowUpFormData>(defaultFUForm);
  const [deleteLeadConfirm, setDeleteLeadConfirm] = useState(false);
  const [deleteFUConfirm, setDeleteFUConfirm] = useState<string | null>(null);
  const [fuErrors, setFuErrors] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery<{ lead: Lead }>({
    queryKey: ['lead', id],
    queryFn: () => api.get(`/leads/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const deleteLeadMutation = useMutation({
    mutationFn: () => api.delete(`/leads/${id}`),
    onSuccess: () => {
      toast.success('Lead deleted');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/leads');
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.message || 'Delete failed');
    },
  });

  const createFUMutation = useMutation({
    mutationFn: (data: Partial<FollowUp>) => api.post(`/leads/${id}/followups`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Follow-up added');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      resetFUForm();
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.message || 'Failed to add follow-up');
    },
  });

  const updateFUMutation = useMutation({
    mutationFn: ({ fuId, data }: { fuId: string; data: Partial<FollowUp> }) =>
      api.put(`/leads/${id}/followups/${fuId}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Follow-up updated');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      resetFUForm();
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.message || 'Failed to update follow-up');
    },
  });

  const deleteFUMutation = useMutation({
    mutationFn: (fuId: string) => api.delete(`/leads/${id}/followups/${fuId}`),
    onSuccess: () => {
      toast.success('Follow-up deleted');
      setDeleteFUConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) toast.error(err.response?.data?.message || 'Failed to delete');
    },
  });

  const resetFUForm = () => {
    setShowFUForm(false);
    setEditFU(null);
    setFuForm(defaultFUForm);
    setFuErrors({});
  };

  const openEditFU = (fu: FollowUp) => {
    setEditFU(fu);
    setFuForm({
      title: fu.title,
      date: new Date(fu.date).toISOString().slice(0, 16),
      notes: fu.notes || '',
      status: fu.status,
    });
    setShowFUForm(true);
  };

  const validateFU = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fuForm.title.trim()) errs.title = 'Title is required';
    if (!fuForm.date) errs.date = 'Date is required';
    setFuErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFUSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFU()) return;
    const payload = {
      ...fuForm,
      date: new Date(fuForm.date).toISOString(),
    };
    if (editFU) {
      await updateFUMutation.mutateAsync({ fuId: editFU.id, data: payload });
    } else {
      await createFUMutation.mutateAsync(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data?.lead) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Lead not found or failed to load.
      </div>
    );
  }

  const lead = data.lead;
  const followUps = lead.followUps || [];

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) => {
    if (!value && value !== 0) return null;
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm font-medium text-gray-900">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
              <LeadStatusBadge status={lead.status} />
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Lead ID: {lead.id} • Created {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/leads/${id}/edit`} className="btn-secondary flex items-center gap-2">
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button
            onClick={() => setDeleteLeadConfirm(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800">Contact Information</h2>
            <InfoRow icon={Phone} label="Phone" value={lead.phone} />
            <InfoRow icon={Mail} label="Email" value={lead.email} />
            <InfoRow icon={MapPin} label="Location" value={lead.location} />
          </div>

          {/* Property Info */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800">Property Details</h2>
            <InfoRow icon={Building2} label="Property Type" value={lead.propertyType} />
            <InfoRow icon={Building2} label="Deal Type" value={lead.dealType} />
            <InfoRow icon={DollarSign} label="Budget" value={lead.budget ? `₹${Number(lead.budget).toLocaleString('en-IN')}` : null} />
            <InfoRow icon={Building2} label="Lead Source" value={lead.leadSource} />
          </div>

          {/* Assignment */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800">Assignment</h2>
            <InfoRow icon={User} label="Assigned To" value={lead.assignedTo?.name || 'Unassigned'} />
            <InfoRow
              icon={Calendar}
              label="Follow-up Date"
              value={lead.followupDate ? new Date(lead.followupDate).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              }) : null}
            />
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>

        {/* Right column: Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Follow-ups ({followUps.length})</h2>
              {!showFUForm && (
                <button
                  onClick={() => { setShowFUForm(true); setEditFU(null); setFuForm(defaultFUForm); }}
                  className="btn-primary flex items-center gap-2 text-sm py-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Follow-up
                </button>
              )}
            </div>

            {/* Follow-up Form */}
            {showFUForm && (
              <form onSubmit={handleFUSubmit} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <h3 className="font-medium text-gray-800 text-sm">{editFU ? 'Edit Follow-up' : 'New Follow-up'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Title <span className="text-red-500">*</span></label>
                    <input
                      value={fuForm.title}
                      onChange={(e) => { setFuForm((p) => ({ ...p, title: e.target.value })); setFuErrors((p) => ({ ...p, title: '' })); }}
                      className={`input ${fuErrors.title ? 'border-red-500' : ''}`}
                      placeholder="Call, Meeting, Site Visit..."
                    />
                    {fuErrors.title && <p className="text-red-500 text-xs mt-1">{fuErrors.title}</p>}
                  </div>
                  <div>
                    <label className="label">Date & Time <span className="text-red-500">*</span></label>
                    <input
                      type="datetime-local"
                      value={fuForm.date}
                      onChange={(e) => { setFuForm((p) => ({ ...p, date: e.target.value })); setFuErrors((p) => ({ ...p, date: '' })); }}
                      className={`input ${fuErrors.date ? 'border-red-500' : ''}`}
                    />
                    {fuErrors.date && <p className="text-red-500 text-xs mt-1">{fuErrors.date}</p>}
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={fuForm.status}
                      onChange={(e) => setFuForm((p) => ({ ...p, status: e.target.value as FollowUpStatus }))}
                      className="input"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Done">Done</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <input
                      value={fuForm.notes}
                      onChange={(e) => setFuForm((p) => ({ ...p, notes: e.target.value }))}
                      className="input"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={createFUMutation.isPending || updateFUMutation.isPending}
                    className="btn-primary text-sm py-1.5 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {editFU ? 'Update' : 'Add'}
                  </button>
                  <button type="button" onClick={resetFUForm} className="btn-secondary text-sm py-1.5 flex items-center gap-1.5">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Follow-ups list */}
            {followUps.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-gray-400">
                <Clock className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">No follow-ups yet</p>
                <p className="text-xs mt-1">Add your first follow-up to track communications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.map((fu) => (
                  <div key={fu.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{fu.title}</p>
                        <FollowUpStatusBadge status={fu.status} />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(fu.date).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {fu.notes && <p className="text-xs text-gray-500 mt-1.5 italic">{fu.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditFU(fu)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteFUConfirm(fu.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Lead Modal */}
      {deleteLeadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Delete Lead?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete <span className="font-medium text-gray-700">{lead.name}</span> and all their follow-ups.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteLeadMutation.mutate()}
                disabled={deleteLeadMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteLeadMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteLeadConfirm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Follow-up Modal */}
      {deleteFUConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Delete Follow-up?</h3>
            <p className="text-gray-500 text-sm mb-6">This follow-up will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteFUMutation.mutate(deleteFUConfirm)}
                disabled={deleteFUMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteFUMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteFUConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
