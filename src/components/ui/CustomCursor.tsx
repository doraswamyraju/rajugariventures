import { useState, useEffect } from 'react';
import { motion, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState("");
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      const hoverEl = target.closest('[data-cursor]');
      if (hoverEl) {
        setIsHovering(true);
        setCursorText(hoverEl.getAttribute('data-cursor') || "");
      } else {
        setIsHovering(false);
        setCursorText("");
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const springConfig = { damping: 25, stiffness: 150 };
  const cursorX = useSpring(mousePos.x, springConfig);
  const cursorY = useSpring(mousePos.y, springConfig);

  return (
    <motion.div 
      className={cn(
        "fixed top-0 left-0 rounded-full mix-blend-difference pointer-events-none z-[9999] hidden md:flex items-center justify-center transition-all duration-300",
        isHovering ? "w-24 h-24 bg-brand-orange" : "w-6 h-6 bg-white"
      )}
      style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
    >
      {isHovering && (
        <span className="text-black font-display font-bold text-[10px] uppercase tracking-widest text-center px-2">
          {cursorText || <ArrowUpRight className="w-6 h-6" />}
        </span>
      )}
    </motion.div>
  );
};

export default CustomCursor;
