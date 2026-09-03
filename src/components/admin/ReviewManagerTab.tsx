import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Building2, 
  MessageSquareQuote, 
  CheckCircle2, 
  Clock, 
  UploadCloud,
  Layers,
  Settings
} from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  slug: string;
  google_review_url: string;
  default_review?: string;
  is_active: number;
  total_reviews?: number;
  unused_reviews?: number;
  used_reviews?: number;
}

interface ReviewItem {
  id: number;
  campaign_id: number;
  review_text: string;
  is_used: number;
  used_at: string | null;
  claimed_ip: string | null;
  created_at: string;
}

export default function ReviewManagerTab({ token }: { token: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'used'>('all');
  
  // Bulk upload & Form states
  const [bulkText, setBulkText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // New Campaign Modal / Drawer
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCamp, setNewCamp] = useState({
    name: '',
    slug: '',
    google_review_url: '',
    default_review: ''
  });

  // Edit Campaign State
  const [editingCamp, setEditingCamp] = useState<Campaign | null>(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampId) {
      fetchReviews(selectedCampId);
    } else {
      setReviews([]);
    }
  }, [selectedCampId]);

  const showNotification = (text: string, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 4000);
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/reviews/campaigns', authHeaders);
      setCampaigns(res.data || []);
      if (res.data && res.data.length > 0 && !selectedCampId) {
        setSelectedCampId(res.data[0].id);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showNotification('Admin session expired. Please log out from the bottom-left and log in again.', true);
      } else {
        showNotification('Failed to fetch campaigns: ' + (err.response?.data?.error || err.message), true);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (campId: number) => {
    try {
      const res = await axios.get(`/api/admin/reviews/campaigns/${campId}/reviews`, authHeaders);
      setReviews(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.name || !newCamp.slug || !newCamp.google_review_url) {
      showNotification('Please fill in Name, Slug, and Google Review URL', true);
      return;
    }
    try {
      const res = await axios.post('/api/admin/reviews/campaigns', newCamp, authHeaders);
      showNotification('Campaign created successfully!');
      setShowAddCampaign(false);
      setNewCamp({ name: '', slug: '', google_review_url: '', default_review: '' });
      await fetchCampaigns();
      if (res.data?.id) setSelectedCampId(res.data.id);
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to create campaign', true);
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCamp) return;
    try {
      await axios.put(`/api/admin/reviews/campaigns/${editingCamp.id}`, editingCamp, authHeaders);
      showNotification('Campaign updated successfully!');
      setEditingCamp(null);
      fetchCampaigns();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to update campaign', true);
    }
  };

  const handleDeleteCampaign = async (campId: number) => {
    if (!window.confirm('Are you sure you want to delete this client campaign and all its uploaded reviews?')) return;
    try {
      await axios.delete(`/api/admin/reviews/campaigns/${campId}`, authHeaders);
      showNotification('Campaign deleted');
      setSelectedCampId(null);
      fetchCampaigns();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to delete campaign', true);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedCampId) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      showNotification('Please paste at least one review line to upload', true);
      return;
    }
    setUploading(true);
    try {
      const res = await axios.post(`/api/admin/reviews/campaigns/${selectedCampId}/upload`, { reviews: lines }, authHeaders);
      showNotification(`Successfully added ${res.data.count || lines.length} reviews to the pool!`);
      setBulkText('');
      fetchReviews(selectedCampId);
      fetchCampaigns();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to upload reviews', true);
    } finally {
      setUploading(false);
    }
  };

  const handleResetReviews = async () => {
    if (!selectedCampId) return;
    if (!window.confirm('Reset all used reviews in this campaign back to "Available"?')) return;
    try {
      await axios.post(`/api/admin/reviews/campaigns/${selectedCampId}/reset`, {}, authHeaders);
      showNotification('All reviews in this campaign reset to Available!');
      fetchReviews(selectedCampId);
      fetchCampaigns();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to reset reviews', true);
    }
  };

  const handleDeleteReview = async (revId: number) => {
    try {
      await axios.delete(`/api/admin/reviews/item/${revId}`, authHeaders);
      setReviews(prev => prev.filter(r => r.id !== revId));
      fetchCampaigns();
    } catch (err: any) {
      showNotification('Failed to delete review', true);
    }
  };

  const currentCamp = campaigns.find(c => c.id === selectedCampId);
  const filteredReviews = reviews.filter(r => {
    if (filter === 'available') return r.is_used === 0;
    if (filter === 'used') return r.is_used === 1;
    return true;
  });

  const getCampaignPageUrl = (slug: string) => {
    const origin = window.location.origin;
    if (slug === 'swarnaamahal') {
      return `${origin}/swarnaamahal_review.html`;
    }
    return `${origin}/${slug}_review.html`;
  };

  const copyCampaignUrl = () => {
    if (!currentCamp) return;
    const url = getCampaignPageUrl(currentCamp.slug);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {msg && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
          msg.isError ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-white/40 hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* Campaign Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-brand-orange font-bold font-mono text-sm uppercase tracking-wider">
            <Building2 className="w-5 h-5" />
            <span>Select Client Campaign:</span>
          </div>

          <div className="relative">
            <select
              value={selectedCampId || ''}
              onChange={(e) => setSelectedCampId(Number(e.target.value))}
              className="bg-black/60 border border-white/20 text-white font-sans text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-orange pr-8 appearance-none cursor-pointer"
            >
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id} className="bg-neutral-900 text-white">
                  {camp.name} ({camp.slug})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50 text-xs">
              ▼
            </div>
          </div>

          {currentCamp && (
            <button
              onClick={() => setEditingCamp(currentCamp)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAddCampaign(true)}
          className="px-4 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-black font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-brand-orange/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Business
        </button>
      </div>

      {currentCamp && (
        <>
          {/* Stats Cards & Live Link */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-white/40 text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Total Reviews in Pool
              </div>
              <div className="text-3xl font-display font-bold text-white">
                {reviews.length}
              </div>
            </div>

            {/* Available */}
            <div className="bg-white/5 border border-green-500/20 rounded-2xl p-5">
              <div className="text-green-400/80 text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Available (Unused)
              </div>
              <div className="text-3xl font-display font-bold text-green-400">
                {reviews.filter(r => r.is_used === 0).length}
              </div>
            </div>

            {/* Used */}
            <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-5">
              <div className="text-purple-400/80 text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Claimed / Used
              </div>
              <div className="text-3xl font-display font-bold text-purple-300">
                {reviews.filter(r => r.is_used === 1).length}
              </div>
            </div>

            {/* Live Link */}
            <div className="bg-gradient-to-br from-brand-orange/15 to-white/5 border border-brand-orange/30 rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-brand-orange text-xs font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Customer Landing Page
              </div>
              <div className="text-xs text-white/70 font-mono truncate mb-2">
                {getCampaignPageUrl(currentCamp.slug)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyCampaignUrl}
                  className="flex-1 py-1.5 px-3 bg-brand-orange text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1 hover:bg-brand-orange/90 transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={getCampaignPageUrl(currentCamp.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bulk Upload Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-bold font-display uppercase flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-brand-orange" />
                  Bulk Upload Reviews for {currentCamp.name}
                </h3>
                <p className="text-white/50 text-xs font-mono mt-0.5">
                  Paste pre-written 5-star customer reviews (one review per line). Each review will be assigned to 1 customer click.
                </p>
              </div>

              <button
                onClick={handleResetReviews}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Used Reviews
              </button>
            </div>

            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste reviews here, one per line:&#10;1. Best jewellery designs and wonderful service at Shri Swarnaamahal Jewellers!&#10;2. Truly authentic gold hallmark and very courteous staff. Highly recommended!&#10;3. Amazing bridal collection and transparent billing."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-brand-orange font-sans placeholder:text-white/20"
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-mono text-white/40">
                {bulkText.split('\n').filter(l => l.trim().length > 0).length} reviews detected in text
              </span>
              <button
                onClick={handleBulkUpload}
                disabled={uploading || !bulkText.trim()}
                className="px-5 py-2.5 bg-brand-orange text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-orange/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-orange/20 transition-all flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                {uploading ? 'Adding...' : 'Add to Review Pool'}
              </button>
            </div>
          </div>

          {/* Review Inventory Table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-brand-orange" />
                <h4 className="font-display font-bold uppercase text-base">Review Inventory</h4>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'all' ? 'bg-brand-orange text-black font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  All ({reviews.length})
                </button>
                <button
                  onClick={() => setFilter('available')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'available' ? 'bg-green-500 text-black font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  Available ({reviews.filter(r => r.is_used === 0).length})
                </button>
                <button
                  onClick={() => setFilter('used')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'used' ? 'bg-purple-500 text-white font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  Used ({reviews.filter(r => r.is_used === 1).length})
                </button>
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/50 font-mono text-xs uppercase tracking-widest border-b border-white/10">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Review Text</th>
                  <th className="p-4 w-32">Status</th>
                  <th className="p-4 w-44">Used Timestamp</th>
                  <th className="p-4 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-sans text-sm">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-white/40 font-mono">
                      No reviews found under this filter. Paste some reviews above to get started!
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((rev, idx) => (
                    <tr key={rev.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-center font-mono text-xs text-white/40">
                        {idx + 1}
                      </td>
                      <td className="p-4 text-white font-normal">
                        "{rev.review_text}"
                      </td>
                      <td className="p-4">
                        {rev.is_used === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Clock className="w-3 h-3" /> Used
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Available
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs text-white/50">
                        {rev.used_at ? new Date(rev.used_at).toLocaleString() : '—'}
                        {rev.claimed_ip && (
                          <div className="text-[10px] text-white/30 truncate max-w-[140px]">{rev.claimed_ip}</div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal: Add New Business Campaign */}
      {showAddCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-display font-bold uppercase mb-1 text-brand-orange">Add New Review Campaign</h3>
            <p className="text-white/50 text-xs font-mono mb-6">Create a Google review collector for a new business client.</p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">Business / Client Name</label>
                <input
                  type="text"
                  required
                  value={newCamp.name}
                  onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                  placeholder="e.g. Shri Swarnaamahal Jewellers"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">URL Slug</label>
                <input
                  type="text"
                  required
                  value={newCamp.slug}
                  onChange={(e) => setNewCamp({ ...newCamp, slug: e.target.value })}
                  placeholder="e.g. swarnaamahal (page will be /swarnaamahal_review.html)"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">Google Maps Review Profile Link</label>
                <input
                  type="url"
                  required
                  value={newCamp.google_review_url}
                  onChange={(e) => setNewCamp({ ...newCamp, google_review_url: e.target.value })}
                  placeholder="https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">Default Fallback Review (When pool runs out)</label>
                <textarea
                  rows={2}
                  value={newCamp.default_review}
                  onChange={(e) => setNewCamp({ ...newCamp, default_review: e.target.value })}
                  placeholder="Outstanding collection, excellent service, and authentic gold purity. Highly recommended!"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddCampaign(false)}
                  className="px-4 py-2 text-xs font-mono uppercase text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-orange text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Campaign Settings */}
      {editingCamp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-bold uppercase text-brand-orange">Edit Campaign Settings</h3>
              <button
                onClick={() => handleDeleteCampaign(editingCamp.id)}
                className="text-red-400 hover:text-red-300 text-xs font-mono flex items-center gap-1 p-2 bg-red-500/10 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Campaign
              </button>
            </div>

            <form onSubmit={handleUpdateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">Business Name</label>
                <input
                  type="text"
                  required
                  value={editingCamp.name}
                  onChange={(e) => setEditingCamp({ ...editingCamp, name: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">URL Slug</label>
                <input
                  type="text"
                  required
                  value={editingCamp.slug}
                  onChange={(e) => setEditingCamp({ ...editingCamp, slug: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">Google Review Profile URL</label>
                <input
                  type="url"
                  required
                  value={editingCamp.google_review_url}
                  onChange={(e) => setEditingCamp({ ...editingCamp, google_review_url: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">Default Fallback Review</label>
                <textarea
                  rows={2}
                  value={editingCamp.default_review || ''}
                  onChange={(e) => setEditingCamp({ ...editingCamp, default_review: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCamp(null)}
                  className="px-4 py-2 text-xs font-mono uppercase text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-orange text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
