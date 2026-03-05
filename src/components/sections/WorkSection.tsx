import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const PROJECTS = [
  { title: "Vortex UI", category: "Product Design", img: "https://picsum.photos/seed/vortex/1200/800", color: "#FF6B00" },
  { title: "Aether OS", category: "Web App", img: "https://picsum.photos/seed/aether/1200/800", color: "#00FF00" },
  { title: "Lumina", category: "Brand Identity", img: "https://picsum.photos/seed/lumina/1200/800", color: "#0000FF" },
  { title: "Nova", category: "AI Integration", img: "https://picsum.photos/seed/nova/1200/800", color: "#FF00FF" }
];

const WorkSection = () => {
  return (
    <section id="work" className="py-48 bg-brand-black overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 mb-32 flex flex-col lg:flex-row justify-between items-end gap-12">
        <h2 className="text-8xl md:text-[10vw] font-display font-bold tracking-tighter leading-none uppercase">
          SELECTED <br /> <span className="text-brand-orange">OUTPUT.</span>
        </h2>
        <div className="flex items-center gap-12">
          <p className="max-w-xs text-white/30 text-sm uppercase tracking-widest leading-relaxed">
            A curated selection of digital systems engineered for peak performance.
          </p>
          <button className="group w-24 h-24 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-black transition-all">
            <ArrowRight className="w-10 h-10" />
          </button>
        </div>
      </div>

      <div className="flex gap-12 px-6 md:px-12 overflow-x-auto no-scrollbar pb-20">
        {PROJECTS.map((project, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -20 }}
            className="flex-shrink-0 w-[90vw] md:w-[800px] group cursor-pointer"
            data-cursor="View Project"
          >
            <div className="aspect-[16/10] rounded-[4rem] overflow-hidden glass-card mb-12 relative">
              <img 
                src={project.img} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                alt={project.title}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-700" />
              <div className="absolute top-12 left-12">
                <span className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-xs font-mono uppercase tracking-widest border border-white/10">
                  0{i + 1}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center px-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.4em] text-brand-orange mb-4">{project.category}</p>
                <h3 className="text-5xl md:text-6xl font-display font-bold uppercase">{project.title}</h3>
              </div>
              <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-black transition-all">
                <ArrowUpRight className="w-10 h-10" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default WorkSection;
