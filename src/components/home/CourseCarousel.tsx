import { useState, useEffect, useCallback, useRef } from 'react';

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  ceCredits: number;
  featuredImage?: string;
  price?: number;
}

interface CourseCarouselProps {
  courses: Course[];
  title?: string;
  subtitle?: string;
  autoplay?: boolean;
  autoplaySpeed?: number;
  slidesToShow?: number;
  hideHeader?: boolean;
  hideViewAll?: boolean;
  hideBackground?: boolean;
}

export default function CourseCarousel({
  courses,
  title = 'Upcoming Courses',
  subtitle,
  autoplay = true,
  autoplaySpeed = 4000,
  slidesToShow = 3,
  hideHeader = false,
  hideViewAll = false,
  hideBackground = false,
}: CourseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoplay);
  const [slidesPerView, setSlidesPerView] = useState(slidesToShow);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive slides per view
  useEffect(() => {
    const updateSlidesPerView = () => {
      if (window.innerWidth < 640) {
        setSlidesPerView(1);
      } else if (window.innerWidth < 1024) {
        setSlidesPerView(2);
      } else {
        setSlidesPerView(slidesToShow);
      }
    };

    updateSlidesPerView();
    window.addEventListener('resize', updateSlidesPerView);
    return () => window.removeEventListener('resize', updateSlidesPerView);
  }, [slidesToShow]);

  const maxIndex = Math.max(0, courses.length - slidesPerView);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (!isAutoPlaying || courses.length <= slidesPerView) return;

    const interval = setInterval(nextSlide, autoplaySpeed);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoplaySpeed, nextSlide, courses.length, slidesPerView]);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = (startDate: string, endDate?: string): string => {
    const start = new Date(startDate);
    if (!endDate) {
      return formatDate(startDate);
    }
    const end = new Date(endDate);

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (courses.length === 0) return null;

  const sectionClasses = hideBackground
    ? ''
    : 'section bg-[#F2F2F2]';

  const containerClasses = hideBackground
    ? ''
    : 'container-wide';

  return (
    <section className={sectionClasses}>
      <div className={containerClasses}>
        {/* Header - only show if not hidden */}
        {!hideHeader && (
          <div className="flex items-end justify-between mb-8">
            <div>
              {subtitle && (
                <p className="text-[#DDC89D] font-semibold mb-1 uppercase tracking-wide">{subtitle}</p>
              )}
              <h2 className="text-3xl md:text-4xl font-bold text-[#0C2044] font-heading">
                {title}
              </h2>
            </div>

            {/* Navigation */}
            {courses.length > slidesPerView && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    prevSlide();
                    setIsAutoPlaying(false);
                  }}
                  className="w-10 h-10 bg-white border border-gray-200 hover:border-[#0C2044] hover:bg-[#0C2044] hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="Previous courses"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    nextSlide();
                    setIsAutoPlaying(false);
                  }}
                  className="w-10 h-10 bg-white border border-gray-200 hover:border-[#0C2044] hover:bg-[#0C2044] hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label="Next courses"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation when header is hidden - show floating navigation */}
        {hideHeader && courses.length > slidesPerView && (
          <div className="flex justify-end gap-2 mb-6">
            <button
              onClick={() => {
                prevSlide();
                setIsAutoPlaying(false);
              }}
              className="w-10 h-10 bg-white border border-gray-200 hover:border-[#0C2044] hover:bg-[#0C2044] hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
              aria-label="Previous courses"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                nextSlide();
                setIsAutoPlaying(false);
              }}
              className="w-10 h-10 bg-white border border-gray-200 hover:border-[#0C2044] hover:bg-[#0C2044] hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
              aria-label="Next courses"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Carousel */}
        <div className="overflow-hidden py-2" ref={containerRef}>
          <div
            className="flex transition-transform duration-500 ease-out -mx-3"
            style={{
              transform: `translateX(-${currentIndex * (100 / slidesPerView)}%)`,
            }}
          >
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex-shrink-0 px-3 pb-4"
                style={{ width: `${100 / slidesPerView}%` }}
              >
                <div className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
                  {/* Image */}
                  <a href={`/courses/${course.slug}`} className="block relative">
                    <div className="aspect-video bg-[#0C2044] overflow-hidden">
                      {course.featuredImage ? (
                        <img
                          src={course.featuredImage}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#173D84] to-[#0C2044] flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 text-white/30"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* CE Credits Badge */}
                    {course.ceCredits > 0 && (
                      <div className="absolute top-4 right-4 bg-[#DDC89D] text-[#0C2044] px-3 py-1 rounded-full text-sm font-bold shadow-md">
                        {course.ceCredits} CE Credits
                      </div>
                    )}
                  </a>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#0C2044] mb-3 line-clamp-2 min-h-[3.5rem]">
                      <a
                        href={`/courses/${course.slug}`}
                        className="hover:text-[#0B52AC] transition-colors"
                      >
                        {course.title}
                      </a>
                    </h3>

                    {/* Meta */}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-[#173D84]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDateRange(course.startDate, course.endDate)}
                      </div>

                      {course.venue && (
                        <div className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-[#173D84]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {course.venue}
                        </div>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      {course.price && (
                        <span className="text-xl font-bold text-[#0C2044]">
                          {formatPrice(course.price)}
                        </span>
                      )}
                      <a
                        href={`/courses/${course.slug}`}
                        className="inline-flex items-center gap-1 text-[#0B52AC] font-semibold hover:gap-2 transition-all duration-300"
                      >
                        View Details
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
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
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Link - only show if not hidden */}
        {!hideViewAll && (
          <div className="text-center mt-10">
            <a
              href="/courses"
              className="inline-flex items-center gap-2 text-[#0C2044] font-semibold hover:text-[#0B52AC] transition-colors"
            >
              View All Courses
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
        )}
      </div>
    </section>
  );
}
