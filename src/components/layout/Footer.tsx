import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-[#1A1C2E] text-white py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                {/* Logo Section */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#E64833] transform rotate-45 rounded-sm" />
                    <span className="text-xl font-bold tracking-tight text-white">Ottolearn</span>
                </div>

                {/* Copyright */}
                <div className="text-sm text-slate-300/80">
                    © 2024 Ottolearn. All rights reserved.
                </div>

                {/* Links */}
                <div className="flex items-center gap-8 text-sm font-medium text-slate-300/80">
                    <button className="hover:text-white transition-colors">Privacy</button>
                    <button className="hover:text-white transition-colors">Terms</button>
                    <button className="hover:text-white transition-colors">Contact</button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
