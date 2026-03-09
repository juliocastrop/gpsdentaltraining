interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  logo?: string;
  companyName?: string;
  description?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  vimeoUrl?: string;
  youtubeUrl?: string;
  footerLinks?: FooterLink[];
  copyright?: string;
  showPace?: boolean;
  paceImageUrl?: string;
  paceText?: string;
  bottomLinks?: FooterLink[];
}

export default function Footer({
  logo,
  companyName = 'GPS Dental Training',
  description = 'Advanced Education in Implant, Restorative and Digital dentistry',
  email = 'gpsdentaltraining@gaprostho.com',
  phone,
  addressLine1 = '6320 Sugarloaf Parkway',
  addressLine2,
  city = 'Duluth',
  state = 'GA',
  zip = '30097',
  facebookUrl = 'https://facebook.com/gpsdentaltraining',
  instagramUrl = 'https://instagram.com/gpsdentaltraining',
  linkedinUrl = 'https://linkedin.com/company/gpsdentaltraining',
  twitterUrl,
  vimeoUrl = 'https://vimeo.com/gpsdentaltraining',
  youtubeUrl,
  footerLinks,
  copyright,
  showPace = true,
  paceImageUrl,
  paceText = 'Academy of General Dentistry\nProgram Approval for Continuing Education',
  bottomLinks,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  const defaultFooterLinks: FooterLink[] = [
    { label: 'Events', href: '/courses' },
    { label: 'Monthly Seminars', href: '/monthly-seminars' },
    { label: 'Verify Certificate', href: '/certificate' },
    { label: 'Refer to a Prostho', href: '/refer' },
    { label: 'Contact', href: '/contact' },
    { label: 'Terms and Conditions', href: '/terms' },
  ];

  const defaultBottomLinks: FooterLink[] = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ];

  const links = footerLinks && footerLinks.length > 0 ? footerLinks : defaultFooterLinks;
  const bottom = bottomLinks && bottomLinks.length > 0 ? bottomLinks : defaultBottomLinks;

  const copyrightText = (copyright || `© {year} ${companyName}. All rights reserved.`)
    .replace('{year}', String(currentYear));

  // Build social links array from provided URLs
  const socialLinks = [
    facebookUrl && {
      label: 'Facebook',
      href: facebookUrl,
      icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
    instagramUrl && {
      label: 'Instagram',
      href: instagramUrl,
      icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    },
    linkedinUrl && {
      label: 'LinkedIn',
      href: linkedinUrl,
      icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    },
    twitterUrl && {
      label: 'X',
      href: twitterUrl,
      icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    },
    vimeoUrl && {
      label: 'Vimeo',
      href: vimeoUrl,
      icon: 'M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z',
    },
    youtubeUrl && {
      label: 'YouTube',
      href: youtubeUrl,
      icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z',
    },
  ].filter(Boolean) as { label: string; href: string; icon: string }[];

  const addressFull = [addressLine1, addressLine2].filter(Boolean).join(', ');
  const cityStateZip = [city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');
  const paceLines = paceText.split('\n');

  return (
    <footer className="bg-[#13326A]">
      {/* Main Footer Content */}
      <div className="bg-[#173D84]">
        <div className="container-wide py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* Logo & Description */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                {logo ? (
                  <img src={logo} alt={companyName} className="h-12" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="text-white text-xl font-bold tracking-wider">GPS</span>
                      <span className="text-white text-xl font-light tracking-wider ml-2">DENTAL</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-[#DDC89D]"></div>
                  <span className="text-[#DDC89D] text-sm tracking-[0.3em] font-medium">TRAINING</span>
                </div>
              </div>

              <p className="text-white/80 text-base leading-relaxed mb-6">
                {description}
              </p>

              {showPace && (
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                  <div className="flex-shrink-0">
                    {paceImageUrl ? (
                      <img src={paceImageUrl} alt="PACE" className="h-10 w-10 object-contain" />
                    ) : (
                      <svg className="w-10 h-10 text-white" viewBox="0 0 40 40" fill="none">
                        <path d="M20 0L24.5 15.5H40L27.5 25L32 40L20 30.5L8 40L12.5 25L0 15.5H15.5L20 0Z" fill="currentColor" opacity="0.3"/>
                        <text x="10" y="25" fill="white" fontSize="8" fontWeight="bold">PACE</text>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">PACE</p>
                    {paceLines.map((line, i) => (
                      <p key={i} className="text-white/70 text-xs leading-tight">{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Helpful Links */}
            <div>
              <h3 className="text-[#DDC89D] text-lg font-semibold mb-6">Helpful Links</h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <a
                      href={link.href}
                      className="text-white/80 hover:text-white transition-colors duration-200 text-base"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-[#DDC89D] text-lg font-semibold mb-6">Contact Info</h3>
              <ul className="space-y-4">
                {email && (
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#DDC89D] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${email}`} className="text-white/80 hover:text-white transition-colors">
                      {email}
                    </a>
                  </li>
                )}

                {phone && (
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#DDC89D] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="text-white/80 hover:text-white transition-colors">
                      {phone}
                    </a>
                  </li>
                )}

                {addressLine1 && (
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#DDC89D] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="text-white/80">
                      <p>{addressFull}</p>
                      <p>{cityStateZip}</p>
                    </div>
                  </li>
                )}

                {socialLinks.length > 0 && (
                  <li className="pt-4">
                    <div className="flex items-center gap-4">
                      {socialLinks.map((social) => (
                        <a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/60 hover:text-white transition-colors duration-200"
                          aria-label={social.label}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d={social.icon} />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#0C2044]">
        <div className="container-wide py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm" dangerouslySetInnerHTML={{ __html: copyrightText }} />
            {bottom.length > 0 && (
              <div className="flex items-center gap-6">
                {bottom.map((link) => (
                  <a
                    key={link.href + link.label}
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
