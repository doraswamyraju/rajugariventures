import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

const ValuesSection = () => {
  const values = [
    { title: "Radical Transparency", desc: "We believe in total honesty, from our pricing to our process. No hidden agendas, just results." },
    { title: "Technical Superiority", desc: "We don't just use tools; we master them. Our engineers are at the bleeding edge of digital tech." },
    { title: "Creative Disruption", desc: "Safe is boring. We push boundaries to ensure your brand doesn't just fit in, but stands out." }
  ];

  return (
    <section className="py-48 bg-brand-black border-t border-white/5">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-3 gap-16">
          {values.map((v, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="group p-16 glass-card hover:border-brand-orange/50 transition-all duration-700"
            >
              <div className="w-20 h-20 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-12 group-hover:bg-brand-orange group-hover:text-black transition-all duration-500">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-4xl font-display font-bold uppercase mb-8 group-hover:text-brand-orange transition-colors duration-500">{v.title}</h3>
              <p className="text-xl text-white/40 leading-relaxed font-light italic font-serif">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
