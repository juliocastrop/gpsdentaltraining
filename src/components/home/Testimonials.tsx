import { useState, useEffect, useCallback } from 'react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  title: string;
  location?: string;
  image?: string;
  rating?: number;
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
  title?: string;
  subtitle?: string;
  autoplay?: boolean;
  autoplaySpeed?: number;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    quote: "The PRF course completely transformed my practice. Dr. Choukroun's hands-on approach and the detailed protocols have allowed me to offer advanced regenerative procedures with confidence.",
    author: "Dr. Sarah Mitchell",
    title: "DDS, Periodontist",
    location: "Atlanta, GA",
    rating: 5
  },
  {
    id: '2',
    quote: "GPS Monthly Seminars have been invaluable for my continuing education. The case discussions and literature reviews keep me at the forefront of implant dentistry.",
    author: "Dr. Michael Rodriguez",
    title: "DMD, Prosthodontist",
    location: "Miami, FL",
    rating: 5
  },
  {
    id: '3',
    quote: "The level of expertise and the quality of hands-on training at GPS is unmatched. I've attended courses worldwide, and GPS consistently delivers exceptional education.",
    author: "Dr. Jennifer Park",
    title: "DDS, Oral Surgeon",
    location: "Houston, TX",
    rating: 5
  },
  {
    id: '4',
    quote: "Excellent instructors, well-organized courses, and practical skills I could immediately apply in my practice. Worth every investment.",
    author: "Dr. David Thompson",
    title: "DMD, General Dentist",
    location: "Charlotte, NC",
    rating: 5
  }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-[#DDC89D]' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({
  testimonials = defaultTestimonials,
  title = "What Our Students Say",
  subtitle = "Trusted by dental professionals worldwide",
  autoplay = true,
  autoplaySpeed = 6000,
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoplay);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1) return;

    const interval = setInterval(nextSlide, autoplaySpeed);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoplaySpeed, nextSlide, testimonials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#DDC89D] font-semibold text-lg mb-2 uppercase tracking-wide">
            {subtitle}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0C2044] font-heading">
            {title}
          </h2>
        </div>

        {/* Testimonials Slider */}
        <div className="relative max-w-4xl mx-auto">
          {/* Quote Icon */}
          <div className="absolute -top-4 left-0 md:left-8 text-[#DDC89D]/20">
            <svg className="w-24 h-24 md:w-32 md:h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>

          {/* Testimonial Content */}
          <div className="relative z-10">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`transition-all duration-500 ${
                  index === currentIndex
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 absolute inset-0 translate-x-8'
                }`}
                style={{ display: index === currentIndex ? 'block' : 'none' }}
              >
                <div className="text-center px-4 md:px-16">
                  {/* Rating */}
                  {testimonial.rating && (
                    <div className="flex justify-center mb-6">
                      <StarRating rating={testimonial.rating} />
                    </div>
                  )}

                  {/* Quote */}
                  <blockquote className="text-xl md:text-2xl lg:text-3xl text-[#333] leading-relaxed mb-8 font-light italic">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex flex-col items-center">
                    {testimonial.image ? (
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-16 h-16 rounded-full object-cover mb-4 border-4 border-[#DDC89D]/30"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#173D84] to-[#0C2044] flex items-center justify-center mb-4 border-4 border-[#DDC89D]/30">
                        <span className="text-white text-xl font-bold">
                          {testimonial.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <h4 className="text-lg font-bold text-[#0C2044]">{testimonial.author}</h4>
                    <p className="text-[#173D84] font-medium">{testimonial.title}</p>
                    {testimonial.location && (
                      <p className="text-gray-500 text-sm">{testimonial.location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 bg-[#F2F2F2] hover:bg-[#0C2044] hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
                aria-label="Previous testimonial"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 bg-[#F2F2F2] hover:bg-[#0C2044] hover:text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
                aria-label="Next testimonial"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Dots Navigation */}
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-[#DDC89D] w-10'
                    : 'bg-gray-300 hover:bg-gray-400 w-3'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
