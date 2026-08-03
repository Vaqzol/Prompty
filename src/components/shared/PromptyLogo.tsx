export default function PromptyLogo({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Prompty Logo"
      width={size}
      height={size}
      className="prompty-logo-img"
    />
  );
}
