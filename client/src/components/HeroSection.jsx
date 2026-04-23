import { useEffect, useState } from "react";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;700;900&display=swap');

        .hero-title {
          font-family: 'Frank Ruhl Libre', serif;
          font-weight: 900;
          background: linear-gradient(
            135deg,
            #f5e6b8 0%,
            #c9a84c 30%,
            #f5e6b8 50%,
            #b8860b 70%,
            #f5e6b8 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 5s ease 2s infinite;
        }

        .hero-title-glow::after {
          content: 'בני הישיבות';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #c9a84c, #f5e6b8);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: blur(20px);
          animation: glowPulse 3s ease 2s infinite;
          z-index: -1;
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.7; }
        }

        .rotate-star { animation: rotateStar 8s linear infinite; }
        @keyframes rotateStar {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .particle {
          position: fixed;
          border-radius: 50%;
          background: rgba(201,168,76,0.6);
          pointer-events: none;
          animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0%   { transform: translateY(100vh) rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <section
        dir="rtl"
        className="relative min-h-screen flex items-center justify-center bg-[#0a0a0f] overflow-hidden"
      >
        {/* Ambient glow orbs */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 600, height: 600,
            top: -100, left: "50%", transform: "translateX(-50%)",
            background: "radial-gradient(circle, rgba(180,140,60,0.25) 0%, transparent 70%)",
            filter: "blur(120px)",
            opacity: mounted ? 1 : 0,
            transition: "opacity 2s ease 0.3s",
          }}
        />
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 400, height: 400,
            bottom: -50, left: "20%",
            background: "radial-gradient(circle, rgba(100,80,200,0.15) 0%, transparent 70%)",
            filter: "blur(120px)",
            opacity: mounted ? 1 : 0,
            transition: "opacity 2s ease 0.8s",
          }}
        />

        {/* Corner ornaments */}
        {[
          "top-8 right-8",
          "top-8 left-8 scale-x-[-1]",
          "bottom-8 right-8 scale-y-[-1]",
          "bottom-8 left-8 scale-[-1]",
        ].map((pos, i) => (
          <svg
            key={i}
            viewBox="0 0 60 60"
            fill="none"
            className={`absolute w-14 h-14 ${pos}`}
            style={{
              opacity: mounted ? 0.4 : 0,
              transition: `opacity 1s ease ${2 + i * 0.1}s`,
            }}
          >
            <path d="M55 5 L5 5 L5 55" stroke="#c9a84c" strokeWidth="1.5" />
            <path d="M45 5 L5 45" stroke="#c9a84c" strokeWidth="0.5" opacity="0.4" />
            <circle cx="5" cy="5" r="3" fill="#c9a84c" />
          </svg>
        ))}

        {/* Content */}
        <div className="relative z-10 text-center px-6">

          {/* Top decorative line */}
          <div
            className="flex items-center justify-center gap-4 mb-8"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(-20px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s",
            }}
          >
            <span className="block w-1 h-1 rounded-full bg-[#c9a84c] opacity-60" />
            <span className="block h-px w-20" style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }} />
            <span className="block w-2 h-2 rotate-45 bg-[#c9a84c] shadow-[0_0_12px_rgba(201,168,76,0.8)]" />
            <span className="block h-px w-20" style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }} />
            <span className="block w-1 h-1 rounded-full bg-[#c9a84c] opacity-60" />
          </div>

          {/* Pre-title */}
          <p
            className="text-[#c9a84c] tracking-[6px] uppercase mb-5"
            style={{
              fontFamily: "'Frank Ruhl Libre', serif",
              fontWeight: 300,
              fontSize: 13,
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s",
            }}
          >
            ברוכים הבאים
          </p>

          {/* Main title */}
          <div className="relative inline-block">
            <h1
              className="hero-title hero-title-glow relative"
              style={{
                fontSize: "clamp(56px, 9vw, 110px)",
                lineHeight: 1,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
                transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 0.8s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.8s",
              }}
            >
              בני הישיבות
            </h1>
          </div>

          {/* Ornamental divider */}
          <div
            className="flex items-center justify-center gap-3 my-7"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 1.2s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 1.2s",
            }}
          >
            <span className="block h-px w-28" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)" }} />
            <span className="rotate-star text-[#c9a84c] text-sm opacity-80 inline-block">✦</span>
            <span className="block h-px w-28" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)" }} />
          </div>

          {/* Sub-title */}
          <p
            style={{
              fontFamily: "'Frank Ruhl Libre', serif",
              fontWeight: 300,
              fontSize: "clamp(16px, 2.2vw, 22px)",
              letterSpacing: 2,
              color: "rgba(245,230,184,0.6)",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 1.4s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 1.4s",
            }}
          >
            תורה · יראה · מסורת
          </p>

          {/* Bottom dots */}
          <div
            className="flex items-center justify-center gap-2 mt-10"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 1.6s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 1.6s",
            }}
          >
            {[
              "w-1 h-1 opacity-40",
              "w-1.5 h-1.5 opacity-70",
              "w-2 h-2 shadow-[0_0_10px_rgba(201,168,76,0.8)]",
              "w-1.5 h-1.5 opacity-70",
              "w-1 h-1 opacity-40",
            ].map((cls, i) => (
              <span key={i} className={`block rounded-full bg-[#c9a84c] ${cls}`} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}