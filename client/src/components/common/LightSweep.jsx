export default function LightSweep() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg,#b8860b,#cfa756,#ffe9a0,#cfa756,#b8860b)',
        }}
      />
      <div
        className="absolute inset-y-0 w-[60%]"
        style={{
          background:
            'linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent)',
          animation: 'sweepLight 3.5s infinite',
        }}
      />
    </div>
  );
}
