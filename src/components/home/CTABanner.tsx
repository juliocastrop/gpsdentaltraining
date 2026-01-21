interface CTABannerProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
  backgroundColor?: string;
  variant?: 'default' | 'gold' | 'navy' | 'darkest';
}

export default function CTABanner({
  title,
  subtitle,
  description,
  ctaText,
  ctaLink,
  backgroundImage,
  backgroundColor,
  variant = 'default',
}: CTABannerProps) {
  // Using official GPS colors directly
  const variantStyles = {
    default: {
      bg: 'bg-[#173D84]',        // gps-navy
      text: 'text-white',
      subtitle: 'text-[#DDC89D]', // gps-gold
      button: 'bg-[#0B52AC] hover:bg-[#0D6EFD] text-white',
    },
    gold: {
      bg: 'bg-[#DDC89D]',        // gps-gold
      text: 'text-[#0C2044]',    // gps-navy-darkest
      subtitle: 'text-[#173D84]', // gps-navy
      button: 'bg-[#0C2044] hover:bg-[#13326A] text-white',
    },
    navy: {
      bg: 'bg-[#13326A]',        // gps-navy-dark
      text: 'text-white',
      subtitle: 'text-[#DDC89D]', // gps-gold
      button: 'bg-[#DDC89D] hover:bg-[#BFAC87] text-[#0C2044]',
    },
    darkest: {
      bg: 'bg-[#0C2044]',        // gps-navy-darkest
      text: 'text-white',
      subtitle: 'text-[#DDC89D]', // gps-gold
      button: 'bg-[#26ACF5] hover:bg-[#0B52AC] text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <section
      className={`relative py-16 md:py-20 overflow-hidden ${styles.bg}`}
      style={{
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for background image */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-[#0C2044]/85" />
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container-wide">
        <div className="max-w-3xl mx-auto text-center">
          {subtitle && (
            <p className={`font-semibold text-lg mb-2 uppercase tracking-wide ${styles.subtitle}`}>
              {subtitle}
            </p>
          )}

          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 ${styles.text}`}>
            {title}
          </h2>

          {description && (
            <p className={`text-lg md:text-xl mb-8 opacity-90 ${styles.text}`}>
              {description}
            </p>
          )}

          <a
            href={ctaLink}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:transform hover:translate-y-[-2px] shadow-lg hover:shadow-xl ${styles.button}`}
          >
            {ctaText}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
