import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Lead } from '../types';
import LeadForm from '../components/LeadForm';
import api from '../lib/api';

export default function AddLeadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<Lead>) => api.post('/leads', data).then((r) => r.data),
    onSuccess: (data) => {
      toast.success('Lead created successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/leads/${data.lead?.id || data.id}`);
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to create lead');
      } else {
        toast.error('Failed to create lead');
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details to create a new lead</p>
        </div>
      </div>

      <div className="card">
        <LeadForm
          onSubmit={async (data) => { await mutation.mutateAsync(data); }}
          isLoading={mutation.isPending}
        />
      </div>
    </div>
  );
}
