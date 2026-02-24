import React from 'react';
import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight } from 'lucide-react';

const OfferingsNavbar: React.FC = () => {
    const [location, setLocation] = useLocation();

    const getLinkClass = (path: string) => {
        return location === path
            ? "text-sm font-bold text-white bg-[#1A1C2E] px-6 py-2 rounded-full shadow-sm transition-all"
            : "text-sm font-medium text-slate-500 hover:text-[#1A1C2E] hover:bg-slate-100/50 px-6 py-2 rounded-full transition-all";
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 py-3 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setLocation('/')}
                        className="group flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium text-xs uppercase tracking-wider"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Back to Home
                    </button>

                    <div className="hidden md:flex items-center text-gray-300">
                        <span className="h-4 w-px bg-gray-200 mx-2"></span>
                    </div>

                    <div className="hidden md:flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-900 tracking-tight">Ottolearn</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">Offerings</span>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-end gap-2 md:gap-4 overflow-x-auto no-scrollbar ml-4">
                    <button onClick={() => setLocation('/offerings/cohort')} className={`${getLinkClass('/offerings/cohort')} whitespace-nowrap`}>
                        Cohort
                    </button>
                    <button onClick={() => setLocation('/offerings/on-demand')} className={`${getLinkClass('/offerings/on-demand')} whitespace-nowrap`}>
                        On-Demand
                    </button>
                    <button onClick={() => setLocation('/offerings/workshops')} className={`${getLinkClass('/offerings/workshops')} whitespace-nowrap`}>
                        Workshops
                    </button>
                </div>


            </div>
        </nav>
    );
};

export default OfferingsNavbar;
