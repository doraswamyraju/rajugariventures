import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, CheckCircle2, Star, TrendingUp, Users, Zap, Globe, Shield, Smartphone, Code, Cpu, BarChart3, MessageSquare, ChevronDown, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const SectionHeading = ({ subtitle, title, align = 'center' }: { subtitle: string, title: string, align?: 'left' | 'center' }) => (
  <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <span className="text-brand-orange font-mono text-xs uppercase tracking-[0.2em] mb-4 block">{subtitle}</span>
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase leading-[0.9]">{title}</h2>
  </div>
);

const Home = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <>
      <Helmet>
        <title>Rajugari Ventures | Mobile-First Digital Growth</title>
        <meta name="description" content="We build high-performance digital experiences. Mobile-first web design, app development, and AI marketing solutions." />
      </Helmet>

      {/* 1. HERO SECTION */}
      <section ref={containerRef} className="relative min-h-[90vh] flex flex-col justify-center pt-24 pb-12 overflow-hidden bg-brand-black">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <motion.div style={{ y }} className="absolute inset-0 bg-gradient-to-b from-brand-orange/5 to-transparent opacity-50" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-white/70">Accepting New Projects</span>
            </motion.div>

            <h1 className="text-[15vw] md:text-[10vw] lg:text-[8vw] leading-[0.8] font-display font-bold mb-8 tracking-tighter uppercase">
              <motion.span 
                initial={{ y: 100, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="block text-white"
              >
                Digital
              </motion.span>
              <motion.span 
                initial={{ y: 100, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="block text-brand-orange"
              >
                Dominance
              </motion.span>
            </h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed font-light"
            >
              We engineer mobile-first experiences that convert. From high-speed websites to AI-powered marketing engines, we build for the future.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link 
                to="/contact"
                className="bg-brand-orange text-black px-8 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-white transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Start Growth <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/portfolio"
                className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-white/10 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              >
                View Work <Globe className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 flex flex-col items-center gap-2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* 2. CLIENT LOGOS (Social Proof) */}
      <section className="py-12 border-y border-white/5 bg-brand-gray/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-white/30">Trusted by Industry Leaders</p>
        </div>
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 px-8">
              {['TechCorp', 'Innovate', 'FutureSystems', 'GlobalScale', 'NextGen', 'AlphaWave'].map((client) => (
                <span key={client} className="text-2xl font-display font-bold uppercase text-white/10 hover:text-white/30 transition-colors cursor-default">
                  {client}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 3. VALUE PROPOSITION (Stats) */}
      <section className="py-24 bg-brand-black relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: "Projects Shipped", value: "150+", icon: Rocket },
              { label: "Client Growth", value: "300%", icon: TrendingUp },
              { label: "Team Experts", value: "25+", icon: Users },
              { label: "Global Awards", value: "12", icon: Star },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-white/5 rounded-2xl border border-white/5"
              >
                <stat.icon className="w-8 h-8 text-brand-orange mx-auto mb-4" />
                <h3 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">{stat.value}</h3>
                <p className="text-xs font-mono uppercase tracking-widest text-white/40">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SERVICES GRID (Mobile First Cards) */}
      <section className="py-32 bg-brand-black relative">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading subtitle="Our Expertise" title="Full-Stack Capabilities" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Mobile-First Web", desc: "Blazing fast websites designed for the thumb-scroll generation.", icon: Smartphone },
              { title: "App Development", desc: "Native iOS and Android apps that scale to millions of users.", icon: Code },
              { title: "AI Integration", desc: "Chatbots, automation, and predictive analytics for your business.", icon: Cpu },
              { title: "SEO Dominance", desc: "Rank #1 on Google with our data-driven organic strategies.", icon: BarChart3 },
              { title: "Brand Identity", desc: "Visual systems that stand out in a crowded digital landscape.", icon: Star },
              { title: "Growth Marketing", desc: "Paid acquisition campaigns that deliver measurable ROI.", icon: TrendingUp },
            ].map((service, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 bg-white/5 rounded-3xl border border-white/10 hover:border-brand-orange/50 transition-all hover:bg-white/10"
              >
                <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center text-brand-orange mb-6 group-hover:bg-brand-orange group-hover:text-black transition-colors">
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-bold uppercase mb-4">{service.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED WORK (Horizontal Scroll on Mobile) */}
      <section className="py-32 bg-brand-gray relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-16 flex justify-between items-end">
          <SectionHeading subtitle="Selected Work" title="Recent Deployments" align="left" />
          <Link to="/portfolio" className="hidden md:flex items-center gap-2 text-brand-orange uppercase font-bold tracking-widest text-xs hover:text-white transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 pb-12 no-scrollbar">
          {[
            { title: "Neon Finance", cat: "Fintech App", img: "https://picsum.photos/seed/fintech/600/800" },
            { title: "Urban Fit", cat: "E-commerce", img: "https://picsum.photos/seed/fitness/600/800" },
            { title: "Cyber Security", cat: "SaaS Platform", img: "https://picsum.photos/seed/cyber/600/800" },
            { title: "Eco Travel", cat: "Booking System", img: "https://picsum.photos/seed/travel/600/800" },
          ].map((project, i) => (
            <motion.div 
              key={i}
              className="snap-center flex-shrink-0 w-[85vw] md:w-[400px] group cursor-pointer"
            >
              <div className="aspect-[3/4] rounded-3xl overflow-hidden relative mb-6">
                <img src={project.img} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6">
                  <span className="text-brand-orange font-mono text-xs uppercase tracking-widest mb-2 block">{project.cat}</span>
                  <h3 className="text-3xl font-display font-bold uppercase">{project.title}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="px-6 md:hidden">
          <Link to="/portfolio" className="flex items-center justify-center gap-2 text-brand-orange uppercase font-bold tracking-widest text-xs border border-brand-orange/20 py-4 rounded-xl">
            View All Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 6. WHY CHOOSE US (Accordion/Grid) */}
      <section className="py-32 bg-brand-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeading subtitle="The Advantage" title="Why We Win" align="left" />
              <p className="text-xl text-white/60 mb-12 leading-relaxed">
                We don't just build software; we build business assets. Our approach combines technical excellence with aggressive growth strategies.
              </p>
              
              <div className="space-y-6">
                {[
                  "Mobile-First Architecture",
                  "AI-Driven Analytics",
                  "99.9% Uptime Guarantee",
                  "Conversion-Focused Design"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-6 h-6 text-brand-orange flex-shrink-0" />
                    <span className="text-lg font-bold uppercase">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-full bg-brand-orange/20 blur-[100px] absolute inset-0" />
              <div className="relative z-10 grid grid-cols-2 gap-4">
                <div className="space-y-4 mt-12">
                  <div className="aspect-[4/5] bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <img src="https://picsum.photos/seed/code/400/500" className="w-full h-full object-cover opacity-50" alt="Coding" />
                  </div>
                  <div className="aspect-square bg-brand-orange rounded-2xl flex items-center justify-center">
                    <Zap className="w-16 h-16 text-black" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="aspect-square bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                    <Shield className="w-16 h-16 text-white" />
                  </div>
                  <div className="aspect-[4/5] bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <img src="https://picsum.photos/seed/team/400/500" className="w-full h-full object-cover opacity-50" alt="Team" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="py-32 bg-brand-gray/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading subtitle="Client Feedback" title="Success Stories" />
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { text: "Rajugari Ventures transformed our mobile presence. Sales increased by 200% in 3 months.", author: "Sarah J.", role: "CEO, FashionNova" },
              { text: "The AI integration they built saved us 40 hours a week in customer support.", author: "Mike T.", role: "Founder, TechFlow" },
              { text: "Best development team we've worked with. On time, on budget, and incredible quality.", author: "Elena R.", role: "CTO, GreenEnergy" },
            ].map((testimony, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-brand-black rounded-3xl border border-white/10 relative"
              >
                <div className="text-brand-orange mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 inline-block fill-current" />)}
                </div>
                <p className="text-lg text-white/80 mb-8 leading-relaxed">"{testimony.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden">
                    <img src={`https://picsum.photos/seed/avatar${i}/100/100`} alt="Avatar" />
                  </div>
                  <div>
                    <p className="font-bold uppercase">{testimony.author}</p>
                    <p className="text-xs text-white/40 font-mono uppercase">{testimony.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="py-32 bg-brand-black">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeading subtitle="Common Questions" title="FAQ" />
          
          <div className="space-y-4">
            {[
              { q: "How long does a typical project take?", a: "Most websites take 4-6 weeks. Custom apps can take 3-6 months depending on complexity." },
              { q: "Do you offer post-launch support?", a: "Yes, we offer 24/7 maintenance packages to ensure your digital assets remain secure and updated." },
              { q: "What is your pricing model?", a: "We offer both fixed-price project quotes and monthly retainer models for ongoing growth partnerships." },
              { q: "Do you work with startups?", a: "Absolutely. We love helping founders build their MVP and scale to their first million users." },
            ].map((faq, i) => (
              <details key={i} className="group bg-white/5 rounded-2xl border border-white/10 open:bg-white/10 transition-all">
                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                  <span className="text-lg font-bold uppercase">{faq.q}</span>
                  <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-white/60 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9. BLOG PREVIEW */}
      <section className="py-32 bg-brand-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <SectionHeading subtitle="Insights" title="Latest Intel" align="left" />
            <Link to="/blog" className="hidden md:block text-brand-orange uppercase font-bold tracking-widest text-xs hover:text-white transition-colors mb-12">Read Blog</Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "The Future of AI in Marketing", date: "Mar 10, 2024", cat: "AI Trends" },
              { title: "Mobile-First Design Principles", date: "Mar 05, 2024", cat: "Design" },
              { title: "Scaling React Applications", date: "Feb 28, 2024", cat: "Engineering" },
            ].map((post, i) => (
              <Link key={i} to={`/blog/${i}`} className="group block">
                <div className="aspect-video bg-white/5 rounded-2xl border border-white/10 mb-6 overflow-hidden">
                  <img src={`https://picsum.photos/seed/blog${i}/600/400`} alt="Blog" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-4 mb-3 text-xs font-mono uppercase tracking-widest text-white/40">
                  <span>{post.date}</span>
                  <span className="w-1 h-1 bg-brand-orange rounded-full" />
                  <span className="text-brand-orange">{post.cat}</span>
                </div>
                <h3 className="text-2xl font-display font-bold uppercase group-hover:text-brand-orange transition-colors">{post.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-32 bg-brand-orange text-black relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10 mix-blend-multiply" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-[12vw] md:text-[8vw] font-display font-bold uppercase leading-[0.8] mb-8 tracking-tighter">
            Ready to <br /> Scale?
          </h2>
          <p className="text-xl md:text-2xl font-medium mb-12 max-w-2xl mx-auto opacity-80">
            Stop leaving money on the table. Let's build a digital presence that dominates your market.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/contact"
              className="bg-black text-white px-10 py-5 rounded-xl font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              Book Free Strategy Call <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/services"
              className="bg-transparent border-2 border-black text-black px-10 py-5 rounded-xl font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
