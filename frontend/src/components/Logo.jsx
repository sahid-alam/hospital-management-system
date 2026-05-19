export default function Logo({ size = 32, className = '' }) {
  return (
    <img 
      src="/18246203_v987-18a.svg" 
      width={size} 
      height={size} 
      className={className} 
      alt="MediCore Logo"
      style={{ objectFit: 'contain' }}
    />
  );
}
