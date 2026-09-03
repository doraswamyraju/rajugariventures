import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import CourseManagerTab from '../../components/admin/CourseManagerTab';
import ReviewManagerTab from '../../components/admin/ReviewManagerTab';

export default function Dashboard() {
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reviews');
  const [leads, setLeads] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [services, setServices] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ id: number; msg: string; isError?: boolean } | null>(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'certificates') {
        const res = await axios.get('/api/certificates', authHeaders);
        setCertificates(res.data);
      } else if (activeTab === 'leads') {
        const res = await axios.get('/api/leads', authHeaders);
        setLeads(res.data);
      } else if (activeTab === 'services') {
        const res = await axios.get('/api/services');
        setServices(res.data);
      } else if (activeTab === 'blogs') {
        const res = await axios.get('/api/blogs');
        setBlogs(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCertificate = async (id: number) => {
    setLoadingId(id);
    setActionMsg(null);
    try {
      const res = await axios.post(`/api/certificates/approve/${id}`, {}, authHeaders);
      setActionMsg({ id, msg: res.data.emailSent ? 'Approved & Email sent!' : 'Approved! (PDF ready, email simulated)' });
      fetchData();
    } catch (err: any) {
      setActionMsg({ id, msg: err.response?.data?.error || 'Failed to approve', isError: true });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectCertificate = async (id: number) => {
    if (!window.confirm('Are you sure you want to reject this certificate request?')) return;
    setLoadingId(id);
    setActionMsg(null);
    try {
      await axios.post(`/api/certificates/reject/${id}`, {}, authHeaders);
      setActionMsg({ id, msg: 'Request rejected' });
      fetchData();
    } catch (err: any) {
      setActionMsg({ id, msg: err.response?.data?.error || 'Failed to reject', isError: true });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-white flex">
      <Helmet>
        <title>Admin Dashboard | Rajugari Ventures</title>
      </Helmet>
      
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 p-6 flex flex-col">
        <h1 className="text-2xl font-display font-bold uppercase mb-12 text-brand-orange">RV Admin</h1>
        <nav className="flex-1 space-y-3">
          {['reviews', 'courses', 'certificates', 'leads', 'services', 'blogs', 'portfolio'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-xl uppercase font-mono text-xs tracking-widest transition-all ${
                activeTab === tab ? 'bg-brand-orange text-black font-bold shadow-lg shadow-brand-orange/20' : 'text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab === 'reviews' ? '⭐ Google Reviews' : tab === 'courses' ? 'Masterclass Courses' : tab === 'certificates' ? 'Certificates' : tab}
            </button>
          ))}
        </nav>
        <button onClick={() => { logout(); navigate('/admin/login'); }} className="mt-auto text-red-500 font-mono text-xs uppercase tracking-widest hover:text-red-400 p-3 bg-red-500/10 rounded-xl">
          Logout
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold uppercase">
              {activeTab === 'reviews' ? 'Google Reviews Campaigns' : activeTab === 'courses' ? 'Masterclass & Courses' : `${activeTab} Management`}
            </h2>
            <p className="text-white/50 text-sm font-mono mt-1">
              {activeTab === 'reviews' 
                ? 'Manage business clients, upload one-time customer reviews, and copy review landing links.'
                : activeTab === 'courses' 
                ? 'Manage course offerings, prices, testimonials, and student registrations.'
                : `Manage website ${activeTab} data.`}
            </p>
          </div>
          <button 
            onClick={fetchData} 
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-mono text-xs uppercase tracking-wider text-white/80"
          >
            Refresh
          </button>
        </div>

        {/* Google Reviews Tab */}
        {activeTab === 'reviews' && (
          <ReviewManagerTab token={token || ''} />
        )}

        {/* Masterclass Courses Tab */}
        {activeTab === 'courses' && (
          <CourseManagerTab token={token || ''} />
        )}

        {/* Certificate Management Tab */}
        {activeTab === 'certificates' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/50 font-mono text-xs uppercase tracking-widest border-b border-white/10">
                <tr>
                  <th className="p-5">Candidate Name</th>
                  <th className="p-5">Course Attended</th>
                  <th className="p-5">Email Address</th>
                  <th className="p-5">Submitted Date</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-sans text-sm">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-white/40 font-mono">
                      No certificate requests found.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert: any) => (
                    <tr key={cert.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-5 font-bold text-white">
                        {cert.name}
                        {cert.cert_id && <div className="text-[11px] font-mono text-brand-orange font-normal">{cert.cert_id}</div>}
                      </td>
                      <td className="p-5 text-white/80 font-medium">{cert.course}</td>
                      <td className="p-5 text-white/60 font-mono text-xs">{cert.email}</td>
                      <td className="p-5 text-white/50 font-mono text-xs">{new Date(cert.created_at).toLocaleDateString()}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                          cert.status === 'approved' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : cert.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}>
                          {cert.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-5 text-right space-x-2">
                        {actionMsg?.id === cert.id && (
                          <span className={`text-xs font-mono mr-3 ${actionMsg.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                            {actionMsg.msg}
                          </span>
                        )}

                        {cert.status !== 'approved' && (
                          <button
                            onClick={() => handleApproveCertificate(cert.id)}
                            disabled={loadingId === cert.id}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-xs uppercase px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                          >
                            {loadingId === cert.id ? 'Approving...' : 'Approve & Send Mail'}
                          </button>
                        )}

                        {cert.status === 'pending' && (
                          <button
                            onClick={() => handleRejectCertificate(cert.id)}
                            disabled={loadingId === cert.id}
                            className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-mono text-xs uppercase px-3 py-2 rounded-xl border border-red-500/40 transition-all disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Leads Management Tab */}
        {activeTab === 'leads' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/50 font-mono text-xs uppercase tracking-widest border-b border-white/10">
                <tr>
                  <th className="p-6">Name</th>
                  <th className="p-6">Email</th>
                  <th className="p-6">Service</th>
                  <th className="p-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 font-bold">{lead.name}</td>
                    <td className="p-6 text-white/70">{lead.email}</td>
                    <td className="p-6 text-brand-orange">{lead.service}</td>
                    <td className="p-6 text-white/50 text-sm">{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Other Tabs */}
        {['services', 'blogs', 'portfolio'].includes(activeTab) && (
          <div className="text-center py-24 text-white/30 font-mono uppercase tracking-widest bg-white/5 rounded-2xl border border-white/10">
            {activeTab} module ready for setup
          </div>
        )}
      </main>
    </div>
  );
}
