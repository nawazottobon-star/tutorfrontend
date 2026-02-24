import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorNavbarProps {
  onApply: () => void;
  onLogin: () => void;
}

const TutorNavbar: React.FC<TutorNavbarProps> = ({ onApply, onLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Intelligence Gap', href: '#gap' },
    { name: 'Ecosystem', href: '#ecosystem' },
    { name: 'Journey', href: '#process' },
    { name: 'Impact', href: '#apply' },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4",
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-b border-[#1E3A47]/10 py-3"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 bg-[#B24531] rounded-xl flex items-center justify-center shadow-lg shadow-[#B24531]/20 group-hover:scale-110 transition-transform">
            <span className="text-white font-black text-xl">O</span>
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "font-black text-2xl tracking-tighter leading-none transition-colors",
              scrolled ? "text-[#1E3A47]" : "text-white"
            )}>
              Otto<span className="text-[#B24531]">learn</span>
            </span>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] mt-0.5",
              scrolled ? "text-[#1E3A47]/40" : "text-white/40"
            )}>
              Tutor Portal
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={cn(
                  "text-sm font-black uppercase tracking-widest hover:text-[#B24531] transition-colors relative group",
                  scrolled ? "text-[#1E3A47]" : "text-white"
                )}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#B24531] transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all",
                scrolled
                  ? "bg-[#1E3A47]/5 text-[#1E3A47] hover:bg-[#1E3A47]/10"
                  : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md"
              )}
            >
              <UserCircle size={18} />
              Login
            </button>
            <button
              onClick={onApply}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#B24531] text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#B24531]/30 hover:shadow-[#B24531]/50 hover:-translate-y-0.5 transition-all"
            >
              Join Now
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-xl transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X size={28} className={scrolled ? "text-[#1E3A47]" : "text-white"} />
          ) : (
            <Menu size={28} className={scrolled ? "text-[#1E3A47]" : "text-white"} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-[#1E3A47]/10 overflow-hidden lg:hidden shadow-2xl"
          >
            <div className="p-6 flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="text-lg font-black uppercase tracking-widest text-[#1E3A47] hover:text-[#B24531] transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-6 border-t border-[#1E3A47]/10">
                <button
                  onClick={() => {
                    onLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#1E3A47]/5 text-[#1E3A47] rounded-2xl font-black text-sm uppercase tracking-widest"
                >
                  <UserCircle size={20} />
                  Tutor Login
                </button>
                <button
                  onClick={() => {
                    onApply();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#B24531] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg"
                >
                  Apply Now
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default TutorNavbar;
