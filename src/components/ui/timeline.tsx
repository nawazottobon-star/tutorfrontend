import {
  useScroll,
  useTransform,
  motion,
  AnimatePresence,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  badge: string;
  title: string;
  description: string;
  image: string;
}

export const Timeline = ({
  data,
  title,
  subline,
  badge
}: {
  data: TimelineEntry[];
  title?: React.ReactNode;
  subline?: string;
  badge?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 20%", "end 80%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full bg-transparent font-sans optimize-gpu"
      ref={containerRef}
    >
      {title && (
        <div className="max-w-[1400px] mx-auto pt-4 pb-6 px-6 md:px-12 text-center">
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-[10px] font-black uppercase tracking-[0.2em] bg-[#B24531]/10 text-[#B24531]"
            >
              {badge}
            </motion.div>
          )}
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-[#1E3A47]"
          >
            {title}
          </motion.h3>
          {subline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed text-[#1E3A47]/60"
            >
              {subline}
            </motion.p>
          )}
        </div>
      )}

      <div ref={ref} className="relative max-w-[1400px] mx-auto pb-12 md:pb-20 px-6 md:px-12">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col md:grid md:grid-cols-[100px_1fr_1fr] gap-0 md:gap-16 pt-4 md:pt-32 mb-12 md:mb-0"
          >
            {/* Column 1: Progress Line & Dot (Desktop Only) */}
            <div className="hidden md:flex relative flex-col items-center flex-shrink-0">
              <div className="sticky top-40 z-40 h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-[#1E3A47]/10 flex items-center justify-center shadow-sm">
                <div className="h-3 w-3 rounded-full bg-[#B24531]/40 border border-[#B24531]/20 p-2" />
              </div>
            </div>

            {/* Column 2: Text Content / Mobile Card */}
            <div className="flex flex-col items-start text-left bg-white/40 md:bg-transparent p-8 md:p-0 rounded-[2.5rem] md:rounded-none border border-white/40 md:border-none shadow-[0_20px_40px_-15px_rgba(30,58,71,0.05)] md:shadow-none backdrop-blur-md md:backdrop-blur-none transition-all duration-300">
              <div className="px-2 py-0.5 bg-white border border-[#1E3A47]/10 rounded-md mb-2 md:mb-4 inline-block shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B24531] md:text-[#1E3A47]/40">
                  {item.badge}
                </span>
              </div>

              <h3 className="text-4xl md:text-5xl font-black text-[#1E3A47]/10 md:text-[#1E3A47] tracking-tight mb-2 md:mb-1">
                {index + 1}<span className="text-[#B24531]">.</span>
              </h3>

              <h4 className="text-xl md:text-2xl font-black text-[#1E3A47] mb-3 md:mb-4 leading-tight">
                {item.title}
              </h4>

              <p className="text-[#1E3A47]/70 text-sm md:text-base font-medium leading-relaxed max-w-sm mb-6 md:mb-0">
                {item.description}
              </p>

              {/* Column 3: Image (Mobile Integrated) */}
              <div className="md:hidden w-full mt-2">
                <div className="w-full rounded-2xl overflow-hidden shadow-md border border-white/20">
                  <img
                    src={item.image}
                    className="w-full object-cover aspect-[16/10]"
                    alt={item.title}
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Image (Desktop Only) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="max-w-sm rounded-[2rem] overflow-hidden shadow-[0_24px_48px_-12px_rgba(30,58,71,0.1)] border border-[#1E3A47]/5 group hover:scale-[1.02] transition-transform duration-500">
                <img
                  src={item.image}
                  className="w-full object-cover aspect-auto"
                  alt={item.title}
                />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Vertical Spine (Desktop Only) */}
        <div
          style={{
            height: height + "px",
          }}
          className="hidden md:block absolute left-[calc(3rem+50px)] top-0 overflow-hidden w-[2px] bg-neutral-200 [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-[#B24531] rounded-full will-change-transform"
          />
        </div>
      </div>
    </div>
  );
};
