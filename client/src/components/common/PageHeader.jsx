import GoldParticles from './GoldParticles';
import LightSweep from './LightSweep';

export default function PageHeader({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      dir="rtl"
      style={{
        background:
          'linear-gradient(180deg, rgba(18,32,56,.98) 0%, rgba(13,35,64,.96) 100%)',
        padding: '10px 16px',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(207,167,86,.2)',
      }}
    >
      <GoldParticles />

      <div className="relative z-10">
        {children}

        <h1
          style={{
            fontSize: '36px',
            fontWeight: 800,
            color: '#cfa756',
            marginBottom: subtitle ? '10px' : '0',
            textShadow:
              '0 0 15px rgba(207,167,86,.45), 0 0 35px rgba(207,167,86,.2)',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              color: 'rgba(247,244,233,.8)',
              fontSize: '16px',
              letterSpacing: '1px',
            }}
          >
            {subtitle}
          </p>
        )}

        <div
          style={{
            width: '70px',
            height: '3px',
            margin: '20px auto 0',
            borderRadius: '5px',
            background: 'linear-gradient(90deg,#b8860b,#ffe9a0,#b8860b)',
            boxShadow: '0 0 15px rgba(207,167,86,.8)',
          }}
        />
      </div>

      <LightSweep />
    </div>
  );
}
