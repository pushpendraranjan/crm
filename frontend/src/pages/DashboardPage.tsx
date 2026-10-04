import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Calendar, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DashboardResponse } from '../types';
import { LeadStatusBadge } from '../components/StatusBadge';
import api from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  New: '#3b82f6',
  Contacted: '#f59e0b',
  Followup: '#8b5cf6',
  Converted: '#10b981',
  Lost: '#ef4444',
};

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/leads/dashboard').then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  const { stats, statusBreakdown, recentLeads, upcomingFollowUps } = data!;

  const statCards = [
    { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'New Leads', value: stats.newLeads, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-100' },
    { label: "Follow-ups Today", value: stats.followupsToday, icon: Calendar, color: 'text-purple-600 bg-purple-100' },
    { label: 'Converted', value: stats.converted, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Lost', value: stats.lost, icon: XCircle, color: 'text-red-600 bg-red-100' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: BarChart2, color: 'text-orange-600 bg-orange-100' },
  ];

  const chartData = statusBreakdown.map((s) => ({
    name: s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your lead pipeline</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Lead Status Distribution</h2>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Lead Pipeline</h2>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Leads">
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent leads + upcoming follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leads */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Leads</h2>
            <Link to="/leads" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No leads yet</div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <Link key={lead.id} to={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.location} • {lead.propertyType}</p>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming follow-ups */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Upcoming Follow-ups</h2>
          {upcomingFollowUps.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No upcoming follow-ups</div>
          ) : (
            <div className="space-y-3">
              {upcomingFollowUps.map((fu) => (
                <Link key={fu.id} to={`/leads/${fu.lead?.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{fu.title}</p>
                    <p className="text-xs text-gray-500">{fu.lead?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{new Date(fu.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-xs text-gray-500">{new Date(fu.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
