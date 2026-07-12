import React, { useState } from 'react';
import "./Home.css";
import CommunityPaymentButton from '../components/CommunityPaymentButton';
import ContactAndPrayerTimes from '../components/ContactAndPrayerTimes/ContactAndPrayerTimes';
import ImageGallery from '../components/ImageGallery';
import { useAuth } from '../components/context/authContext';

/* ─────────────────────────────────────────────
   GoldParticles – חלקיקי זהב לרקע
   ───────────────────────────────────────────── */
function GoldParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(15)].map((_, i) => (
        <div
          key={`dust-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 2 + 0.5}px`,
            height: `${Math.random() * 2 + 0.5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, rgba(255,233,160,0.8) 0%, rgba(207,167,86,0.3) 60%, transparent 100%)`,
            boxShadow: `0 0 ${Math.random() * 4 + 2}px rgba(207,167,86,0.6)`,
            animation: `floatDust ${4 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
      {[...Array(4)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${15 + i * 22}%`,
            top: `${20 + (i % 3) * 25}%`,
            background: `radial-gradient(circle, rgba(255,248,224,1) 0%, rgba(207,167,86,0.7) 40%, transparent 70%)`,
            borderRadius: '50%',
            boxShadow: `0 0 ${6 + i * 2}px rgba(247,217,138,0.8), 0 0 ${12 + i * 3}px rgba(207,167,86,0.4)`,
            animation: `sparklePulse ${2.5 + i * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

const Home = () => {
  const [isButtonTransparent, setIsButtonTransparent] = useState(false);
  const { isAdmin } = useAuth();

  const printDiv = async () => {
    setIsButtonTransparent(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    window.print();
  };

  return (
    <div
      className="home-hero text-center element-to-print"
      style={{
        backgroundImage: 'url("/1776676161060 (1).png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        width: '100%',
        position: 'relative',
        isolation: 'isolate',
      }}
    >
      {/* שכבת וינייטה כהה */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(13,35,64,0.55) 0%, transparent 65%),
            radial-gradient(ellipse at 50% 100%, rgba(13,35,64,0.7) 0%, transparent 65%),
            radial-gradient(ellipse at 20% 50%, rgba(13,35,64,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 50%, rgba(13,35,64,0.3) 0%, transparent 50%)
          `,
        }}
      />

      {/* חלקיקי זהב */}
      <GoldParticles />

      {/* תוכן מרכזי */}
      <div className="relative z-10 w-full flex flex-col items-center gap-6 px-4">
        {/* כותרת ראשית */}
        <div className="text-center mb-2">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wider"
            style={{
              fontFamily: "'Assistant', sans-serif",
              color: '#f7f4e9',
              textShadow: '0 0 30px rgba(207,167,86,0.5), 0 0 60px rgba(207,167,86,0.25), 0 4px 8px rgba(0,0,0,0.4)',
              letterSpacing: '0.05em',
            }}
          >
           בני הישיבות
          </h1>
          <div
            className="mx-auto mt-3"
            style={{
              width: '80px',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #cfa756, #f7d98a, #cfa756, transparent)',
              borderRadius: '2px',
              boxShadow: '0 0 12px rgba(207,167,86,0.6)',
            }}
          />
          <p
            className="mt-3 text-lg md:text-xl font-medium"
            style={{
              color: '#f7f4e9',
              opacity: 0.85,
              textShadow: '0 0 10px rgba(0,0,0,0.3)',
              fontFamily: "'Assistant', sans-serif",
            }}
          >
            קהילת רמת שלמה – ירושלים
          </p>
        </div>

        {/* קומפוננטות תוכן */}
        <ContactAndPrayerTimes isButtonTransparent={isButtonTransparent} />
        <CommunityPaymentButton />
      </div>
    </div>
  );
};

export default Home;