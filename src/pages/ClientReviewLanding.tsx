import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Heart, Sparkles, Check, Edit3, X, ArrowRight } from 'lucide-react';

interface CampaignData {
  id?: number;
  name: string;
  slug: string;
  google_review_url: string;
  default_review?: string;
  logo_url?: string;
}

export default function ClientReviewLanding() {
  const params = useParams();
  const location = useLocation();

  // Extract slug from URL pathname (e.g., /vr_here_bms_review.html, /vr_here_bms_review, /review/vr_here_bms, /swarnaamahal_review.html)
  const getSlugFromLocation = (): string => {
    if (params.slug) return params.slug.replace(/_review(\.html)?$/, '').replace(/\.html$/, '');
    const pathname = location.pathname.replace(/^\//, '');
    const clean = pathname.replace(/_review(\.html)?$/, '').replace(/\.html$/, '').replace(/^review\//, '');
    return clean || 'swarnaamahal';
  };

  const currentSlug = getSlugFromLocation();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [targetUrl, setTargetUrl] = useState('https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetchCampaignDetails();
  }, [currentSlug]);

  const fetchCampaignDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/reviews/campaign/${currentSlug}`);
      if (res.data?.campaign) {
        setCampaign(res.data.campaign);
        if (res.data.campaign.google_review_url) {
          setTargetUrl(res.data.campaign.google_review_url);
        }
      }
    } catch (err) {
      console.warn('Could not load specific campaign details, using fallback', err);
      setCampaign({
        name: currentSlug.replace(/_/g, ' ').toUpperCase(),
        slug: currentSlug,
        google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJnyzeEwVLTToRY3uqd6ehc8M',
        default_review: 'Exceptional service and outstanding quality! Highly recommended.'
      });
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        // Fallback
      }
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
    return true;
  };

  const handleShareLove = async () => {
    if (claiming) return;
    setClaiming(true);

    let claimedText = campaign?.default_review || 'Exceptional service and outstanding quality! Highly recommended.';

    try {
      const res = await axios.post(`/api/reviews/campaign/${currentSlug}/claim`);
      if (res.data?.reviewText) {
        claimedText = res.data.reviewText;
      }
      if (res.data?.googleReviewUrl) {
        setTargetUrl(res.data.googleReviewUrl);
      }
    } catch (err) {
      console.warn('Failed to claim review from pool, falling back to default', err);
    } finally {
      setClaiming(false);
    }

    setReviewText(claimedText);
    setShowModal(true);
  };

  const handleProceedToGoogle = async () => {
    const textToCopy = reviewText.trim() || campaign?.default_review || 'Exceptional service! Highly recommended.';
    setRedirecting(true);
    await copyToClipboard(textToCopy);
    showToast('✓ Review copied! Opening Google Maps...');

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 700);
  };

  const clientName = campaign?.name || 'Customer Review';
  const logoUrl = campaign?.logo_url;

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col items-center justify-center p-4 selection:bg-brand-orange selection:text-black relative overflow-hidden font-sans">
      <Helmet>
        <title>{`Review ${clientName} | Share Your Love`}</title>
        <meta name="description" content={`Share your valuable 5-star review for ${clientName} on Google Maps.`} />
      </Helmet>

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-orange/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 right-10 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 left-10 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Card */}
        <div className="bg-[#121824]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Top subtle highlight */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-brand-orange to-yellow-500" />

          {/* Google Verified Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-white/90 mb-6 shadow-inner">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3.1l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.3C3.7 20 7.5 23 12 23z" />
            </svg>
            <span>Google Verified Review</span>
          </div>

          {/* Client Logo OR Client Business Name */}
          <div className="mb-6 flex flex-col items-center justify-center">
            {logoUrl ? (
              <div className="relative group p-2 mb-2">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-brand-orange/20 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                <img
                  src={logoUrl}
                  alt={`${clientName} logo`}
                  className="max-h-20 max-w-[220px] object-contain relative z-10 rounded-xl drop-shadow-lg"
                />
              </div>
            ) : null}

            <h1 className="text-2xl sm:text-3xl font-display font-extrabold uppercase tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
              {clientName}
            </h1>
          </div>

          {/* 5 Stars Rating */}
          <div className="text-amber-400 text-2xl tracking-[0.25em] mb-2 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
            ★ ★ ★ ★ ★
          </div>
          <p className="text-xs sm:text-sm text-white/60 mb-6 font-medium">
            Please take a moment to share your 5-star experience!
          </p>

          {/* 3 Step Guide */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-left mb-6 space-y-3">
            <div className="text-xs font-mono uppercase text-brand-orange font-bold flex items-center gap-1.5 tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              How it works
            </div>

            <div className="flex items-start gap-3 text-xs text-white/80">
              <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange font-bold flex items-center justify-center shrink-0 text-[11px] border border-brand-orange/30">
                1
              </span>
              <span>Tap <strong className="text-white">"Share your love"</strong> below</span>
            </div>

            <div className="flex items-start gap-3 text-xs text-white/80">
              <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange font-bold flex items-center justify-center shrink-0 text-[11px] border border-brand-orange/30">
                2
              </span>
              <span>Personalize or keep the <strong className="text-white">auto-generated review</strong></span>
            </div>

            <div className="flex items-start gap-3 text-xs text-white/80">
              <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange font-bold flex items-center justify-center shrink-0 text-[11px] border border-brand-orange/30">
                3
              </span>
              <span>In Google Maps: select <strong className="text-amber-400">5 Stars ★★★★★</strong> and <strong className="text-white">Paste!</strong></span>
            </div>
          </div>

          {/* Main Action Button */}
          <button
            onClick={handleShareLove}
            disabled={claiming}
            className="w-full py-4 px-6 bg-gradient-to-r from-brand-orange via-amber-500 to-yellow-500 hover:from-brand-orange/90 hover:to-yellow-400 text-black font-extrabold text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-brand-orange/30 hover:shadow-brand-orange/50 transition-all transform active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Heart className="w-5 h-5 fill-red-600 text-red-600 group-hover:scale-125 transition-transform" />
            <span>{claiming ? 'Loading Review...' : 'Share your love'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-white/40 font-mono">
          Powered by{' '}
          <a
            href="https://rajugariventures.com"
            target="_blank"
            rel="noreferrer"
            className="text-brand-orange hover:underline font-semibold"
          >
            Rajugari Ventures
          </a>
        </div>
      </div>

      {/* Review Customizer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121824] border border-white/20 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-brand-orange font-display font-bold text-lg uppercase">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Your 5-Star Review</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-white/60 text-xs sm:text-sm mb-4">
              We’ve prepared a customized review for you. Feel free to edit or add your own words!
            </p>

            <div className="bg-black/60 border border-white/15 rounded-2xl p-4 mb-4 relative focus-within:border-brand-orange transition-all">
              <div className="flex items-center justify-between text-[11px] text-white/50 font-mono uppercase mb-2">
                <span className="flex items-center gap-1 text-brand-orange">
                  <Edit3 className="w-3.5 h-3.5" />
                  Customize review
                </span>
                <span>{reviewText.length} characters</span>
              </div>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review here..."
                className="w-full bg-transparent text-white text-sm focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Proceed to Google Button */}
            <button
              onClick={handleProceedToGoogle}
              disabled={redirecting}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-orange via-amber-500 to-yellow-500 text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-brand-orange/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {redirecting ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Redirecting to Google...</span>
                </>
              ) : (
                <>
                  <span>Copy & Go to Google Review</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 text-center text-xs text-white/70">
              💡 In Google Maps: Tap <span className="text-amber-400 font-bold">5 Stars ⭐⭐⭐⭐⭐</span> and <span className="text-brand-orange font-bold">Paste</span>!
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 z-50 bg-brand-orange text-black font-bold px-6 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-mono flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
