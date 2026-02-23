type IconProps = {
  src: string;
  size?: number;
  className?: string;
  label?: string;
};

export function Icon({ src, size = 20, className, label }: IconProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: 'currentColor',
        maskImage: `url(${src})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}
