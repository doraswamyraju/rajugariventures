import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Code, Smartphone, Search, Cpu, MessageSquare, ArrowUpRight } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
  image: string;
}

const SERVICES: Service[] = [
  {
    id: 'digital-marketing',
    title: 'Growth Hacking',
    tag: 'Marketing',
    description: 'Data-driven strategies to scale your brand presence and ROI across all digital channels.',
    icon: <Rocket className="w-6 h-6" />,
    image: 'https://picsum.photos/seed/marketing/800/1000'
  },
  {
    id: 'web-dev',
    title: 'Web Engineering',
    tag: 'Development',
    description: 'Custom, high-performance websites built with modern technologies for seamless user experiences.',
    icon: <Code className="w-6 h-6" />,
    image: 'https://picsum.photos/seed/web/800/1000'
  },
  {
    id: 'app-dev',
    title: 'Mobile Systems',
    tag: 'Apps',
    description: 'Native and cross-platform mobile applications designed for engagement and scalability.',
    icon: <Smartphone className="w-6 h-6" />,
    image: 'https://picsum.photos/seed/apps/800/1000'
  },
  {
    id: 'local-seo',
    title: 'Local Dominance',
    tag: 'SEO',
    description: 'Dominate local search results and drive foot traffic to your physical locations.',
    icon: <Search className="w-6 h-6" />,
    image: 'https://picsum.photos/seed/seo/800/1000'
  },
  {
    id: 'ai-products',
    title: 'AI Intelligence',
    tag: 'Future',
    description: 'Leveraging cutting-edge AI to build intelligent solutions that automate and innovate.',
    icon: <Cpu className="w-6 h-6" />,
    image: 'https://picsum.photos/seed/ai/800/1000'
  },
  {
    id: 'whatsapp-api',
    title: 'Conversational API',
    tag: 'Communication',
    description: 'Official WhatsApp Business API integration for automated customer support and notifications.',
    icon: <MessageSquare className="w-6 h-6" />,
    image: 'https://picsum.photos/seed/whatsapp/800/1000'
  }
];

const ServicesSection = () => {
  const [activeService, setActiveService] = useState<string | null>(null);

  return (
    <section id="services" className="py-48 bg-brand-black relative">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-40 gap-16">
          <div className="max-w-4xl">
            <p className="text-brand-orange font-mono text-sm uppercase tracking-[0.6em] mb-10">System Capabilities</p>
            <h2 className="text-8xl md:text-[10vw] font-display font-bold tracking-tighter leading-[0.85] uppercase">
              OUR <span className="text-outline">CORE</span> <br />
              <span className="text-brand-orange">PROTOCOLS.</span>
            </h2>
          </div>
          <div className="max-w-sm text-right">
            <p className="text-white/40 text-lg uppercase leading-relaxed font-light italic font-serif">
              "We deploy advanced digital solutions tailored for exponential growth and technical superiority."
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-24 items-start">
          <div className="space-y-4">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.id}
                onMouseEnter={() => setActiveService(service.id)}
                onMouseLeave={() => setActiveService(null)}
                className="group py-12 border-b border-white/10 cursor-pointer flex justify-between items-center transition-all duration-500 hover:px-8"
                data-cursor="Explore"
              >
                <div className="flex items-center gap-12">
                  <span className="text-2xl font-mono text-white/20 group-hover:text-brand-orange transition-colors">0{i + 1}</span>
                  <h3 className="text-5xl md:text-7xl font-display font-bold uppercase group-hover:text-brand-orange transition-colors">
                    {service.title}
                  </h3>
                </div>
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-brand-orange group-hover:text-black transition-all">
                  <ArrowUpRight className="w-8 h-8" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="sticky top-48 hidden lg:block">
            <div className="aspect-[3/4] rounded-[3rem] overflow-hidden relative glass-card">
              <AnimatePresence mode="wait">
                {activeService ? (
                  <motion.img
                    key={activeService}
                    src={SERVICES.find(s => s.id === activeService)?.image}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                    className="w-full h-full object-cover"
                    alt="Service"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-20 text-center">
                    <p className="text-2xl font-display font-bold uppercase text-white/20 italic">Hover over a protocol to reveal its visual signature.</p>
                  </div>
                )}
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12 right-12">
                <AnimatePresence mode="wait">
                  {activeService && (
                    <motion.div
                      key={activeService + '-text'}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="space-y-4"
                    >
                      <p className="text-brand-orange font-mono text-xs uppercase tracking-widest">
                        [{SERVICES.find(s => s.id === activeService)?.tag}]
                      </p>
                      <p className="text-xl text-white/60 leading-relaxed">
                        {SERVICES.find(s => s.id === activeService)?.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
