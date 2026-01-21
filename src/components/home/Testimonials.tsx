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

  // Show only first 3 testimonials in grid, or use slider for more
  const displayTestimonials = testimonials.slice(0, 3);

  return (
    <section className="py-20 bg-[#F8F9FA]">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#DDC89D] font-semibold text-lg mb-2 uppercase tracking-wide">
            {subtitle}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0C2044] font-heading">
            {title}
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="pt-8">
              {/* Card with quote icon */}
              <div className="relative bg-white rounded-2xl shadow-lg p-6 md:p-8 h-full">
                {/* Quote Icon - positioned at top left, overlapping */}
                <div className="absolute -top-6 left-6">
                  <div className="w-14 h-14 bg-[#DDC89D] rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-[#0C2044] text-3xl font-serif leading-none">"</span>
                  </div>
                </div>

                <div className="pt-6">
                  {/* Rating */}
                  {testimonial.rating && (
                    <div className="flex gap-1 mb-4">
                      <StarRating rating={testimonial.rating} />
                    </div>
                  )}

                  {/* Quote */}
                  <blockquote className="text-[#333] leading-relaxed mb-6 italic">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3 mt-auto">
                    {testimonial.image ? (
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#0C2044]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#0C2044] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {testimonial.author.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-[#0C2044]">{testimonial.author}</h4>
                      <p className="text-[#666] text-sm">
                        {testimonial.title}
                        {testimonial.location && <span> • {testimonial.location}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots Navigation - for mobile slider mode */}
        {testimonials.length > 3 && (
          <div className="flex justify-center gap-3 mt-8">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-[#DDC89D] w-10'
                    : 'bg-gray-300 hover:bg-gray-400 w-3'
                }`}
                aria-label={`Go to testimonial set ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
