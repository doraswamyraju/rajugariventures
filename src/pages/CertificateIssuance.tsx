import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Award, Mail, CheckCircle2, AlertCircle, Sparkles, User, BookOpen, Send, Clock, ShieldCheck } from 'lucide-react';

const COURSES = [
  'Full Stack Web Development Masterclass',
  'Advanced AI & Machine Learning Bootcamp',
  'UI/UX Design & Brand Strategy Fundamentals',
  'Digital Marketing & Growth Hacking',
  'Cloud Architecture & DevOps Operations',
  'Other / Custom Workshop'
];

export default function CertificateIssuance() {
  const [formData, setFormData] = useState({
    name: '',
    course: COURSES[0],
    customCourse: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCourseName = formData.course === 'Other / Custom Workshop' 
    ? (formData.customCourse || 'Custom Training Workshop') 
    : formData.course;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please provide both your Name and Email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/certificates/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          course: selectedCourseName,
          email: formData.email.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit certificate request');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your certificate request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-[1200px] mx-auto min-h-screen text-white">
      <Helmet>
        <title>Request Digital Certificate | Rajugari Ventures</title>
        <meta name="description" content="Submit your details to request an official course completion certificate." />
      </Helmet>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-mono uppercase tracking-widest mb-6"
        >
          <Sparkles className="w-4 h-4" /> Official Credentials
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight mb-6"
        >
          Request Your <span className="text-brand-orange">Digital Certificate</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-lg md:text-xl font-light"
        >
          Submit your course completion details below. Our team will verify your request and email your official PDF certificate once approved.
        </motion.p>
      </div>

      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -z-10" />

          {submitted ? (
            <div className="py-8 text-center flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-display font-bold uppercase">Request Submitted!</h2>
              <p className="text-white/70 leading-relaxed max-w-md">
                Thank you, <strong className="text-white">{formData.name}</strong>. Your request for <strong className="text-brand-orange">{selectedCourseName}</strong> has been received.
              </p>

              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-left flex items-start gap-4">
                <Clock className="w-6 h-6 text-brand-orange shrink-0 mt-1" />
                <div className="text-sm">
                  <h4 className="font-bold text-white mb-1">What happens next?</h4>
                  <p className="text-white/60">
                    Our admin team will review and approve your submission. Once approved, your customized PDF certificate will be sent directly to <span className="text-brand-orange">{formData.email}</span>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', course: COURSES[0], customCourse: '', email: '' });
                }}
                className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-display font-bold uppercase mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                <Award className="w-6 h-6 text-brand-orange" /> Certificate Application Form
              </h2>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-orange" /> Full Name (As it should appear on Certificate)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doraswamy Raju"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-orange transition-all font-sans text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-orange" /> Course / Workshop Attended
                </label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-orange transition-all font-sans text-base"
                >
                  {COURSES.map((c) => (
                    <option key={c} value={c} className="bg-brand-black text-white">{c}</option>
                  ))}
                </select>
              </div>

              {formData.course === 'Other / Custom Workshop' && (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-2">
                    Specify Custom Course Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Masterclass in Mobile Engineering"
                    value={formData.customCourse}
                    onChange={(e) => setFormData({ ...formData, customCourse: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-orange transition-all font-sans text-base"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-orange" /> Email Address (To receive PDF upon approval)
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-orange transition-all font-sans text-base"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange hover:bg-white text-black font-display font-bold uppercase tracking-wider py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-brand-orange/20 disabled:opacity-50 cursor-pointer text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Submit Request for Approval
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-mono text-white/40 pt-2">
                <ShieldCheck className="w-4 h-4 text-brand-orange/70" />
                <span>Submitted certificates are verified by Rajugari Ventures admin team before issuance.</span>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
