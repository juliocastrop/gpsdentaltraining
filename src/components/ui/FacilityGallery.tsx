/**
 * Facility Gallery - GPS Dental Training
 * Adaptive image gallery with lightbox
 * Layout: Featured image left (tall) + stacked images right
 * Supports 3-8+ images gracefully
 */
import { useState, useEffect, useCallback } from 'react';

interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface FacilityGalleryProps {
  images: GalleryImage[];
  title?: string;
}

export default function FacilityGallery({ images, title = 'Our Facility' }: FacilityGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  }, [lightboxIndex, images.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, goNext, goPrev]);

  if (!images.length) return null;

  // Split: first image is featured, rest go in the right grid
  const featured = images[0];
  const rest = images.slice(1);

  const ImageButton = ({ image, index, className }: { image: GalleryImage; index: number; className?: string }) => (
    <button
      onClick={() => setLightboxIndex(index)}
      className={`group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#26ACF5] focus:ring-offset-2 rounded-2xl ${className || ''}`}
    >
      <img
        src={image.url}
        alt={image.alt || `${title} - ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0C2044]/60 via-[#0C2044]/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          {image.caption && (
            <span className="text-white font-semibold text-sm md:text-base drop-shadow-lg">{image.caption}</span>
          )}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <>
      {/* Gallery Layout: Featured left + grid right */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4" style={{ gridTemplateRows: 'auto' }}>
          {/* Featured image - spans full height on desktop */}
          <div className="md:row-span-2">
            <ImageButton
              image={featured}
              index={0}
              className="w-full h-64 md:h-full min-h-[300px] md:min-h-[420px]"
            />
          </div>

          {/* Right side grid */}
          {rest.length === 1 && (
            <ImageButton image={rest[0]} index={1} className="w-full h-64 md:h-full" />
          )}

          {rest.length === 2 && (
            <>
              <ImageButton image={rest[0]} index={1} className="w-full h-52 md:h-auto" />
              <ImageButton image={rest[1]} index={2} className="w-full h-52 md:h-auto" />
            </>
          )}

          {rest.length >= 3 && (
            <>
              {/* Top right: single or 2-up */}
              <ImageButton image={rest[0]} index={1} className="w-full h-52 md:h-auto" />

              {/* Bottom right: remaining images in a sub-grid */}
              <div className={`grid gap-3 md:gap-4 ${rest.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {rest.slice(1, rest.length <= 5 ? rest.length : 4).map((img, i) => (
                  <ImageButton
                    key={i + 2}
                    image={img}
                    index={i + 2}
                    className="w-full h-40 md:h-auto aspect-[4/3]"
                  />
                ))}
                {/* "+N more" overlay on last visible if there are extras */}
                {rest.length > 5 && (
                  <button
                    onClick={() => setLightboxIndex(5)}
                    className="group relative overflow-hidden rounded-2xl w-full aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-[#26ACF5] focus:ring-offset-2"
                  >
                    <img
                      src={rest[4].url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-[#0C2044]/70 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{rest.length - 4}</span>
                    </div>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm font-medium z-10">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Previous */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image + Caption */}
          <div className="flex flex-col items-center gap-4 max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt || `${title} - ${lightboxIndex + 1}`}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
            />
            {images[lightboxIndex].caption && (
              <p className="text-white/80 text-center text-sm md:text-base max-w-2xl">
                {images[lightboxIndex].caption}
              </p>
            )}
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 max-w-[90vw] overflow-x-auto px-4 py-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === lightboxIndex ? 'border-[#DDC89D] scale-110' : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
