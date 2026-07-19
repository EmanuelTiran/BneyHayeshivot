import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleLogin } from '@react-oauth/google';
import './Home.css';

import CommunityPaymentButton from '../components/CommunityPaymentButton';
import ContactAndPrayerTimes from '../components/ContactAndPrayerTimes/ContactAndPrayerTimes';
import { useAuth } from '../components/context/authContext';
import GoldParticles from '../components/common/GoldParticles';

const GOOGLE_PROMPT_SESSION_KEY = 'home-google-login-prompt-shown';
const GOOGLE_PROMPT_DELAY = 5000;

const Home = () => {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    googleLogin,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  /*
   * הצגת החלון לאחר 5 שניות:
   * 1. ממתינים לסיום טעינת מצב ההתחברות.
   * 2. לא מציגים למשתמש מחובר.
   * 3. לא מציגים אם החלון כבר הוצג בסשן הנוכחי.
   */
  useEffect(() => {
    if (authLoading || isAuthenticated) {
      return undefined;
    }

    let wasPromptShown = false;

    try {
      wasPromptShown =
        window.sessionStorage.getItem(GOOGLE_PROMPT_SESSION_KEY) === 'true';
    } catch {
      // אם sessionStorage חסום, עדיין נאפשר לחלון להופיע.
    }

    if (wasPromptShown) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(
          GOOGLE_PROMPT_SESSION_KEY,
          'true'
        );
      } catch {
        // חסימת sessionStorage לא צריכה למנוע את הצגת החלון.
      }

      setShowGoogleModal(true);
    }, GOOGLE_PROMPT_DELAY);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [authLoading, isAuthenticated]);

  /*
   * בזמן שהחלון פתוח:
   * - מונעים גלילה של העמוד שמאחוריו.
   * - מאפשרים סגירה באמצעות Escape.
   */
  const shouldShowGoogleModal =
    showGoogleModal && !isAuthenticated;

  useEffect(() => {
    if (!shouldShowGoogleModal) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowGoogleModal(false);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [shouldShowGoogleModal]);

  const handleCloseGoogleModal = () => {
    setShowGoogleModal(false);
    setGoogleError('');
  };

  /*
   * אותו מנגנון התחברות שמופעל ב-Login.jsx:
   * מעבירים את ה-credential לפונקציית googleLogin מה-Context.
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleError('');
    setIsGoogleLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error('לא התקבלו פרטי התחברות מגוגל');
      }

      await googleLogin(credentialResponse.credential);
      setShowGoogleModal(false);
    } catch (error) {
      setGoogleError(
        error instanceof Error
          ? error.message
          : 'התחברות עם גוגל נכשלה, נסה שנית'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleError('התחברות עם גוגל נכשלה, נסה שנית');
  };

  return (
    <>
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
              radial-gradient(
                ellipse at 50% 0%,
                rgba(13, 35, 64, 0.55) 0%,
                transparent 65%
              ),
              radial-gradient(
                ellipse at 50% 100%,
                rgba(13, 35, 64, 0.7) 0%,
                transparent 65%
              ),
              radial-gradient(
                ellipse at 20% 50%,
                rgba(13, 35, 64, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                ellipse at 80% 50%,
                rgba(13, 35, 64, 0.3) 0%,
                transparent 50%
              )
            `,
          }}
        />

        {/* חלקיקי זהב */}
        <GoldParticles />

        {/* תוכן מרכזי */}
        <div className="relative z-10 w-full flex flex-col items-center gap-6 px-4">
          <div className="text-center mb-2">
            <div
              className="mx-auto mt-3"
              style={{
                width: '80px',
                height: '3px',
                background:
                  'linear-gradient(90deg, transparent, #cfa756, #f7d98a, #cfa756, transparent)',
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

          <ContactAndPrayerTimes isButtonTransparent={false} />
          <CommunityPaymentButton />
        </div>
      </div>

      {shouldShowGoogleModal &&
        createPortal(
          <div
            className="google-login-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleCloseGoogleModal();
              }
            }}
          >
            <section
              className="google-login-modal"
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="google-login-modal-title"
              aria-describedby="google-login-modal-description"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="google-login-modal-close"
                onClick={handleCloseGoogleModal}
                aria-label="סגירת חלון ההתחברות"
                autoFocus
              >
                ×
              </button>

              <div
                className="google-login-modal-decoration"
                aria-hidden="true"
              >
                ✦
              </div>

              <p className="google-login-modal-eyebrow">
                בני הישיבות רמת שלמה
              </p>

              <h2
                id="google-login-modal-title"
                className="google-login-modal-title"
              >
                נשמח שתצטרף אלינו
              </h2>

              <p
                id="google-login-modal-description"
                className="google-login-modal-description"
              >
                התחבר באמצעות גוגל כדי ליהנות מגישה אישית ומהירה
                לכל שירותי הקהילה.
              </p>

              {googleError && (
                <div
                  className="google-login-modal-error"
                  role="alert"
                >
                  <span aria-hidden="true">!</span>
                  <span>{googleError}</span>
                </div>
              )}

              <div
                className={`google-login-modal-google ${
                  isGoogleLoading ? 'is-loading' : ''
                }`}
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  shape="rectangular"
                  locale="he"
                  width="100%"
                />
              </div>

              <div
                className="google-login-modal-status"
                aria-live="polite"
              >
                {isGoogleLoading ? 'מתחבר לחשבון שלך...' : ''}
              </div>

              <button
                type="button"
                className="google-login-modal-later"
                onClick={handleCloseGoogleModal}
              >
                אולי מאוחר יותר
              </button>
            </section>
          </div>,
          document.body
        )}
    </>
  );
};

export default Home;