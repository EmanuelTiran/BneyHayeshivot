import React, { useEffect, useState } from 'react';
// אין צורך ב־named import
import { getZmanimJson } from 'kosher-zmanim';

const HalachicTimes = () => {
  const [zmanim, setZmanim] = useState(null);

  useEffect(() => {
    const fetchZmanim = async () => {
      const options = {
        date: new Date(),
        location: {
          name: 'Jerusalem',
          latitude: 31.7683,
          longitude: 35.2137,
          timeZoneId: 'Asia/Jerusalem',
        },
      };

      const zmanimJson = await getZmanimJson(options); // <--- כאן השינוי העיקרי
      setZmanim(zmanimJson.BasicZmanim);
      console.log({zmanim});

    };

    fetchZmanim();
  }, []);

  if (!zmanim) return <p>טוען זמני יום...</p>;

  return (
    <div style={{
      backgroundColor: '#f9f9f9',
      borderRadius: '12px',
      padding: '1rem',
      maxWidth: '450px',
      margin: '2rem auto',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      textAlign: 'right',
      direction: 'rtl',
    }}>
      <h2 style={{ fontWeight: 'bold' }}>זמני היום בירושלים</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>זריחה: {new Date(zmanim.Sunrise).toLocaleTimeString('he-IL')}</li>
        <li>שקיעה: {new Date(zmanim.Sunset).toLocaleTimeString('he-IL')}</li>
        <li>חצות: {new Date(zmanim.Chatzos).toLocaleTimeString('he-IL')}</li>
        <li>עלות השחר: {new Date(zmanim.AlosHashachar).toLocaleTimeString('he-IL')}</li>
      </ul>
        <li>SunLowerTransit: {new Date(zmanim.SunLowerTransit).toLocaleTimeString('he-IL')}</li>
    </div>
  );
};

export default HalachicTimes;
