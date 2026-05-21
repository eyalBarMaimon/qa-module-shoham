export default function DemoWatermark() {
  const tiles = Array.from({ length: 40 });

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          inset: '-60%',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          transform: 'rotate(-35deg)',
        }}
      >
        {tiles.map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              fontSize: '56px',
              fontWeight: 900,
              fontFamily: 'Arial, sans-serif',
              color: '#1a1a1a',
              opacity: 0.12,
              letterSpacing: '6px',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            DEMO
          </div>
        ))}
      </div>
    </div>
  );
}
