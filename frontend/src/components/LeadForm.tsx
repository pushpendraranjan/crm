import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lead, User, LeadStatus } from '../types';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface LeadFormProps {
  initialData?: Partial<Lead>;
  onSubmit: (data: Partial<Lead>) => Promise<void>;
  isLoading: boolean;
}

export default function LeadForm({ initialData, onSubmit, isLoading }: LeadFormProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<Lead>>({
    name: '',
    phone: '',
    email: '',
    budget: undefined,
    location: '',
    propertyType: '',
    dealType: 'Buy',
    leadSource: '',
    status: 'New',
    assignedToId: '',
    followupDate: '',
    notes: '',
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: usersData } = useQuery<{ users: User[] }>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: user?.role === 'ADMIN',
  });

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        followupDate: initialData.followupDate
          ? new Date(initialData.followupDate).toISOString().slice(0, 16)
          : '',
        budget: initialData.budget ?? undefined,
      }));
    }
  }, [initialData]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = 'Name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (form.budget !== undefined && form.budget !== null && (isNaN(Number(form.budget)) || Number(form.budget) < 0)) {
      errs.budget = 'Budget must be a positive number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: Partial<Lead> = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      location: form.location || undefined,
      propertyType: form.propertyType || undefined,
      dealType: form.dealType,
      leadSource: form.leadSource || undefined,
      status: form.status,
      assignedToId: form.assignedToId || undefined,
      followupDate: form.followupDate ? new Date(form.followupDate as string).toISOString() : undefined,
      notes: form.notes || undefined,
    };
    await onSubmit(payload);
  };

  const inputClass = (field: string) =>
    `input ${errors[field] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="label">Name <span className="text-red-500">*</span></label>
          <input name="name" value={form.name || ''} onChange={handleChange} className={inputClass('name')} placeholder="Rahul Sharma" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="label">Phone</label>
          <input name="phone" value={form.phone || ''} onChange={handleChange} className="input" placeholder="+91-9876543210" />
        </div>

        {/* Email */}
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" value={form.email || ''} onChange={handleChange} className={inputClass('email')} placeholder="rahul@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Budget */}
        <div>
          <label className="label">Budget (₹)</label>
          <input name="budget" type="number" value={form.budget ?? ''} onChange={handleChange} className={inputClass('budget')} placeholder="5000000" />
          {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="label">Location</label>
          <input name="location" value={form.location || ''} onChange={handleChange} className="input" placeholder="Mumbai" />
        </div>

        {/* Property Type */}
        <div>
          <label className="label">Property Type</label>
          <input name="propertyType" value={form.propertyType || ''} onChange={handleChange} className="input" placeholder="2BHK Apartment" />
        </div>

        {/* Deal Type */}
        <div>
          <label className="label">Deal Type</label>
          <select name="dealType" value={form.dealType || 'Buy'} onChange={handleChange} className="input">
            <option value="Buy">Buy</option>
            <option value="Rent">Rent</option>
            <option value="Sell">Sell</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="label">Status</label>
          <select name="status" value={form.status || 'New'} onChange={handleChange} className="input">
            {(['New', 'Contacted', 'Followup', 'Converted', 'Lost'] as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Lead Source */}
        <div>
          <label className="label">Lead Source</label>
          <input name="leadSource" value={form.leadSource || ''} onChange={handleChange} className="input" placeholder="Website, Referral, Social Media..." />
        </div>

        {user?.role === 'ADMIN' && (
          <div>
            <label className="label">Assigned To</label>
            <select name="assignedToId" value={form.assignedToId || ''} onChange={handleChange} className="input">
              <option value="">Unassigned</option>
              {usersData?.users?.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        )}

        {/* Follow-up Date */}
        <div>
          <label className="label">Follow-up Date</label>
          <input name="followupDate" type="datetime-local" value={form.followupDate as string || ''} onChange={handleChange} className="input" />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" rows={3} value={form.notes || ''} onChange={handleChange} className="input resize-none" placeholder="Additional notes about this lead..." />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary">
        {isLoading ? 'Saving...' : 'Save Lead'}
      </button>
    </form>
  );
}
