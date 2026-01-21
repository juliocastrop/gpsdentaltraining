import { useState, useEffect } from 'react';
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from '@clerk/astro/react';

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  logo?: string;
  logoWhite?: string;
  links?: NavLink[];
  transparent?: boolean;
}

const defaultLinks: NavLink[] = [
  { label: 'Courses', href: '/courses' },
  { label: 'Monthly Seminars', href: '/monthly-seminars' },
  { label: 'Speakers', href: '/speakers' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar({
  logo,
  logoWhite,
  links = defaultLinks,
  transparent = true,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navClasses = transparent
    ? isScrolled
      ? 'bg-white shadow-lg'
      : 'bg-transparent'
    : 'bg-white shadow-sm';

  const textClasses = transparent
    ? isScrolled
      ? 'text-[#0C2044]'
      : 'text-white'
    : 'text-[#0C2044]';

  const hoverClasses = transparent
    ? isScrolled
      ? 'hover:text-[#0B52AC]'
      : 'hover:text-[#DDC89D]'
    : 'hover:text-[#0B52AC]';

  const buttonClasses = transparent
    ? isScrolled
      ? 'bg-[#0B52AC] text-white hover:bg-[#0C2044]'
      : 'bg-white/20 text-white hover:bg-white hover:text-[#0C2044] backdrop-blur-sm border border-white/30'
    : 'bg-[#0B52AC] text-white hover:bg-[#0C2044]';

  const currentLogo = transparent
    ? isScrolled
      ? logo
      : logoWhite || logo
    : logo;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClasses}`}
    >
      <nav className="container-wide py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 relative z-10">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="GPS Dental Training"
                className="h-10 md:h-12 transition-all duration-300"
              />
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className={`text-xl font-bold tracking-wider transition-colors duration-300 ${textClasses}`}>
                    GPS
                  </span>
                  <span className={`text-xl font-light tracking-wider ml-2 transition-colors duration-300 ${textClasses}`}>
                    DENTAL
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-[#DDC89D]"></div>
                  <span className="text-[#DDC89D] text-[10px] tracking-[0.2em] font-medium">
                    TRAINING
                  </span>
                </div>
              </div>
            )}
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors duration-300 ${textClasses} ${hoverClasses}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Cart */}
            <a
              href="/cart"
              className={`relative p-2 transition-colors duration-300 ${textClasses} ${hoverClasses}`}
              aria-label="Shopping Cart"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span
                id="cart-count"
                className="absolute -top-1 -right-1 bg-[#DDC89D] text-[#0C2044] text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold hidden"
              >
                0
              </span>
            </a>

            {/* Auth - Desktop */}
            <SignedIn>
              <a
                href="/account"
                className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${buttonClasses}`}
              >
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                My Account
              </a>
              <div className="hidden sm:block">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-9 h-9',
                      userButtonPopoverCard: 'shadow-xl',
                    },
                  }}
                />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${buttonClasses}`}
                >
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
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 transition-colors duration-300 ${textClasses}`}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-[500px] mt-4' : 'max-h-0'
          }`}
        >
          <div className={`py-4 border-t ${
            transparent && !isScrolled ? 'border-white/20' : 'border-gray-200'
          }`}>
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`py-2 font-medium transition-colors duration-300 ${textClasses} ${hoverClasses}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              {/* Mobile Auth Buttons */}
              <SignedIn>
                <a
                  href="/account"
                  className={`mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${buttonClasses}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  My Account
                </a>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className={`mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${buttonClasses}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
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
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
