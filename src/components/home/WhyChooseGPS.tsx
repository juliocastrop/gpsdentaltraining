interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface WhyChooseGPSProps {
  features?: Feature[];
  title?: string;
  subtitle?: string;
}

const defaultFeatures: Feature[] = [
  {
    id: 'hands-on',
    title: "Hands-On Training",
    description: "Learn by doing with live patient demonstrations, surgical simulations, and practical exercises that prepare you for real clinical situations.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>
    )
  },
  {
    id: 'experts',
    title: "World-Renowned Faculty",
    description: "Train with pioneers and innovators in implant dentistry, PRF protocols, and digital workflows who are shaping the future of dental care.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    id: 'ce-credits',
    title: "PACE Approved CE Credits",
    description: "Earn continuing education credits recognized by the Academy of General Dentistry and state dental boards across the nation.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    )
  },
  {
    id: 'small-groups',
    title: "Small Group Sessions",
    description: "Limited class sizes ensure personalized attention, meaningful interaction with instructors, and maximum hands-on practice time.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    id: 'modern-facility',
    title: "State-of-the-Art Facility",
    description: "Train in our modern facility equipped with the latest dental technology, digital imaging, and surgical equipment.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    id: 'networking',
    title: "Professional Network",
    description: "Connect with a community of dental professionals, share cases, and build lasting relationships with peers and mentors.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    )
  }
];

export default function WhyChooseGPS({
  features = defaultFeatures,
  title = "Why Choose GPS Dental Training?",
  subtitle = "Excellence in Education"
}: WhyChooseGPSProps) {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#F2F2F2] to-transparent pointer-events-none" />

      <div className="container-wide relative">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#DDC89D] font-semibold text-lg mb-2 uppercase tracking-wide">
            {subtitle}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0C2044] font-heading max-w-3xl mx-auto">
            {title}
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-[#DDC89D]/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="mb-6 text-[#0B52AC] group-hover:text-[#DDC89D] transition-colors duration-300">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-[#0C2044] mb-3 group-hover:text-[#173D84] transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Decorative Line */}
              <div className="mt-6 h-1 w-12 bg-[#DDC89D]/30 group-hover:w-full group-hover:bg-[#DDC89D] transition-all duration-500" />
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-[#0C2044] to-[#173D84] rounded-2xl p-8 md:p-10">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Advance Your Career?</h3>
              <p className="text-white/80">Join thousands of dental professionals who trust GPS.</p>
            </div>
            <a
              href="/courses"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-[#DDC89D] hover:bg-white text-[#0C2044] px-8 py-4 rounded-lg font-bold transition-all duration-300 shadow-lg"
            >
              Browse Courses
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
