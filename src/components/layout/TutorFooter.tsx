import React from 'react';
import { motion } from 'framer-motion';
import {
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  Mail,
  ArrowRight,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const footerLinks = [
  {
    title: 'Platform',
    links: [
      { name: 'Intelligence Gap', href: '#gap' },
      { name: 'Ecosystem', href: '#ecosystem' },
      { name: 'The Journey', href: '#process' },
      { name: 'Impact', href: '#apply' },
    ]
  },
  {
    title: 'Resources',
    links: [
      { name: 'Tutor Guide', href: '#' },
      { name: 'Best Practices', href: '#' },
      { name: 'Earnings Calculator', href: '#' },
      { name: 'API Reference', href: '#' },
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Contact Support', href: '#' },
    ]
  }
];

const TutorFooter: React.FC = () => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#FDFCF0] border-t border-[#1E3A47]/5 pt-24 pb-12 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#B24531] rounded-xl flex items-center justify-center shadow-lg shadow-[#B24531]/20">
                <span className="text-white text-xl font-black">O</span>
              </div>
              <span className="text-2xl font-black text-[#1E3A47] tracking-tight">
                Ottolearn<span className="text-[#B24531]">.</span>
              </span>
            </div>
            <p className="text-[#1E3A47]/60 text-base font-medium leading-relaxed max-w-sm">
              Empowering professional tutors with intelligent tools, unified control, and direct action capabilities.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Linkedin, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Youtube, href: '#' },
                { icon: Instagram, href: '#' }
              ].map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.href}
                  whileHover={{ y: -3, backgroundColor: '#B24531', color: '#fff' }}
                  className="w-10 h-10 rounded-full border border-[#1E3A47]/10 flex items-center justify-center text-[#1E3A47]/40 transition-all"
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerLinks.map((column) => (
              <div key={column.title} className="flex flex-col gap-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A47]/30">
                  {column.title}
                </h4>
                <ul className="flex flex-col gap-4">
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        onClick={(e) => scrollToSection(e, link.href)}
                        className="text-[#1E3A47]/60 hover:text-[#B24531] font-bold text-sm transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-3">
            <div className="p-8 rounded-[2rem] bg-[#B24531]/5 border border-[#B24531]/10 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-black text-[#1E3A47]">Stay Updated</h4>
                <p className="text-xs font-medium text-[#1E3A47]/50 leading-relaxed">
                  Join our newsletter for the latest platform updates and tutor insights.
                </p>
              </div>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="w-full bg-white border border-[#1E3A47]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#1E3A47] placeholder-[#1E3A47]/20 focus:outline-none focus:ring-2 focus:ring-[#B24531]/20 transition-all"
                />
                <button className="absolute right-2 top-1.5 bottom-1.5 w-8 h-8 rounded-lg bg-[#B24531] text-white flex items-center justify-center shadow-lg shadow-[#B24531]/20 transition-transform active:scale-95">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-8 border-t border-[#1E3A47]/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#1E3A47]/30">
              <ShieldCheck size={14} className="text-[#B24531]/50" />
              <span>Enterprise Grade Security</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#1E3A47]/30">
              <Globe size={14} className="text-[#B24531]/50" />
              <span>Tutor Dashboard v1.2</span>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A47]/20">
            Ottolearn Tutor Platform © 2026 • Built for Performance
          </p>
        </div>
      </div>
    </footer>
  );
};

export default TutorFooter;
