import React, { useState } from 'react';
import "./Home.css"; // ודא שנתיב הקובץ נכון
import CommunityPaymentButton from '../components/CommunityPaymentButton';
import ContactAndPrayerTimes from '../components/ContactAndPrayerTimes/ContactAndPrayerTimes'; // ודא שנתיב הקומפוננטה נכון
import ImageGallery from '../components/ImageGallery';
import { useAuth } from '../components/context/authContext';

const Home = () => {
  const [isButtonTransparent, setIsButtonTransparent] = useState(false);
  const { isAdmin } = useAuth();

  // הפונקציה printDiv צריכה להיות מוגדרת בתוך הקומפוננטה
  const printDiv = async () => {
    setIsButtonTransparent(true);

    // המתן לרגע שה-DOM יתעדכן לפני ההדפסה
    await new Promise(resolve => setTimeout(resolve, 0));

    // רק אחרי ש-React סיים לעדכן את ה-DOM, תתחיל את ההדפסה
    window.print();

    // אופציונלי: החזר את השקיפות לאחר ההדפסה
    // setTimeout(() => {
    //   setIsButtonTransparent(false);
    // }, 1000);
  };


  return (
    <div
      className="text-center element-to-print"
      style={{
        backgroundImage: 'url("/1776676161060 (1).png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '300px', // Add minimal height so that the image is visible
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white', // Text color
        width: '100%', // ← הוסף את זה

      }}
    >
      {/* <ImageGallery /> */}
      <ContactAndPrayerTimes isButtonTransparent={isButtonTransparent} />
      <CommunityPaymentButton />

      {/* <button
        onClick={printDiv}
        style={{ opacity: isButtonTransparent ? 0 : 1 }}
      >
        Print
      </button> */}
    </div>
  );
};

export default Home;