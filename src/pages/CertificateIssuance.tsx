import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Award, Download, Mail, CheckCircle2, AlertCircle, Sparkles, User, BookOpen, Send, ShieldCheck } from 'lucide-react';

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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedCert, setIssuedCert] = useState<{
    id: string;
    pdfUrl?: string;
    pdfBase64?: string;
    emailSent: boolean;
    simulatedEmail?: boolean;
  } | null>(null);

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
    setSuccess(false);

    try {
      const response = await fetch('/api/certificates/issue', {
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
        throw new Error(data.error || 'Failed to issue certificate');
      }

      setIssuedCert({
        id: data.certId,
        pdfBase64: data.pdfBase64,
        emailSent: data.emailSent,
        simulatedEmail: data.simulatedEmail
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while issuing your certificate.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!issuedCert?.pdfBase64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${issuedCert.pdfBase64}`;
    link.download = `Certificate_${formData.name.replace(/\s+/g, '_')}_${issuedCert.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-[1800px] mx-auto min-h-screen text-white">
      <Helmet>
        <title>Digital Certificate Generator | Rajugari Ventures</title>
        <meta name="description" content="Generate and receive your official course completion certificate instantly." />
      </Helmet>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
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
          Claim Your <span className="text-brand-orange">Digital Certificate</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-lg md:text-xl font-light"
        >
          Enter your details below to generate a verified, customized PDF certificate sent straight to your email.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Form Column */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -z-10" />

          <h2 className="text-2xl font-display font-bold uppercase mb-6 flex items-center gap-3">
            <Award className="w-6 h-6 text-brand-orange" /> Certificate Request Form
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex flex-col gap-4">
              <div className="flex items-center gap-3 font-semibold text-base">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Certificate Issued Successfully!
              </div>
              <p className="text-emerald-300/80 leading-relaxed">
                {issuedCert?.emailSent 
                  ? `Your official certificate PDF has been generated and emailed to ${formData.email}.`
                  : `Your certificate PDF is generated and ready for instant download!`
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Download className="w-4 h-4" /> Download PDF Now
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-orange" /> Full Name (As printed on Certificate)
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
                <Mail className="w-4 h-4 text-brand-orange" /> Email Address (To receive PDF)
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-white text-black font-display font-bold uppercase tracking-wider py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-brand-orange/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Generating & Emailing PDF...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Generate & Send Certificate
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Live Preview Column */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-7 flex flex-col items-center"
        >
          <div className="w-full mb-4 flex items-center justify-between px-2">
            <span className="text-xs font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-orange" /> Live Certificate Preview
            </span>
            <span className="text-xs font-mono text-brand-orange/80">Format: Official PDF</span>
          </div>

          {/* Certificate Mockup Canvas/Card */}
          <div className="w-full bg-stone-900 border-4 border-amber-500/40 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center text-center aspect-[1.4/1]">
            {/* Background Ornaments */}
            <div className="absolute inset-2 border border-amber-500/20 rounded-xl pointer-events-none" />
            <div className="absolute inset-4 border border-dashed border-amber-500/15 rounded-lg pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header / Seal */}
            <div className="mb-6 flex flex-col items-center">
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 to-yellow-400 rounded-full flex items-center justify-center shadow-xl border-2 border-stone-900 mb-2">
                <Award className="w-8 h-8 text-black" />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-400/90 font-semibold">
                Rajugari Ventures
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-2xl md:text-4xl text-amber-100 font-bold uppercase tracking-wider mb-2">
              Certificate of Completion
            </h3>
            <p className="text-xs font-serif italic text-amber-200/60 mb-6">
              This is to proudly certify that
            </p>

            {/* Recipient Name */}
            <div className="w-full border-b border-amber-500/30 pb-3 mb-6">
              <h2 className="font-serif text-3xl md:text-5xl text-amber-400 font-bold capitalize tracking-wide transition-all min-h-[48px]">
                {formData.name.trim() || 'Your Name Here'}
              </h2>
            </div>

            {/* Course Details */}
            <p className="text-xs font-serif text-amber-200/60 mb-2">
              has successfully completed the professional training course in
            </p>
            <h4 className="font-sans text-lg md:text-2xl text-white font-semibold mb-8 max-w-md">
              {selectedCourseName}
            </h4>

            {/* Footer / Signatures */}
            <div className="mt-auto w-full flex items-end justify-between text-left text-amber-200/50 text-[10px] font-mono border-t border-amber-500/20 pt-4">
              <div>
                <p className="text-white/80 font-bold uppercase">Date Issued</p>
                <p>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <div className="text-center">
                <div className="font-serif text-base text-amber-300 font-bold italic mb-1">Doraswamy Raju</div>
                <p className="text-white/60 uppercase text-[9px] border-t border-amber-500/40 pt-1">Authorized Signatory</p>
              </div>

              <div className="text-right">
                <p className="text-white/80 font-bold uppercase">Verify ID</p>
                <p className="tracking-widest">RJV-CERT-{Math.floor(100000 + Math.random() * 900000)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
