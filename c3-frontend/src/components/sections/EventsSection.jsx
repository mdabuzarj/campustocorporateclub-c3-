import { useEffect, useRef, useState } from 'react';
import CountUp from '../reactbits/CountUp';
import Carousel from '../reactbits/Carousel';
import Masonry from '../reactbits/Masonry';
import api from '../../api/axios';
import { motion } from 'motion/react'; // add to top imports

// Real events now come from GET /api/events (backend serves Cloudinary URLs
// for coverImage/gallery - see c3-backend/controllers/eventController.js).
// Expected shape per event: { title, slug, category, date, attendeeCount,
// coverImage, description, gallery: string[] }

const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api.get('/public/events')
      .then(res => {
        if (!cancelled) setEvents(res.data);
      })
      .catch(err => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error };
};

const STORY_LINES = [
  'Every event begins with an idea.',
  'Every idea becomes an experience.',
  'Every experience becomes a memory.'
];

const STATS = [
           { to: 20, suffix: '+', label: 'Members' },
           { to: 10, suffix: '+', label: 'Events' },
           { to: 200, suffix: '+', label: 'Participants' },
           { to: 30, suffix: '+', label: 'Sessions' }
         ];

const useMeasuredWidth = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
};
const storyContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.25 } }
};

const storyLineVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};


const StoryTransition = () => (
  <motion.div
    className="max-w-2xl mx-auto text-center py-10 sm:py-14 px-4"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.5 }}
    variants={storyContainerVariants}
  >
    {STORY_LINES.map(line => (
      <motion.p
        key={line}
        variants={storyLineVariants}
        className="font-display text-xl sm:text-3xl md:text-4xl font-semibold text-white/90 mb-2"
      >
        {line}
      </motion.p>
    ))}
  </motion.div>
);
const ClosingCTA = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center py-16 px-4">
      {inView && (
        <p className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white justify-center">
          The next memory could be yours.
        </p>
      )}
    </div>
  );
};

export const EventsSection = () => {
  const sectionRef = useRef(null);
  const introRef = useRef(null);
  const [introInView, setIntroInView] = useState(false);
  const [showIntroParagraph, setShowIntroParagraph] = useState(false);
  // Preload gate: fires well before the section is actually on screen, so the
  // Carousel (DOM, cover images, GSAP/motion setup) is fully ready by the
  // time showIntroParagraph reveals it - no cold-start jump/freeze on scroll.
  const [carouselPrepared, setCarouselPrepared] = useState(false);
  const [carouselRef, carouselWidth] = useMeasuredWidth();
  const { events, loading, error } = useEvents();

  const carouselItems = events.map(event => ({
    id: event.slug,
    title: event.title,
    description: event.description,
    image: event.coverImage,
    category: event.category,
    year: event.date,
    participants: event.attendeeCount,
    href: `/events/${event.slug}`
  }));

  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    api.get('/public/gallery')
      .then(res => setGalleryImages(res.data))
      .catch(() => setGalleryImages([]));
  }, []);

  const galleryItems = galleryImages.map((img, i) => ({
    id: `gallery-${i}`,
    img,
    url: '#',
    height: 300 + ((i * 73) % 220)
  }));

  useEffect(() => {
    const node = introRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIntroInView(entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!introInView) {
      setShowIntroParagraph(false);
      return;
    }
    const timer = setTimeout(() => setShowIntroParagraph(true), 350);
    return () => clearTimeout(timer);
  }, [introInView]);

  // Trigger well ahead of the section entering the viewport (roughly a
  // screen's worth of scroll early on most devices) so mounting/initializing
  // the carousel and warming its images happens while the user is still
  // scrolling toward it, not once they've already arrived. One-shot: we
  // disconnect as soon as it fires, so it costs nothing for visitors who
  // never scroll this far.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCarouselPrepared(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px 600px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Warm the browser's image cache for cover images as soon as we're
  // preparing the carousel, so by reveal time the <img> tags paint instantly
  // instead of popping in.
  useEffect(() => {
    if (!carouselPrepared) return;
    carouselItems.forEach(item => {
      if (!item.image) return;
      const img = new Image();
      img.src = item.image;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselPrepared, events]);

  // Mount as soon as either signal fires - carouselPrepared normally wins
  // since its rootMargin trigger is further away, but showIntroParagraph is
  // kept as a safety net for fast scrolls/large viewports.
  const mountCarousel = carouselPrepared || showIntroParagraph;

  return (
    <section id="events" ref={sectionRef} className="relative w-full bg-black overflow-hidden py-24 sm:py-28">
      {/* Featured events */}
      <div ref={introRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <p className="text-xs uppercase tracking-widest text-[#38BDF8] font-medium mb-3">Our Events</p>
        {introInView && (
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white max-w-3xl">
            Learning through experience. Building memories together.
          </h2>
        )}
      </div>

      <div ref={carouselRef} className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && (
          <p className="text-center text-sm text-[#A1A1AA] py-12">Loading events…</p>
        )}
        {!loading && error && (
          <p className="text-center text-sm text-red-400 py-12">Couldn't load events right now.</p>
        )}
        {!loading && !error && carouselItems.length === 0 && (
          <p className="text-center text-sm text-[#A1A1AA] py-12">No events yet — check back soon.</p>
        )}
        {!loading && !error && mountCarousel && carouselItems.length > 0 && (
          <div
            className={`transition-opacity duration-50 ${showIntroParagraph ? 'opacity-100' : 'opacity-100'}`}
            aria-hidden={!showIntroParagraph}
          >
            <Carousel
              items={carouselItems}
              baseWidth={Math.max(carouselWidth, 280)}
              itemHeight={440}
              autoplay={showIntroParagraph}
              autoplayDelay={5000}
              pauseOnHover
              loop
            />
          </div>
        )}
      </div>

      {/* Story transition */}
      <StoryTransition />

      {/* Event gallery */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <p className="text-xs uppercase tracking-widest text-[#71717A] mb-6">From past events</p>
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" style={{ height: 900 }}>
        <Masonry
          items={galleryItems}
          ease="power3.out"
          duration={0.5}
          stagger={0.05}
          animateFrom="bottom"
          scaleOnHover
          hoverScale={0.96}
          blurToFocus={false}
          colorShiftOnHover={false}
        />
      </div>

      {/* Event statistics */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-4 gap-x-2 sm:gap-8 text-center">


          {STATS.map(stat => (
            <div key={stat.label}>
           <div className="font-display text-lg sm:text-5xl font-bold text-white flex items-baseline justify-center flex-wrap">
                <CountUp to={stat.to} duration={2} />
<span>{stat.suffix}</span>
           </div>
<div className="text-[10px] sm:text-sm text-[#A1A1AA] mt-1 sm:mt-2 leading-tight">{stat.label}</div>            </div>
          ))}
        </div>
      </div>

      {/* Closing transition into Join Us */}
      <ClosingCTA />
    </section>
  );
};

export default EventsSection;