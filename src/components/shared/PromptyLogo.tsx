export default function PromptyLogo({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Prompty Logo"
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        mixBlendMode: 'multiply', // Blend out white background on light UI
      }}
    />
  );
}
