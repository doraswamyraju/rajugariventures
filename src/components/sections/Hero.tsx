import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Eye, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 500]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 5]);

  return (
    <section ref={containerRef} className="relative min-h-[120vh] flex flex-col justify-center pt-32 overflow-hidden bg-brand-black">
      <div className="absolute inset-0 grid-bg -z-10 opacity-20" />
      
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 w-full">
        <motion.div style={{ y, opacity, scale, rotate }} className="relative z-10">
          <div className="flex items-center gap-6 mb-16">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 60 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-[2px] bg-brand-orange" 
            />
            <span className="text-xs font-mono uppercase tracking-[0.6em] text-brand-orange">Boutique Digital Laboratory</span>
          </div>
          
          <h1 className="text-[16vw] lg:text-[14vw] leading-[0.75] font-display font-bold mb-20 tracking-tighter uppercase reveal-text">
            <motion.span 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              CRAFTING
            </motion.span>
            <motion.span 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="block text-outline italic font-serif font-light"
            >
              DIGITAL
            </motion.span>
            <motion.span 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="block text-brand-orange"
            >
              EMPIRES.
            </motion.span>
          </h1>
          
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-32 items-end">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="space-y-16"
            >
              <p className="max-w-3xl text-2xl md:text-4xl text-white/50 leading-tight font-light italic font-serif">
                "We don't just build websites. We engineer high-performance growth engines for brands that refuse to be ordinary."
              </p>
              <div className="flex flex-wrap gap-8">
                <Link 
                  to="/contact"
                  data-cursor="Start Now"
                  className="group bg-brand-orange text-black px-14 py-8 font-display font-bold text-2xl uppercase rounded-full hover:bg-white transition-all duration-500 flex items-center gap-6"
                >
                  Initiate Project <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
                </Link>
                <Link 
                  to="/portfolio"
                  data-cursor="Our Work"
                  className="group border border-white/20 text-white px-14 py-8 font-display font-bold text-2xl uppercase rounded-full hover:bg-white/10 transition-all duration-500 flex items-center gap-6"
                >
                  View Systems <Eye className="w-8 h-8" />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="hidden lg:block"
            >
              <div className="glass-card p-12 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-brand-orange" />
                <div className="flex justify-between items-start mb-12">
                  <Terminal className="w-10 h-10 text-brand-orange" />
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                <div className="space-y-6 font-mono text-xs text-white/40">
                  <p className="text-brand-orange">&gt; growth_protocol --initialize</p>
                  <p>&gt; scanning market_dynamics...</p>
                  <p>&gt; optimizing conversion_funnel [98%]</p>
                  <p className="text-green-500">&gt; status: DOMINANCE_ACHIEVED</p>
                </div>
                <div className="mt-12 pt-12 border-t border-white/10 flex justify-between items-center">
                  <div className="flex -space-x-4">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-4 border-brand-black bg-brand-gray overflow-hidden">
                        <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-mono text-white/30 uppercase tracking-widest">Live: 24 Systems Active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 opacity-30"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent" />
        <span className="text-[10px] font-mono uppercase tracking-[0.6em]">Scroll to Explore</span>
      </motion.div>
    </section>
  );
};

export default Hero;
