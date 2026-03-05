const TechEcosystem = () => {
  const techs = ["React", "Node.js", "TypeScript", "Next.js", "Tailwind", "Framer Motion", "Three.js", "PostgreSQL", "Redis", "Docker", "AWS", "Google Cloud"];
  
  return (
    <div className="py-24 border-y border-white/5 bg-brand-gray overflow-hidden select-none">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-24 px-12">
            {techs.map((tech) => (
              <div key={tech} className="flex items-center gap-8">
                <span className="text-3xl font-display font-bold uppercase tracking-tighter text-white/10 hover:text-brand-orange transition-colors cursor-default">{tech}</span>
                <div className="w-2 h-2 rounded-full bg-brand-orange/20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechEcosystem;
