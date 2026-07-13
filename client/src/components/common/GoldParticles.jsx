import './headerAnimations.css';

export default function GoldParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(18)].map((_, i) => (
        <div
          key={`dust-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 2 + 0.5}px`,
            height: `${Math.random() * 2 + 0.5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background:
              'radial-gradient(circle, rgba(255,233,160,.9) 0%, rgba(207,167,86,.5) 60%, transparent 100%)',
            boxShadow: '0 0 8px rgba(207,167,86,.8)',
            animation: `floatDust ${4 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      {[...Array(5)].map((_, i) => (
        <div
          key={`spark-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${5 + i * 2}px`,
            height: `${5 + i * 2}px`,
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
            background:
              'radial-gradient(circle,#fff8e0 0%,#cfa756 45%,transparent 70%)',
            boxShadow: '0 0 15px rgba(247,217,138,.9)',
            animation: `sparklePulse ${2.5 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}
