import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { 
  Sparkles, CheckCircle2, Clock, Calendar, ShieldCheck, Star, 
  Play, Users, Award, ChevronRight, Zap, Check, Lock, ArrowRight,
  BookOpen, Laptop, Video, MessageSquare, HelpCircle, X
} from 'lucide-react';

export default function AIMasterclass() {
  const [courseData, setCourseData] = useState<any>({
    title: 'AI PRODUCTIVITY MASTERCLASS',
    subtitle: 'From Casual AI User to AI Power User in 5 Days',
    actual_price: 1499,
    offer_price: 499,
    start_date: '17th August 2026',
    timings: '6:00 PM to 7:00 PM Daily',
    zoom_link: 'https://zoom.us/j/sample-masterclass',
    whatsapp_link: 'https://chat.whatsapp.com/sample-masterclass'
  });
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [showcase, setShowcase] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'work' | 'certificate'>('work');
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', whatsapp: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);

  useEffect(() => {
    fetchLandingData();
  }, []);

  const fetchLandingData = async () => {
    try {
      const res = await axios.get('/api/masterclass/public');
      if (res.data.course) setCourseData(res.data.course);
      if (res.data.testimonials) setTestimonials(res.data.testimonials);
      if (res.data.showcase) setShowcase(res.data.showcase);
    } catch (err) {
      console.error('Failed to load landing data:', err);
    }
  };

  const handleEnrollClick = () => {
    setIsCheckoutOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create order
      const orderRes = await axios.post('/api/masterclass/create-order', {
        amount: courseData.offer_price,
        ...formData
      });

      // 2. Verify / Save payment registration
      const verifyRes = await axios.post('/api/masterclass/verify-payment', {
        ...formData,
        amount: courseData.offer_price,
        order_id: orderRes.data.orderId,
        payment_id: 'pay_sim_' + Date.now()
      });

      setPaymentSuccess(verifyRes.data);
    } catch (err) {
      console.error('Payment failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayModules = [
    {
      day: 'DAY 1',
      title: 'AI & PROMPT ENGINEERING',
      items: ['AI Fundamentals & Mindset', 'ChatGPT & Gemini Mastery', '30+ Practical Prompt Exercises', 'Zero-Shot vs Few-Shot Techniques']
    },
    {
      day: 'DAY 2',
      title: 'PRODUCTIVITY & OFFICE WORK',
      items: ['Automated Docs & Reports', 'Professional Email Writing', 'Excel Formula & Data Helper', 'PowerPoint Slide Creation with AI']
    },
    {
      day: 'DAY 3',
      title: 'CREATIVITY & MARKETING',
      items: ['AI Image Generation (Midjourney/Canva)', 'Social Media Post Planning', 'Posters & Banners Design', 'High-Converting Video & Ad Scripts']
    },
    {
      day: 'DAY 4',
      title: 'CAREER & BUSINESS SYSTEM',
      items: ['Resume & Cover Letter Polish', 'AI Interview Coach & Q&A', 'Business & Growth Planning', 'Industry Use Cases & Case Studies']
    },
    {
      day: 'DAY 5',
      title: 'WORKFLOWS & PERSONAL AI SYSTEM',
      items: ['Custom AI Workflows', 'Personal Prompt Library System', 'Essential AI Toolkit Suite', 'Build Your Personal AI Assistant']
    }
  ];

  return (
    <div className="min-h-screen bg-brand-black text-white font-sans selection:bg-brand-orange selection:text-black">
      <Helmet>
        <title>{courseData.title} | Rajugari Ventures</title>
        <meta name="description" content="5-Day Intensive AI Productivity Masterclass. Learn ChatGPT, Gemini, Canva, and AI Workflows to 10X your productivity!" />
      </Helmet>

      {/* TOP BRAND BAR */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-display font-black text-brand-orange tracking-wider">RAJUGARI VENTURES</span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-white/50 border-l border-white/20 pl-3">A Digital Marketing Agency</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" /> ISO Certified & MSME Registered
            </div>
            <button
              onClick={handleEnrollClick}
              className="bg-brand-orange text-black font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-mono hover:bg-white transition-all shadow-lg shadow-brand-orange/20"
            >
              Enroll ₹{courseData.offer_price}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-10 pb-20 overflow-hidden bg-gradient-to-b from-brand-orange/15 via-black to-brand-black">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-orange/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Value Prop & Pricing Hook */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-orange to-amber-500 text-black font-extrabold px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase shadow-xl">
                <Sparkles className="w-4 h-4" /> 5-Day Intensive Live Bootcamp
              </div>

              <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight uppercase leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-brand-orange">
                {courseData.title}
              </h1>

              <p className="text-lg md:text-xl font-mono text-brand-orange font-bold">
                "{courseData.subtitle}"
              </p>

              {/* Quick Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono uppercase text-white/80">
                <span className="flex items-center gap-2 bg-white/5 px-3 py-2.5 rounded-xl border border-white/10">
                  <Zap className="w-4 h-4 text-brand-orange shrink-0" /> 10X Productivity
                </span>
                <span className="flex items-center gap-2 bg-white/5 px-3 py-2.5 rounded-xl border border-white/10">
                  <BookOpen className="w-4 h-4 text-brand-orange shrink-0" /> 30+ AI Exercises
                </span>
                <span className="flex items-center gap-2 bg-white/5 px-3 py-2.5 rounded-xl border border-white/10">
                  <Award className="w-4 h-4 text-brand-orange shrink-0" /> Certificate Included
                </span>
              </div>

              {/* Offer Card */}
              <div className="bg-white/5 border border-brand-orange/40 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-white/50 uppercase block">Special Launch Price</span>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-black text-brand-orange font-display">₹{courseData.offer_price}/-</span>
                      <span className="text-base text-white/40 line-through font-mono">₹{courseData.actual_price}/-</span>
                      <span className="text-[10px] font-mono bg-red-500 text-white font-bold px-2 py-0.5 rounded uppercase">67% OFF</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 block">
                      ⚡ Unlimited Online Seats
                    </span>
                    <span className="text-[10px] font-mono text-white/40 block mt-1">Via Zoom Live Interactive</span>
                  </div>
                </div>

                <button
                  onClick={handleEnrollClick}
                  className="w-full bg-gradient-to-r from-brand-orange to-amber-500 hover:from-amber-500 hover:to-brand-orange text-black font-extrabold text-lg py-4 rounded-2xl font-mono uppercase tracking-wider transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-2xl shadow-brand-orange/30 flex items-center justify-center gap-2"
                >
                  Enroll Now for ₹{courseData.offer_price} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Column: Live Batch Poster Card & Schedule */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-neutral-900/90 border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl pointer-events-none" />

                <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                  <span className="text-xs font-mono text-brand-orange font-bold uppercase tracking-wider">Live Zoom Cohort</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-brand-orange text-black font-bold uppercase">
                    Daily 1 Hour
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="p-3 bg-brand-orange/20 rounded-xl text-brand-orange">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-white/50 uppercase block">Next Batch Starts</span>
                      <strong className="text-lg font-bold text-white">{courseData.start_date}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-mono text-white/50 uppercase block">Class Timings</span>
                      <strong className="text-lg font-bold text-white">{courseData.timings}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center text-xs font-mono text-white/60 space-y-1">
                  <p>Includes Live Doubts Clearance & Class Recaps</p>
                  <p className="text-[10px] text-brand-orange font-bold">Rajugari Ventures Certified Masterclass</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TRUST BADGES & GMB STAR RATING */}
      <section className="py-8 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-around gap-6">
            <div className="flex items-center gap-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">4.9 / 5.0 Google Rating</span>
                <span className="text-[11px] text-white/50 font-mono">Verified Student Reviews</span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs text-white/60">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-orange" /> ISO Certified</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-orange" /> MSME Registered</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-orange" /> #startupindia</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRAINER & INSTRUCTOR PROFILE SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-brand-orange/10 border border-brand-orange/30 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Trainer Image / Video Reel Card */}
            <div className="lg:col-span-5 relative group">
              <div className="relative rounded-2xl overflow-hidden border-2 border-brand-orange/40 shadow-2xl aspect-[4/5] bg-black">
                <img 
                  src={courseData.trainer_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"} 
                  alt={courseData.trainer_name || "Doraswamy Raju"} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Overlay Reel Trigger */}
                {courseData.trainer_reel_url && (
                  <button
                    onClick={() => setActiveVideoModal(courseData.trainer_reel_url)}
                    className="absolute inset-0 bg-black/40 hover:bg-black/20 flex flex-col items-center justify-center gap-3 transition-colors group/btn"
                  >
                    <div className="w-16 h-16 bg-brand-orange text-black rounded-full flex items-center justify-center shadow-2xl transform group-hover/btn:scale-110 transition-transform">
                      <Play className="w-8 h-8 fill-black ml-1" />
                    </div>
                    <span className="bg-black/80 text-white font-mono text-xs uppercase px-3 py-1.5 rounded-full border border-white/20">
                      Watch Trainer Intro Reel 🎬
                    </span>
                  </button>
                )}
              </div>

              {/* Stats Badge */}
              <div className="absolute -bottom-4 -right-4 bg-brand-orange text-black font-mono font-extrabold px-4 py-2 rounded-2xl shadow-xl text-xs uppercase">
                {courseData.trainer_experience || "5+ Years Exp | 10,000+ Trained"}
              </div>
            </div>

            {/* Trainer Content & Bio */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-brand-orange font-bold bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20">
                  Meet Your Lead Instructor
                </span>
                <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase">
                  {courseData.trainer_name || "Doraswamy Raju"}
                </h2>
                <p className="text-base font-mono text-brand-orange font-semibold">
                  {courseData.trainer_role || "Founder, Rajugari Ventures | AI & Automation Specialist"}
                </p>
              </div>

              <p className="text-white/80 leading-relaxed font-sans text-sm md:text-base">
                "{courseData.trainer_bio || "Empowering professionals, business owners, and job seekers with practical, real-world AI productivity workflows. Master ChatGPT, Gemini, and AI tools to save 15+ hours every week."}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-brand-orange uppercase block font-bold">Practical Teaching</span>
                  <span className="text-xs text-white/70">100% Hands-on, step-by-step prompt frameworks & live exercises.</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-xs font-mono text-brand-orange uppercase block font-bold">1-on-1 Doubt Clarification</span>
                  <span className="text-xs text-white/70">Live Q&A support during classes and dedicated WhatsApp group guidance.</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={handleEnrollClick}
                  className="bg-brand-orange text-black font-extrabold px-6 py-3 rounded-xl font-mono text-xs uppercase tracking-wider hover:bg-white transition-all shadow-lg shadow-brand-orange/20"
                >
                  Learn Directly From Doraswamy Raju →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5-DAY CURRICULUM SYLLABUS */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-brand-orange font-bold bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20">
            Comprehensive Curriculum
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-black uppercase">What You Will Learn In 5 Days</h2>
          <p className="text-white/60 font-mono text-sm">
            Practical • Hands-On • Real World Applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {dayModules.map((m, idx) => (
            <div 
              key={idx} 
              className="bg-white/5 border border-white/10 hover:border-brand-orange/50 rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-white/[0.07] group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold bg-brand-orange text-black px-2.5 py-1 rounded-lg">
                    {m.day}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">1 HOUR</span>
                </div>
                <h3 className="font-display font-bold text-base text-white group-hover:text-brand-orange transition-colors">
                  {m.title}
                </h3>
                <ul className="space-y-2 pt-2">
                  {m.items.map((item, i) => (
                    <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-brand-orange shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TARGET AUDIENCE & TOOLS COVERED */}
      <section className="py-16 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Who Can Join */}
          <div className="space-y-6 bg-white/5 border border-white/10 rounded-3xl p-8">
            <h3 className="text-2xl font-display font-bold text-brand-orange uppercase flex items-center gap-2">
              <Users className="w-6 h-6" /> Who Can Join?
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm font-medium text-white/80">
              {['Students', 'Employees & IT Pros', 'Business Owners', 'Freelancers', 'Job Seekers', 'Content Creators'].map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {cat}
                </div>
              ))}
            </div>
            <div className="bg-brand-orange/10 border border-brand-orange/30 p-4 rounded-2xl text-center">
              <span className="text-xs font-mono font-bold text-brand-orange uppercase">⚡ NO TECHNICAL BACKGROUND REQUIRED!</span>
            </div>
          </div>

          {/* Tools Covered */}
          <div className="space-y-6 bg-white/5 border border-white/10 rounded-3xl p-8">
            <h3 className="text-2xl font-display font-bold text-brand-orange uppercase flex items-center gap-2">
              <Laptop className="w-6 h-6" /> Tools & AI Suite Covered
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { name: 'ChatGPT', role: 'Prompts & Writing' },
                { name: 'Gemini', role: 'Research & Docs' },
                { name: 'Canva AI', role: 'Design & Banners' },
                { name: 'Google Suite', role: 'Excel & Slides' },
              ].map((tool, idx) => (
                <div key={idx} className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-white block text-sm">{tool.name}</span>
                  <span className="text-[10px] text-white/40 font-mono block">{tool.role}</span>
                </div>
              ))}
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center text-xs font-mono text-white/60">
              LEARN • APPLY • AUTOMATE • ACCELERATE
            </div>
          </div>

        </div>
      </section>

      {/* STUDENT SHOWCASE & CERTIFICATE GALLERY */}
      <section className="py-20 max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-brand-orange font-bold bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20">
            Real Proof & Results
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-black uppercase">Student Creations & Certificates</h2>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('work')}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all ${
              activeTab === 'work' ? 'bg-brand-orange text-black font-bold' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Student AI Designs
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all ${
              activeTab === 'certificate' ? 'bg-brand-orange text-black font-bold' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Certificate Handover Photos
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {showcase.filter(s => s.category === activeTab).map((item) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-brand-orange/50 transition-all">
              <div className="h-48 overflow-hidden bg-black">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                <p className="text-xs text-brand-orange font-mono">{item.student_name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STUDENT REVIEWS & VIDEO TESTIMONIALS */}
      <section className="py-20 bg-white/[0.02] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-brand-orange font-bold bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20">
              Student Experiences
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase">What Our Students Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-lg">{t.name}</h4>
                    <span className="text-xs font-mono text-brand-orange">{t.role}</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-white/80 text-sm italic font-sans">"{t.review_text}"</p>

                {t.type === 'video' && t.media_url && (
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveVideoModal(t.media_url)}
                      className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 py-3 rounded-xl font-mono text-xs uppercase flex items-center justify-center gap-2 transition-all"
                    >
                      <Play className="w-4 h-4 fill-purple-300" /> Watch Video Testimonial
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA & SCARCITY */}
      <section className="py-20 bg-gradient-to-t from-brand-orange/20 to-black text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tight">
            Master AI Today. Transform Your Tomorrow!
          </h2>
          <p className="text-lg text-white/70 font-mono">
            Join the next batch starting <strong>{courseData.start_date}</strong>. Get instant access to Zoom class invites upon registration.
          </p>
          <div className="pt-4">
            <button
              onClick={handleEnrollClick}
              className="bg-brand-orange text-black font-extrabold text-xl px-10 py-5 rounded-2xl font-mono uppercase tracking-wider hover:bg-white transition-all shadow-2xl shadow-brand-orange/40 transform hover:scale-105"
            >
              Enroll Now for ₹{courseData.offer_price} Only
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 bg-black text-center text-xs font-mono text-white/40 space-y-2">
        <p>© 2026 Rajugari Ventures. All rights reserved. Tirupati, Andhra Pradesh.</p>
        <p className="flex justify-center gap-4">
          <span>ISO Certified</span> • <span>MSME Registered</span> • <span>#startupindia</span>
        </p>
      </footer>

      {/* STICKY BOTTOM MOBILE CTA BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-3 z-50 backdrop-blur-lg flex items-center justify-between">
        <div>
          <span className="text-xs text-white/50 block font-mono">Starts 17th Aug</span>
          <span className="text-xl font-bold text-brand-orange font-display">₹{courseData.offer_price}/-</span>
        </div>
        <button
          onClick={handleEnrollClick}
          className="bg-brand-orange text-black font-bold px-6 py-2.5 rounded-xl font-mono text-xs uppercase shadow-lg"
        >
          Enroll Now
        </button>
      </div>

      {/* VIDEO MODAL */}
      {activeVideoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/20 rounded-3xl w-full max-w-4xl overflow-hidden relative shadow-2xl">
            <button
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full hover:bg-brand-orange hover:text-black z-20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {activeVideoModal.includes('/uploads/') || activeVideoModal.endsWith('.mp4') || activeVideoModal.endsWith('.webm') || activeVideoModal.endsWith('.mov') ? (
                <video
                  src={activeVideoModal}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={activeVideoModal}
                  title="Video Player"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/20 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => { setIsCheckoutOpen(false); setPaymentSuccess(null); }}
              className="absolute top-5 right-5 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!paymentSuccess ? (
              <>
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase text-brand-orange font-bold">Checkout</span>
                  <h3 className="text-2xl font-display font-bold uppercase text-white">Enroll in AI Masterclass</h3>
                  <p className="text-xs text-white/50 font-mono">
                    Total Amount: <strong className="text-brand-orange">₹{courseData.offer_price}</strong> (Batch: {courseData.start_date})
                  </p>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-white/60">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-white/60">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-white/60">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-white/60">WhatsApp Number (for Zoom Links)</label>
                    <input
                      type="tel"
                      required
                      placeholder="WhatsApp number"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-orange focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-orange text-black font-extrabold py-4 rounded-xl font-mono uppercase tracking-wider hover:bg-white transition-all shadow-xl disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing Payment...' : `Proceed to Pay ₹${courseData.offer_price}`}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold text-emerald-400 uppercase">Registration Successful!</h3>
                  <p className="text-xs font-mono text-white/70">
                    Welcome to the AI Masterclass batch starting <strong>{courseData.start_date}</strong>.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <a
                    href={paymentSuccess.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 rounded-xl font-mono text-sm uppercase flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    Join WhatsApp Batch Group <MessageSquare className="w-4 h-4" />
                  </a>

                  <a
                    href={paymentSuccess.zoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs py-3 rounded-xl uppercase flex items-center justify-center gap-2 border border-white/10"
                  >
                    Open Live Zoom Link <Video className="w-4 h-4 text-purple-400" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
