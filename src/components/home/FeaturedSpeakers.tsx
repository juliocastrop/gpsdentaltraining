interface Speaker {
  id: string;
  name: string;
  title: string;
  specialty?: string;
  image?: string;
  bio?: string;
  slug?: string;
}

interface FeaturedSpeakersProps {
  speakers?: Speaker[];
  title?: string;
  subtitle?: string;
}

const defaultSpeakers: Speaker[] = [
  {
    id: '1',
    name: "Dr. Joseph Choukroun",
    title: "MD, PhD",
    specialty: "PRF & Regenerative Medicine",
    bio: "Inventor of PRF protocols, world-renowned researcher in platelet concentrates and tissue regeneration.",
    slug: "dr-joseph-choukroun"
  },
  {
    id: '2',
    name: "Dr. Carlos Castro",
    title: "DDS, Prosthodontist",
    specialty: "Implant Prosthodontics",
    bio: "Director of GPS Dental Training, specialist in complex implant rehabilitation and digital dentistry.",
    slug: "dr-carlos-castro"
  },
  {
    id: '3',
    name: "Dr. Maurice Salama",
    title: "DMD",
    specialty: "Periodontics & Implant Dentistry",
    bio: "Internationally recognized lecturer and pioneer in implant esthetics and soft tissue management.",
    slug: "dr-maurice-salama"
  },
  {
    id: '4',
    name: "Dr. Rodrigo Neiva",
    title: "DDS, MS",
    specialty: "Periodontics",
    bio: "Expert in guided bone regeneration, minimally invasive surgery, and dental implant therapy.",
    slug: "dr-rodrigo-neiva"
  }
];

export default function FeaturedSpeakers({
  speakers = defaultSpeakers,
  title = "Learn from World-Class Experts",
  subtitle = "Our Faculty"
}: FeaturedSpeakersProps) {
  if (speakers.length === 0) return null;

  return (
    <section className="py-20 bg-[#F2F2F2]">
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

        {/* Speakers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {speakers.map((speaker) => (
            <a
              key={speaker.id}
              href={speaker.slug ? `/speakers/${speaker.slug}` : '#'}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#173D84] to-[#0C2044]">
                  {speaker.image ? (
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl font-bold text-white/20">
                        {speaker.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C2044] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Specialty Badge */}
                  {speaker.specialty && (
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <span className="inline-block bg-[#DDC89D] text-[#0C2044] px-3 py-1 rounded-full text-xs font-bold">
                        {speaker.specialty}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0C2044] group-hover:text-[#0B52AC] transition-colors mb-1">
                    {speaker.name}
                  </h3>
                  <p className="text-[#173D84] font-medium mb-3">{speaker.title}</p>

                  {speaker.bio && (
                    <p className="text-gray-600 text-sm line-clamp-2 group-hover:text-gray-700 transition-colors">
                      {speaker.bio}
                    </p>
                  )}

                  {/* View Profile Link */}
                  <div className="mt-4 flex items-center text-[#0B52AC] font-semibold text-sm group-hover:text-[#0C2044] transition-colors">
                    <span>View Profile</span>
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <a
            href="/speakers"
            className="inline-flex items-center gap-2 bg-[#0C2044] hover:bg-[#173D84] text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Meet All Our Instructors
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
