import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  BookOpen, 
  Activity, 
  Settings, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  MoreVertical,
  LogOut,
  LayoutDashboard,
  UserCheck,
  TrendingUp,
  Mail,
  Linkedin,
  MapPin,
  Calendar,
  Briefcase
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { readAdminSession, clearStoredSession } from '@/utils/session';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

type TutorApplication = {
  applicationId: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string | null;
  timezone: string | null;
  expertiseArea: string;
  expertiseStreams: string[];
  experienceYears: number | null;
  linkedinUrl: string | null;
  bio: string | null;
  courseTitle: string | null;
  courseDescription: string | null;
  targetAudience: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

const AdminDashboardPage = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const session = readAdminSession();
  const [activeTab, setActiveTab] = useState('Applications');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Security Check
  useEffect(() => {
    if (!session) {
      setLocation('/tutors/login');
    }
  }, [session, setLocation]);

  const headers = session?.token ? { 'Authorization': `Bearer ${session.token}` } : {};

  const { data: appsData, isLoading } = useQuery<{ applications: TutorApplication[] }>({
    queryKey: ['admin-tutor-applications'],
    enabled: !!session,
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/tutor-applications', undefined, { headers: headers as Record<string, string> });
      return res.json();
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', `/api/admin/tutor-applications/${id}/approve`, undefined, { headers: headers as Record<string, string> });
      if (!res.ok) throw new Error("Approval failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutor-applications'] });
      toast({ title: "Success", description: "Tutor approved and notified." });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', `/api/admin/tutor-applications/${id}/reject`, undefined, { headers: headers as Record<string, string> });
      if (!res.ok) throw new Error("Rejection failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tutor-applications'] });
      toast({ title: "Updated", description: "Application marked as rejected." });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });

  const handleLogout = () => {
    clearStoredSession();
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setLocation('/tutors/login');
  };

  const applications = appsData?.applications ?? [];
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const filteredApps = applications.filter(a => {
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesSearch = a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.expertiseArea.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFB] text-[#1E3A47] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#1E3A47]/5 flex flex-col pt-8">
        <div className="px-8 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[#B24531] rounded-lg flex items-center justify-center text-white font-black italic">O</div>
            <span className="font-black text-xl tracking-tighter uppercase">Ottolearn</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B24531] opacity-50 px-1">Admin Portal</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Applications', icon: ClipboardListIcon }, // Fallback to Users if needed
            { name: 'Active Tutors', icon: UserCheck },
            { name: 'Students', icon: Users },
            { name: 'Analytics', icon: TrendingUp },
            { name: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.name 
                  ? 'bg-[#1E3A47] text-white shadow-lg shadow-[#1E3A47]/10' 
                  : 'text-[#1E3A47]/40 hover:bg-[#1E3A47]/5 hover:text-[#1E3A47]'
              }`}
            >
              <item.icon size={18} />
              {item.name}
              {item.name === 'Applications' && stats.pending > 0 && (
                <span className="ml-auto bg-[#B24531] text-white text-[10px] px-2 py-0.5 rounded-full">{stats.pending}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E3A47]/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-[#B24531] hover:bg-[#B24531]/5 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-[#1E3A47]/5 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-black uppercase tracking-tight">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1E3A47]/40" size={16} />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#F8FAFB] border border-[#1E3A47]/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A47]/10 w-64"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1E3A47]/5 flex items-center justify-center font-black text-[#1E3A47]">
              {session.user.fullName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'Applications' ? (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total', value: stats.total, icon: ClipboardListIcon, color: '#1E3A47' },
                  { label: 'Pending', value: stats.pending, icon: Clock, color: '#B24531' },
                  { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: '#10B981' },
                  { label: 'Rejected', value: stats.rejected, icon: XCircle, color: '#64748B' },
                ].map((stat) => (
                  <motion.div 
                    key={stat.label}
                    whileHover={{ y: -4 }}
                    className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#1E3A47]/5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-2xl bg-[#F8FAFB]" style={{ color: stat.color }}>
                        <stat.icon size={20} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1E3A47]/40 mb-1">{stat.label} Proposals</p>
                      <h3 className="text-3xl font-black italic">{stat.value}</h3>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                      filterStatus === status 
                        ? 'bg-[#1E3A47] text-white border-transparent' 
                        : 'bg-white text-[#1E3A47]/40 border-[#1E3A47]/5 hover:border-[#1E3A47]/20'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Applications Table/List */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-[#1E3A47]/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFB]/50 border-b border-[#1E3A47]/5">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#1E3A47]/40">Candidate</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#1E3A47]/40">Expertise</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#1E3A47]/40">Course Proposal</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#1E3A47]/40">Status</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-[#1E3A47]/40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={5} className="p-12 text-center text-[#1E3A47]/40 font-bold">Loading applications...</td></tr>
                      ) : filteredApps.length === 0 ? (
                        <tr><td colSpan={5} className="p-12 text-center text-[#1E3A47]/40 font-bold">No applications found.</td></tr>
                      ) : (
                        filteredApps.map((app) => (
                          <React.Fragment key={app.applicationId}>
                            <tr 
                              className={`group cursor-pointer hover:bg-[#F8FAFB] transition-colors border-b border-[#1E3A47]/5 ${expandedRow === app.applicationId ? 'bg-[#F8FAFB]' : ''}`}
                              onClick={() => setExpandedRow(expandedRow === app.applicationId ? null : app.applicationId)}
                            >
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-[#1E3A47]/5 flex items-center justify-center font-black text-[#1E3A47] group-hover:bg-[#B24531] group-hover:text-white transition-all">
                                    {app.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-black text-sm">{app.fullName}</p>
                                    <p className="text-[10px] font-bold text-[#1E3A47]/40">{app.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-block px-3 py-1 bg-[#1E3A47]/5 rounded-lg text-[10px] font-black uppercase tracking-wider text-[#1E3A47]">
                                  {app.expertiseArea}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold truncate max-w-[200px]">{app.courseTitle || 'Untitled'}</p>
                                <p className="text-[10px] text-[#1E3A47]/40">{new Date(app.createdAt).toLocaleDateString()}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                  app.status === 'pending' ? 'text-[#B24531]' :
                                  app.status === 'approved' ? 'text-[#10B981]' : 'text-slate-400'
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    app.status === 'pending' ? 'bg-[#B24531]' :
                                    app.status === 'approved' ? 'bg-[#10B981]' : 'bg-slate-400'
                                  }`} />
                                  {app.status}
                                </div>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                  {app.status === 'pending' && (
                                    <>
                                      <button 
                                        disabled={approveMutation.isPending}
                                        onClick={() => approveMutation.mutate(app.applicationId)}
                                        className="p-2 hover:bg-[#10B981]/10 text-[#10B981] rounded-lg transition-colors"
                                        title="Approve"
                                      >
                                        <CheckCircle2 size={18} />
                                      </button>
                                      <button 
                                        disabled={rejectMutation.isPending}
                                        onClick={() => rejectMutation.mutate(app.applicationId)}
                                        className="p-2 hover:bg-[#DC2626]/10 text-[#DC2626] rounded-lg transition-colors"
                                        title="Reject"
                                      >
                                        <XCircle size={18} />
                                      </button>
                                    </>
                                  )}
                                  <ChevronRight size={16} className={`text-[#1E3A47]/20 transition-transform ${expandedRow === app.applicationId ? 'rotate-90' : ''}`} />
                                </div>
                              </td>
                            </tr>
                            <AnimatePresence>
                              {expandedRow === app.applicationId && (
                                <tr>
                                  <td colSpan={5} className="px-8 py-0">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="py-8 grid grid-cols-2 gap-12 border-b border-[#1E3A47]/5">
                                        {/* Profile Info */}
                                        <div className="space-y-6">
                                          <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B24531] mb-2">Detailed Profile</h4>
                                            <p className="text-sm font-medium leading-relaxed italic text-[#1E3A47]">
                                              "{app.bio || 'No bio provided.'}"
                                            </p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A47]/60">
                                              <MapPin size={14} className="text-[#B24531]" />
                                              {app.city || 'Location N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A47]/60">
                                              <Clock size={14} className="text-[#B24531]" />
                                              {app.timezone || 'Timezone N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A47]/60 text-emerald-600">
                                              <Briefcase size={14} />
                                              {app.experienceYears || 0} Years Exp.
                                            </div>
                                            {app.linkedinUrl && (
                                              <a href={app.linkedinUrl} target="_blank" className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
                                                <Linkedin size={14} />
                                                LinkedIn Profile
                                              </a>
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1E3A47]/40 mb-2">Expertise Streams</p>
                                            <div className="flex flex-wrap gap-2">
                                              {app.expertiseStreams.map(s => (
                                                <span key={s} className="px-2 py-1 bg-white border border-[#1E3A47]/10 rounded-md text-[9px] font-black uppercase tracking-wider">
                                                  {s}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Course Proposal */}
                                        <div className="space-y-6 bg-[#F8FAFB] p-6 rounded-3xl">
                                          <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B24531] mb-2">Curriculum Proposal</h4>
                                            <h5 className="text-lg font-black mb-3">{app.courseTitle}</h5>
                                            <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                              <p className="text-xs font-medium leading-relaxed text-[#1E3A47]/80">
                                                {app.courseDescription}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="pt-4 border-t border-[#1E3A47]/5 flex items-center justify-between">
                                            <div>
                                              <p className="text-[9px] font-black uppercase tracking-widest text-[#1E3A47]/40 mb-1">Target Audience</p>
                                              <p className="text-xs font-bold">{app.targetAudience}</p>
                                            </div>
                                            {app.status === 'pending' && (
                                              <div className="flex gap-4">
                                                <button 
                                                  onClick={() => approveMutation.mutate(app.applicationId)}
                                                  className="bg-[#1E3A47] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#B24531] transition-all shadow-lg"
                                                >
                                                  Approve Account
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-center flex-col items-center justify-center opacity-20">
              <Users size={80} className="mb-4" />
              <p className="font-black italic text-2xl uppercase tracking-tighter">Coming Soon</p>
              <p className="text-sm font-bold">Module under construction</p>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(30, 58, 71, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(30, 58, 71, 0.2);
        }
      `}</style>
    </div>
  );
};

// Help helper
const ClipboardListIcon = ({ size }: { size: number }) => <Activity size={size} />;

export default AdminDashboardPage;
