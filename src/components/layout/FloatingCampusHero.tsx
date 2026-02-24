import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface FloatingCampusHeroProps {
  onApply: () => void;
  onLogin: () => void;
}

const FloatingCampusHero: React.FC<FloatingCampusHeroProps> = ({ onApply, onLogin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [artifacts, setArtifacts] = useState<any[]>([]);

  // 1. Initialize floating artifacts (emojis)
  useEffect(() => {
    const emojiList = ['📚', '🎓', '💻', '✏️', '🧠', '🔬', '📊', '💡'];
    const newArtifacts = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
      top: `${Math.random() * 80 + 10}%`,
      fontSize: `${Math.random() * 1.5 + 1}rem`,
      duration: Math.random() * 20 + 30,
      delay: Math.random() * -50,
      opacity: Math.random() * 0.4 + 0.4,
      blur: Math.random() < 0.5 ? 'blur(2px)' : 'none'
    }));
    setArtifacts(newArtifacts);
  }, []);

  // 2. Canvas Constellation Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;
    let particles: Particle[] = [];
    let pulses: Pulse[] = [];
    const particleCount = 65;

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number;
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fill();
      }
    }

    class Pulse {
      start: Particle; end: Particle; progress: number; speed: number; dead: boolean;
      constructor(start: Particle, end: Particle) {
        this.start = start;
        this.end = end;
        this.progress = 0;
        this.speed = Math.random() * 0.02 + 0.01;
        this.dead = false;
      }
      update() {
        this.progress += this.speed;
        if (this.progress >= 1) this.dead = true;
      }
      draw() {
        if (!ctx) return;
        let currX = this.start.x + (this.end.x - this.start.x) * this.progress;
        let currY = this.start.y + (this.end.y - this.start.y) * this.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd700";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ffd700";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      particles = Array.from({ length: particleCount }).map(() => new Particle());
    };

    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();

            if (Math.random() > 0.9992) {
              pulses.push(new Pulse(particles[i], particles[j]));
            }
          }
        }
      }

      pulses.forEach((pulse, index) => {
        pulse.update();
        pulse.draw();
        if (pulse.dead) pulses.splice(index, 1);
      });

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className="relative w-full h-[100vh] overflow-hidden bg-gradient-to-b from-[#2b244d] via-[#e96d5b] to-[#ffc48c] flex items-center justify-center">
      {/* 1. Paint Effect SVG Filter */}
      <svg className="hidden">
        <defs>
          <filter id="paint-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="60" />
          </filter>
        </defs>
      </svg>

      {/* 2. Parallax Cloud Layers */}
      <div className="absolute inset-[-5%] w-[110%] h-[110%] pointer-events-none opacity-90 blur-sm optimize-gpu" style={{ filter: "url(#paint-filter)" }}>
        {/* Back Layer */}
        <motion.div
          animate={{ x: [0, '-50%'] }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[15%] left-0 w-[200%] h-[35vh] flex items-end opacity-80 will-change-transform"
        >
          <div className="w-1/2 h-full flex items-end">
            <div className="w-[80%] h-full bg-[#5d3b58] rounded-t-[50%] shadow-[15vw_5vh_0_-5vh_#5d3b58,30vw_-3vh_0_2vh_#5d3b58]" />
          </div>
          <div className="w-1/2 h-full flex items-end">
            <div className="w-[80%] h-full bg-[#5d3b58] rounded-t-[50%] shadow-[15vw_5vh_0_-5vh_#5d3b58,30vw_-3vh_0_2vh_#5d3b58]" />
          </div>
        </motion.div>

        {/* Mid Layer */}
        <motion.div
          animate={{ x: [0, '-50%'] }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-5%] left-0 w-[200%] h-[30vh] flex items-end mix-blend-hard-light will-change-transform"
        >
          <div className="w-1/2 h-full flex items-end">
            <div className="w-[80%] h-full bg-[#c65d56] rounded-t-[40%] shadow-[10vw_-8vh_0_4vh_#c65d56,35vw_5vh_0_-3vh_#c65d56]" />
          </div>
          <div className="w-1/2 h-full flex items-end">
            <div className="w-[80%] h-full bg-[#c65d56] rounded-t-[40%] shadow-[10vw_-8vh_0_4vh_#c65d56,35vw_5vh_0_-3vh_#c65d56]" />
          </div>
        </motion.div>

        {/* Front Layer */}
        <motion.div
          animate={{ x: [0, '-50%'] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-0 w-[200%] h-[25vh] flex items-end will-change-transform"
        >
          <div className="w-1/2 h-full flex items-end">
            <div className="w-[80%] h-full bg-[#ff9d76] rounded-t-[30%] shadow-[20vw_-5vh_0_5vh_#ff9d76,40vw_10vh_0_-5vh_#ff9d76]" />
          </div>
          <div className="w-1/2 h-full flex items-end">
            <div className="w-[80%] h-full bg-[#ff9d76] rounded-t-[30%] shadow-[20vw_-5vh_0_5vh_#ff9d76,40vw_10vh_0_-5vh_#ff9d76]" />
          </div>
        </motion.div>
      </div>

      {/* 3. Floating Artifacts (Emojis) */}
      <div className="absolute inset-0 pointer-events-none z-[5] perspective-[1000px] optimize-gpu">
        {artifacts.map((art) => (
          <motion.div
            key={art.id}
            initial={{ x: '110vw' }}
            animate={{
              x: ['110vw', '-110vw'],
              y: [0, -20, 0, 20, 0],
              rotate: [0, 10, -5, 5, 0],
              scale: [0.8, 1, 0.9, 1, 0.8]
            }}
            transition={{
              duration: art.duration,
              repeat: Infinity,
              delay: art.delay,
              ease: "linear"
            }}
            className="absolute will-change-transform"
            style={{
              top: art.top,
              fontSize: art.fontSize,
              opacity: art.opacity,
              filter: `drop-shadow(0 10px 20px rgba(0,0,0,0.3)) ${art.blur}`
            }}
          >
            {art.emoji}
          </motion.div>
        ))}
      </div>

      {/* 4. Constellation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      {/* 5. Hero Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-[1600px] mx-auto w-full gap-8 pt-24 lg:pt-32">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] tracking-tight"
            >
              Grow Your Teaching <br /><span className="bg-gradient-to-r from-[#ffd700] to-[#ff9d76] bg-clip-text text-transparent italic">Without Growing Your Workload.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed font-medium max-w-3xl mx-auto"
            >
              Ottolearn integrates student tracking, engagement, and growth workflows into a high-performance command layer. Focus on teaching—let the system handle the scale.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -3, boxShadow: "0 0 50px rgba(255,255,255,0.6)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onApply}
                className="bg-white text-[#2b244d] px-10 py-5 rounded-full font-black text-lg shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center gap-2 transition-all"
              >
                Get Early Access
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -3, backgroundColor: "rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://calendly.com', '_blank')}
                className="px-10 py-5 rounded-full font-black text-lg text-white border-2 border-white/50 backdrop-blur-sm transition-all flex items-center gap-2"
              >
                Watch a Demo
                <Sparkles className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FloatingCampusHero;
