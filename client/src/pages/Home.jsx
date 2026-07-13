import React, { useState } from 'react';
import "./Home.css";
import CommunityPaymentButton from '../components/CommunityPaymentButton';
import ContactAndPrayerTimes from '../components/ContactAndPrayerTimes/ContactAndPrayerTimes';
import ImageGallery from '../components/ImageGallery';
import { useAuth } from '../components/context/authContext';
import GoldParticles from '../components/common/GoldParticles';

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