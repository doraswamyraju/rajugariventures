import { motion } from 'motion/react';

const PROCESS = [
  { step: '01', title: 'Discovery', desc: 'We dive deep into your brand DNA and market landscape to find the hidden opportunities.' },
  { step: '02', title: 'Strategy', desc: 'Crafting a bespoke roadmap for digital dominance using data-driven insights.' },
  { step: '03', title: 'Execution', desc: 'Flawless technical and creative implementation by our expert engineers.' },
  { step: '04', title: 'Optimization', desc: 'Continuous data-driven refinement for peak performance and exponential growth.' }
];

const ProcessSection = () => {
  return (
    <section id="process" className="py-48 bg-brand-gray relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-10" />
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-32">
          <div className="sticky top-48 h-fit">
            <p className="text-brand-orange font-mono text-sm uppercase tracking-[0.6em] mb-10">The Methodology</p>
            <h2 className="text-8xl md:text-[8vw] font-display font-bold tracking-tighter leading-[0.85] uppercase mb-16">
              HOW WE <br /> <span className="italic font-light text-outline">OPERATE.</span>
            </h2>
            <p className="text-2xl text-white/40 leading-relaxed font-light italic font-serif max-w-md">
              "Our process is a surgical blend of technical precision and creative intuition."
            </p>
          </div>

          <div className="space-y-32">
            {PROCESS.map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative group"
              >
                <div className="text-[15rem] font-display font-bold text-white/5 absolute -top-32 -left-16 select-none group-hover:text-brand-orange/10 transition-colors duration-700">
                  {p.step}
                </div>
                <div className="relative z-10">
                  <h3 className="text-5xl md:text-7xl font-display font-bold uppercase mb-10 group-hover:text-brand-orange transition-colors duration-500">
                    {p.title}
                  </h3>
                  <p className="text-2xl text-white/50 leading-relaxed max-w-2xl font-light">
                    {p.desc}
                  </p>
                </div>
                <div className="mt-20 w-full h-[2px] bg-white/5 relative overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    whileInView={{ x: '0%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 bg-brand-orange"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
