import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [services, setServices] = useState([]);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'leads') {
        const res = await axios.get('/api/leads');
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

  return (
    <div className="min-h-screen bg-brand-black text-white flex">
      <Helmet>
        <title>Admin Dashboard | Rajugari Ventures</title>
      </Helmet>
      
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 p-6 flex flex-col">
        <h1 className="text-2xl font-display font-bold uppercase mb-12 text-brand-orange">RV Admin</h1>
        <nav className="flex-1 space-y-4">
          {['leads', 'services', 'blogs', 'portfolio'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg uppercase font-mono text-sm tracking-widest transition-colors ${
                activeTab === tab ? 'bg-brand-orange text-black font-bold' : 'text-white/50 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <button onClick={() => { logout(); navigate('/admin/login'); }} className="mt-auto text-red-500 font-mono text-sm uppercase tracking-widest hover:text-red-400">
          Logout
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <h2 className="text-4xl font-display font-bold uppercase mb-12">{activeTab} Management</h2>
        
        {activeTab === 'leads' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/50 font-mono text-xs uppercase tracking-widest">
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

        {/* Placeholder for other tabs */}
        {activeTab !== 'leads' && (
          <div className="text-center py-24 text-white/30 font-mono uppercase tracking-widest">
            {activeTab} module under development
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
