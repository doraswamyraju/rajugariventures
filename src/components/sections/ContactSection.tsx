import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';

const ContactSection = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '', service: 'General' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await axios.post('/api/leads', { ...formData, phone: '' }); // Added phone as empty string to match schema
      setStatus('success');
      setFormData({ name: '', email: '', message: '', service: 'General' });
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="py-48 bg-brand-black relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full grid-bg opacity-5 -z-10" />
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-32 items-start">
          <div>
            <h2 className="text-[12vw] font-display font-bold tracking-tighter leading-[0.75] uppercase mb-16">
              READY TO <br /> <span className="text-brand-orange">DOMINATE?</span>
            </h2>
            <p className="text-3xl text-white/40 uppercase leading-tight max-w-lg font-light italic font-serif mb-24">
              "The digital landscape is evolving. Don't just survive—conquer. Initiate your growth protocol today."
            </p>

            <div className="space-y-16">
              <div className="flex items-center gap-10 group cursor-pointer" data-cursor="Visit Us">
                <div className="w-24 h-24 rounded-3xl border border-white/10 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-black transition-all duration-500">
                  <Globe className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.5em] text-white/20 mb-3">Headquarters</p>
                  <p className="text-xl font-display font-bold uppercase leading-snug max-w-sm">Shop.No.38, 1st Floor, Tuda Complex, near Anna Canteen, Bairagi patteda, Tirupati, AP 517502</p>
                </div>
              </div>
              <div className="flex items-center gap-10 group cursor-pointer" data-cursor="Call Us">
                <div className="w-24 h-24 rounded-3xl border border-white/10 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-black transition-all duration-500">
                  <Mail className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.5em] text-white/20 mb-3">Direct Channel</p>
                  <p className="text-3xl font-display font-bold uppercase">7997991101</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-16 md:p-24 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-brand-orange" />
            <form onSubmit={handleSubmit} className="space-y-16">
              <div className="grid md:grid-cols-2 gap-16">
                <div className="space-y-6">
                  <label className="text-xs font-mono uppercase tracking-[0.5em] text-white/20">Identification</label>
                  <input
                    required
                    type="text"
                    placeholder="YOUR NAME"
                    className="w-full bg-transparent border-b-2 border-white/10 py-6 focus:border-brand-orange outline-none transition-colors font-display text-3xl uppercase"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-6">
                  <label className="text-xs font-mono uppercase tracking-[0.5em] text-white/20">Communication</label>
                  <input
                    required
                    type="email"
                    placeholder="YOUR EMAIL"
                    className="w-full bg-transparent border-b-2 border-white/10 py-6 focus:border-brand-orange outline-none transition-colors font-display text-3xl uppercase"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-6">
                <label className="text-xs font-mono uppercase tracking-[0.5em] text-white/20">Objective</label>
                <textarea
                  required
                  rows={4}
                  placeholder="BRIEF YOUR MISSION"
                  className="w-full bg-transparent border-b-2 border-white/10 py-6 focus:border-brand-orange outline-none transition-colors font-display text-3xl uppercase resize-none"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
              <button
                disabled={status === 'loading'}
                data-cursor="Send Mission"
                className="group w-full bg-brand-orange text-black py-10 rounded-[2rem] font-display font-bold text-4xl uppercase hover:bg-white transition-all duration-500 flex items-center justify-center gap-8"
              >
                {status === 'loading' ? 'Transmitting...' : 'Initiate Protocol'}
                <ArrowRight className="w-12 h-12 group-hover:translate-x-4 transition-transform" />
              </button>

              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="p-10 bg-green-500/10 border border-green-500/20 rounded-3xl text-center"
                  >
                    <p className="text-green-500 font-mono text-sm uppercase tracking-[0.4em]">Transmission Successful. Our team will respond shortly.</p>
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="p-10 bg-red-500/10 border border-red-500/20 rounded-3xl text-center"
                  >
                    <p className="text-red-500 font-mono text-sm uppercase tracking-[0.4em]">Transmission Failed. Please try again.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
