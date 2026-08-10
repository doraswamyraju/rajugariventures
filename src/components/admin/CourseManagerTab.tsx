import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, DollarSign, Video, Image as ImageIcon, Users, Save, Plus, Trash2, Download, CheckCircle, ExternalLink } from 'lucide-react';

interface CourseManagerTabProps {
  token: string;
}

export default function CourseManagerTab({ token }: CourseManagerTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'testimonials' | 'showcase' | 'registrations'>('settings');
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Course Settings State
  const [course, setCourse] = useState({
    title: 'AI PRODUCTIVITY MASTERCLASS',
    subtitle: 'From Casual AI User to AI Power User in 5 Days',
    actual_price: 1499,
    offer_price: 499,
    start_date: '17th August 2026',
    timings: '6:00 PM to 7:00 PM Daily',
    zoom_link: 'https://zoom.us/j/sample-masterclass',
    whatsapp_link: 'https://chat.whatsapp.com/sample-masterclass'
  });

  // Testimonials State
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: 'Student',
    rating: 5,
    type: 'video', // 'video' | 'text'
    media_url: '',
    review_text: ''
  });

  // Showcase State
  const [showcase, setShowcase] = useState<any[]>([]);
  const [newShowcase, setNewShowcase] = useState({
    title: '',
    category: 'work', // 'work' | 'certificate'
    image_url: '',
    student_name: ''
  });

  // Registrations State
  const [registrations, setRegistrations] = useState<any[]>([]);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchMasterclassData();
  }, []);

  const fetchMasterclassData = async () => {
    setLoading(true);
    try {
      const publicRes = await axios.get('/api/masterclass/public');
      if (publicRes.data.course) setCourse(publicRes.data.course);
      if (publicRes.data.testimonials) setTestimonials(publicRes.data.testimonials);
      if (publicRes.data.showcase) setShowcase(publicRes.data.showcase);

      // Fetch registrations
      const regRes = await axios.get('/api/masterclass/admin/registrations', authHeaders);
      setRegistrations(regRes.data || []);
    } catch (err) {
      console.error('Failed to fetch masterclass data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    setSaveMsg(null);
    try {
      await axios.put('/api/masterclass/admin/course', course, authHeaders);
      setSaveMsg({ text: 'Course settings saved successfully!' });
    } catch (err: any) {
      setSaveMsg({ text: err.response?.data?.error || 'Failed to save settings', isError: true });
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/masterclass/admin/testimonials', newTestimonial, authHeaders);
      setNewTestimonial({ name: '', role: 'Student', rating: 5, type: 'video', media_url: '', review_text: '' });
      fetchMasterclassData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await axios.delete(`/api/masterclass/admin/testimonials/${id}`, authHeaders);
      fetchMasterclassData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddShowcase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/masterclass/admin/showcase', newShowcase, authHeaders);
      setNewShowcase({ title: '', category: 'work', image_url: '', student_name: '' });
      fetchMasterclassData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteShowcase = async (id: number) => {
    if (!window.confirm('Delete this showcase item?')) return;
    try {
      await axios.delete(`/api/masterclass/admin/showcase/${id}`, authHeaders);
      fetchMasterclassData();
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (registrations.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'WhatsApp', 'Amount', 'Payment ID', 'Status', 'Date'];
    const rows = registrations.map(r => [
      r.id,
      `"${r.name}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${r.whatsapp || r.phone}"`,
      r.amount,
      `"${r.payment_id}"`,
      r.status,
      `"${r.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Masterclass_Registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'settings', label: 'Course Settings & Offer', icon: Calendar },
          { id: 'testimonials', label: 'Video & GMB Reviews', icon: Video },
          { id: 'showcase', label: 'Student Work & Certificates', icon: ImageIcon },
          { id: 'registrations', label: `Registrations (${registrations.length})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all ${
                activeSubTab === tab.id
                  ? 'bg-brand-orange text-black font-bold shadow-lg shadow-brand-orange/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {saveMsg && (
        <div className={`p-4 rounded-xl font-mono text-xs flex items-center gap-2 ${saveMsg.isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          <CheckCircle className="w-4 h-4" />
          {saveMsg.text}
        </div>
      )}

      {/* 1. COURSE SETTINGS TAB */}
      {activeSubTab === 'settings' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-brand-orange flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Masterclass Details & Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">Course Title</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">Subtitle / Tagline</label>
              <input
                type="text"
                value={course.subtitle}
                onChange={(e) => setCourse({ ...course, subtitle: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">Batch Start Date</label>
              <input
                type="text"
                value={course.start_date}
                onChange={(e) => setCourse({ ...course, start_date: e.target.value })}
                placeholder="e.g. 17th August 2026"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">Live Class Timings</label>
              <input
                type="text"
                value={course.timings}
                onChange={(e) => setCourse({ ...course, timings: e.target.value })}
                placeholder="e.g. 6:00 PM to 7:00 PM Daily"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">Offer Price (₹)</label>
              <input
                type="number"
                value={course.offer_price}
                onChange={(e) => setCourse({ ...course, offer_price: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">Actual / Strikethrough Price (₹)</label>
              <input
                type="number"
                value={course.actual_price}
                onChange={(e) => setCourse({ ...course, actual_price: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">Zoom Live Meeting Link</label>
              <input
                type="text"
                value={course.zoom_link}
                onChange={(e) => setCourse({ ...course, zoom_link: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60">WhatsApp Batch Group Link</label>
              <input
                type="text"
                value={course.whatsapp_link}
                onChange={(e) => setCourse({ ...course, whatsapp_link: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSaveCourse}
              className="bg-brand-orange text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-opacity-90 transition-all uppercase font-mono text-xs tracking-wider"
            >
              <Save className="w-4 h-4" /> Save Course Changes
            </button>
          </div>
        </div>
      )}

      {/* 2. TESTIMONIALS TAB */}
      {activeSubTab === 'testimonials' && (
        <div className="space-y-6">
          {/* Add Form */}
          <form onSubmit={handleAddTestimonial} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-brand-orange flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Student Review / Testimonial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Student Name"
                value={newTestimonial.name}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                required
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
              <input
                type="text"
                placeholder="Role / Business (e.g. Freelancer)"
                value={newTestimonial.role}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
              <select
                value={newTestimonial.type}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, type: e.target.value as any })}
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              >
                <option value="video" className="bg-neutral-900 text-white">Video Testimonial (YouTube Embed/URL)</option>
                <option value="text" className="bg-neutral-900 text-white">Text Review (GMB Rating)</option>
              </select>
            </div>

            {newTestimonial.type === 'video' ? (
              <input
                type="text"
                placeholder="Video Embed URL (e.g. https://www.youtube.com/embed/... or MP4 link)"
                value={newTestimonial.media_url}
                onChange={(e) => setNewTestimonial({ ...newTestimonial, media_url: e.target.value })}
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
            ) : null}

            <textarea
              placeholder="Review Highlight Text"
              value={newTestimonial.review_text}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, review_text: e.target.value })}
              rows={3}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
            />

            <button type="submit" className="bg-brand-orange text-black font-bold px-5 py-2.5 rounded-xl uppercase font-mono text-xs">
              Add Testimonial
            </button>
          </form>

          {/* List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 relative">
                <button
                  onClick={() => handleDeleteTestimonial(t.id)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${t.type === 'video' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {t.type}
                  </span>
                  <h4 className="font-bold text-white text-sm">{t.name}</h4>
                  <span className="text-white/40 text-xs">({t.role})</span>
                </div>
                <p className="text-white/80 text-xs italic">"{t.review_text}"</p>
                {t.media_url && (
                  <p className="text-brand-orange text-[10px] font-mono truncate">{t.media_url}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SHOWCASE TAB */}
      {activeSubTab === 'showcase' && (
        <div className="space-y-6">
          <form onSubmit={handleAddShowcase} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-brand-orange flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Student Work or Certificate Photo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Title / Description"
                value={newShowcase.title}
                onChange={(e) => setNewShowcase({ ...newShowcase, title: e.target.value })}
                required
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
              <input
                type="text"
                placeholder="Student Name / Batch"
                value={newShowcase.student_name}
                onChange={(e) => setNewShowcase({ ...newShowcase, student_name: e.target.value })}
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              />
              <select
                value={newShowcase.category}
                onChange={(e) => setNewShowcase({ ...newShowcase, category: e.target.value as any })}
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
              >
                <option value="work" className="bg-neutral-900 text-white">Student Creation (Poster / Ad Copy)</option>
                <option value="certificate" className="bg-neutral-900 text-white">Certificate Handover Photo</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Image URL (e.g. /assets/student-work.jpg or Unsplash link)"
              value={newShowcase.image_url}
              onChange={(e) => setNewShowcase({ ...newShowcase, image_url: e.target.value })}
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
            />
            <button type="submit" className="bg-brand-orange text-black font-bold px-5 py-2.5 rounded-xl uppercase font-mono text-xs">
              Add Showcase Item
            </button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {showcase.map((s) => (
              <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group relative">
                <img src={s.image_url} alt={s.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
                <div className="p-3 space-y-1">
                  <span className="text-[10px] font-mono uppercase bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded">
                    {s.category}
                  </span>
                  <h5 className="text-xs font-bold text-white truncate">{s.title}</h5>
                  <p className="text-[11px] text-white/50">{s.student_name}</p>
                </div>
                <button
                  onClick={() => handleDeleteShowcase(s.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. REGISTRATIONS TAB */}
      {activeSubTab === 'registrations' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-orange flex items-center gap-2">
              <Users className="w-5 h-5" /> Enrolled Participants ({registrations.length})
            </h2>
            <button
              onClick={exportCSV}
              disabled={registrations.length === 0}
              className="bg-emerald-500 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-400 transition-all font-mono text-xs uppercase disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-white/10 font-mono uppercase text-[10px] tracking-wider text-brand-orange">
                <tr>
                  <th className="p-3 rounded-l-xl">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3 rounded-r-xl">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {registrations.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 font-mono">
                    <td className="p-3 font-bold text-white">#{r.id}</td>
                    <td className="p-3 text-white font-sans font-medium">{r.name}</td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3">{r.phone}</td>
                    <td className="p-3 text-emerald-400">{r.whatsapp || r.phone}</td>
                    <td className="p-3 font-bold text-brand-orange">₹{r.amount}</td>
                    <td className="p-3 text-white/50 text-[10px]">{r.payment_id}</td>
                    <td className="p-3 text-white/40 text-[10px]">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}

                {registrations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-white/40 italic font-sans">
                      No student registrations recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
