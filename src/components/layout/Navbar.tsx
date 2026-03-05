import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Menu, X, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Work', path: '/portfolio' },
    { name: 'Process', path: '/process' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 py-6 px-6 md:px-12 flex justify-center",
        isScrolled ? "pt-4" : "pt-8"
      )}>
        <div className={cn(
          "w-full max-w-[1800px] flex justify-between items-center transition-all duration-500",
          isScrolled ? "bg-brand-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl shadow-black/50" : "bg-transparent px-0 py-0"
        )}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group cursor-pointer z-50">
            <div className="w-10 h-10 bg-brand-orange flex items-center justify-center text-black font-bold rounded-full group-hover:rotate-[15deg] transition-transform duration-500">
              <Zap className="w-5 h-5 fill-black" />
            </div>
            <span className="text-xl font-display font-bold tracking-tighter uppercase hidden md:block">
              Rajugari <span className="text-brand-orange">Ventures</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center bg-white/5 rounded-full px-2 py-2 border border-white/5 backdrop-blur-md">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-mono uppercase tracking-widest transition-all duration-300 relative overflow-hidden group",
                  location.pathname === item.path 
                    ? "bg-brand-orange text-black font-bold shadow-lg shadow-brand-orange/20" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="relative z-10">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            <Link 
              to="/contact"
              className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-xs font-mono uppercase tracking-widest font-bold hover:bg-brand-orange hover:scale-105 transition-all duration-300"
            >
              <span>Let's Talk</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-3 bg-white/10 rounded-full border border-white/10 text-white hover:bg-brand-orange hover:text-black transition-colors z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-brand-black/95 backdrop-blur-xl z-[900] flex flex-col justify-center px-8"
          >
            <div className="flex flex-col gap-8 max-w-lg mx-auto w-full">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link 
                    to={item.path}
                    className="group flex items-center justify-between border-b border-white/10 pb-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className={cn(
                      "text-5xl md:text-6xl font-display font-bold uppercase transition-colors duration-300",
                      location.pathname === item.path ? "text-brand-orange" : "text-white group-hover:text-white/50"
                    )}>
                      {item.name}
                    </span>
                    <ArrowRight className={cn(
                      "w-8 h-8 -rotate-45 group-hover:rotate-0 transition-transform duration-300",
                      location.pathname === item.path ? "text-brand-orange" : "text-white/20 group-hover:text-white"
                    )} />
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
              >
                <Link 
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full bg-brand-orange text-black py-6 rounded-2xl text-xl font-display font-bold uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-white transition-colors"
                >
                  Start Project <ArrowRight />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
