import { Instagram, Twitter, Linkedin, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-brand-black pt-32 border-t border-white/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-orange/10 rounded-full blur-[100px]" />

      <div className="max-w-[1800px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* Top CTA Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 pb-24 border-b border-white/5">
          <div className="max-w-3xl">
            <h2 className="text-[10vw] md:text-[6vw] font-display font-bold uppercase leading-[0.8] tracking-tighter mb-8">
              Let's Build <br />
              <span className="text-brand-orange">The Future.</span>
            </h2>
            <p className="text-xl text-white/60 max-w-xl">
              Ready to dominate your market? We engineer digital experiences that convert visitors into loyal customers.
            </p>
          </div>
          <Link 
            to="/contact"
            className="group mt-12 md:mt-0 relative inline-flex items-center justify-center w-32 h-32 md:w-48 md:h-48 rounded-full bg-brand-orange text-black overflow-hidden transition-transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
            <span className="relative z-10 font-display font-bold text-lg md:text-xl uppercase tracking-widest group-hover:text-black transition-colors">
              Start <br /> Now
            </span>
            <ArrowUpRight className="absolute top-6 right-6 w-6 h-6 md:w-8 md:h-8 group-hover:rotate-45 transition-transform duration-500" />
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-24">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <Link to="/" className="block">
              <span className="text-3xl font-display font-bold uppercase tracking-tighter">
                Rajugari <span className="text-brand-orange">.</span>
              </span>
            </Link>
            <p className="text-white/50 leading-relaxed max-w-sm">
              A boutique digital laboratory specializing in high-performance web architecture, AI integration, and growth marketing.
            </p>
            <div className="flex gap-4">
              {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-orange hover:text-black hover:border-brand-orange transition-all duration-300 group"
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Explore</h3>
            <ul className="space-y-4">
              {['Home', 'Services', 'Portfolio', 'Process', 'About'].map((item) => (
                <li key={item}>
                  <Link to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className="text-white/60 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block uppercase font-medium text-sm tracking-wider">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-brand-orange">Services</h3>
            <ul className="space-y-4">
              {['Web Development', 'App Design', 'AI Solutions', 'SEO Growth', 'Branding'].map((item) => (
                <li key={item}>
                  <Link to="/services" className="text-white/60 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block uppercase font-medium text-sm tracking-wider">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4 space-y-8 bg-white/5 p-8 rounded-3xl border border-white/5">
            <h3 className="font-display text-2xl font-bold uppercase">Stay Ahead</h3>
            <p className="text-white/50 text-sm">Join our newsletter for the latest insights on AI, design, and digital growth.</p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-orange transition-colors"
                />
              </div>
              <button className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-brand-orange transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="grid md:grid-cols-3 gap-8 py-12 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-orange">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Headquarters</p>
              <p className="font-medium">Hyderabad, India</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-orange">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Email Us</p>
              <p className="font-medium">hello@rajugariventures.com</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-orange">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Call Us</p>
              <p className="font-medium">+91 98765 43210</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/30 font-mono uppercase tracking-wider pb-8">
          <p>© 2024 Rajugari Ventures. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
