import { useEffect, useRef, useState } from 'react';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
}

interface SponsorsSliderProps {
  sponsors: Sponsor[];
  title?: string;
  autoplaySpeed?: number;
  showTitle?: boolean;
}

export default function SponsorsSlider({
  sponsors,
  title = 'Our Sponsors & Partners',
  autoplaySpeed = 3000,
  showTitle = true,
}: SponsorsSliderProps) {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const positionRef = useRef<number>(0);

  useEffect(() => {
    if (sponsors.length === 0) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollWidth = scrollContainer.scrollWidth / 2;
    const speed = 50; // pixels per second

    const animate = (timestamp: number) => {
      if (isPaused) {
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      positionRef.current += (speed * delta) / 1000;

      if (positionRef.current >= scrollWidth) {
        positionRef.current = 0;
      }

      if (scrollContainer) {
        scrollContainer.style.transform = `translateX(-${positionRef.current}px)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sponsors.length, isPaused]);

  if (sponsors.length === 0) return null;

  // Duplicate sponsors for seamless loop
  const duplicatedSponsors = [...sponsors, ...sponsors];

  return (
    <section className="py-12 bg-white border-y border-[#A2B1CE]/30">
      <div className="container-wide">
        {showTitle && (
          <h2 className="text-center text-lg font-semibold text-[#173D84] uppercase tracking-wider mb-8">
            {title}
          </h2>
        )}

        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="flex items-center gap-12 whitespace-nowrap"
            style={{ willChange: 'transform' }}
          >
            {duplicatedSponsors.map((sponsor, index) => (
              <div
                key={`${sponsor.id}-${index}`}
                className="flex-shrink-0 px-4"
              >
                {sponsor.websiteUrl ? (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                  >
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="h-12 md:h-16 w-auto object-contain"
                    />
                  </a>
                ) : (
                  <div className="grayscale opacity-70">
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="h-12 md:h-16 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
