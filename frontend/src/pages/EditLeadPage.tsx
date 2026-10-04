import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Lead } from '../types';
import LeadForm from '../components/LeadForm';
import api from '../lib/api';

export default function EditLeadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: leadData, isLoading } = useQuery<{ lead: Lead }>({
    queryKey: ['lead', id],
    queryFn: () => api.get(`/leads/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Lead>) => api.put(`/leads/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Lead updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/leads/${id}`);
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || 'Failed to update lead');
      } else {
        toast.error('Failed to update lead');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
          <p className="text-gray-500 text-sm mt-1">{leadData?.lead?.name}</p>
        </div>
      </div>

      <div className="card">
        <LeadForm
          initialData={leadData?.lead}
          onSubmit={async (data) => { await mutation.mutateAsync(data); }}
          isLoading={mutation.isPending}
        />
      </div>
    </div>
  );
}
