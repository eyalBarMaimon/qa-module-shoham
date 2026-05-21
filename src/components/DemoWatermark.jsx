export default function DemoWatermark() {
  const tiles = Array.from({ length: 30 });

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          transform: 'rotate(-35deg)',
          opacity: 0.08,
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
              fontSize: '52px',
              fontWeight: 900,
              fontFamily: 'Arial, sans-serif',
              color: '#000',
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
