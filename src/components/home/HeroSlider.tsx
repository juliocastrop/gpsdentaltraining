import { useState, useEffect, useCallback } from 'react';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  ceCredits?: number;
}

interface HeroSliderProps {
  slides: Slide[];
  autoplaySpeed?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
}

export default function HeroSlider({
  slides,
  autoplaySpeed = 5000,
  showNavigation = true,
  showPagination = true,
}: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(nextSlide, autoplaySpeed);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoplaySpeed, nextSlide, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="relative w-full h-[500px] md:h-[600px] lg:h-[720px] overflow-hidden">
      {/* Slides */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={s.imageUrl}
              alt={s.title}
              className="w-full h-full object-cover"
            />
            {/* Darker overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0C2044]/95 via-[#0C2044]/80 to-[#0C2044]/40" />
            {/* Additional bottom gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C2044]/60 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full container-wide flex items-center">
            <div className="max-w-2xl">
              {/* CE Credits Badge */}
              {s.ceCredits && s.ceCredits > 0 && (
                <div className="inline-flex items-center gap-2 bg-[#DDC89D] text-[#0C2044] px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
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
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  {s.ceCredits} CE Credits
                </div>
              )}

              {/* Subtitle - Gold color */}
              {s.subtitle && (
                <p className="text-[#DDC89D] font-semibold text-lg md:text-xl mb-3 tracking-wide uppercase">
                  {s.subtitle}
                </p>
              )}

              {/* Title - White with text shadow for extra contrast */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 leading-tight text-white drop-shadow-lg">
                {s.title}
              </h1>

              {/* Description - Light text */}
              {s.description && (
                <p className="text-lg md:text-xl text-white/95 mb-8 leading-relaxed max-w-xl">
                  {s.description}
                </p>
              )}

              {/* CTA Button - Blue with hover effect */}
              <a
                href={s.ctaLink}
                className="inline-flex items-center gap-2 bg-[#0B52AC] hover:bg-[#0D6EFD] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:transform hover:translate-y-[-2px] shadow-lg hover:shadow-xl"
              >
                {s.ctaText}
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
        </div>
      ))}

      {/* Navigation Arrows */}
      {showNavigation && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 border border-white/20"
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-300 border border-white/20"
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {showPagination && slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-[#DDC89D] w-10'
                  : 'bg-white/40 hover:bg-white/70 w-3'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
