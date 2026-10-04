export type Role = 'ADMIN' | 'AGENT';
export type DealType = 'Buy' | 'Rent' | 'Sell';
export type LeadStatus = 'New' | 'Contacted' | 'Followup' | 'Converted' | 'Lost';
export type FollowUpStatus = 'Pending' | 'Done' | 'Cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  lead?: { id: string; name: string; phone?: string; status?: LeadStatus };
  title: string;
  date: string;
  notes?: string;
  status: FollowUpStatus;
  createdAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  budget?: number;
  location?: string;
  propertyType?: string;
  dealType: DealType;
  leadSource?: string;
  status: LeadStatus;
  assignedToId?: string;
  assignedTo?: User;
  followupDate?: string;
  notes?: string;
  createdAt: string;
  followUps?: FollowUp[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadsResponse {
  leads: Lead[];
  pagination: Pagination;
}

export interface DashboardStats {
  total: number;
  newLeads: number;
  converted: number;
  lost: number;
  followupsToday: number;
  conversionRate: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  statusBreakdown: { status: string; count: number }[];
  recentLeads: Lead[];
  upcomingFollowUps: FollowUp[];
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
