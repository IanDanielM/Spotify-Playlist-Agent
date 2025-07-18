import React, { useState, useEffect } from 'react';
import { Star, Quote, Music, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  rating: number;
  content: string;
  playlist_info: {
    name: string;
    tracks_before: number;
    tracks_after: number;
    style_used: string;
  };
  date: string;
}

interface TestimonialsProps {
  limit?: number;
  showNavigation?: boolean;
  autoSlide?: boolean;
}

const sampleTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah M.',
    username: '@sarahmusic',
    rating: 5,
    content: 'This AI completely transformed my workout playlist! The energy flow is perfect - starts mellow and builds to an incredible peak. My gym sessions have never been better!',
    playlist_info: {
      name: 'Ultimate Workout Mix',
      tracks_before: 45,
      tracks_after: 45,
      style_used: 'Energy Flow'
    },
    date: '2 days ago'
  },
  {
    id: '2',
    name: 'Alex K.',
    username: '@alexkproducer',
    rating: 5,
    content: 'As a music producer, I\'m very particular about flow. This tool nailed it - my 80-track chill playlist now has seamless transitions. The mood progression is chef\'s kiss!',
    playlist_info: {
      name: 'Late Night Vibes',
      tracks_before: 80,
      tracks_after: 80,
      style_used: 'Mood Progression'
    },
    date: '1 week ago'
  },
  {
    id: '3',
    name: 'Maria L.',
    username: '@marialoves_music',
    rating: 5,
    content: 'I had a 200+ song liked songs playlist that was just chaos. The AI organized it perfectly by genre and energy. Now I can actually find the vibe I want!',
    playlist_info: {
      name: 'Liked Songs',
      tracks_before: 234,
      tracks_after: 234,
      style_used: 'Genre Clustering'
    },
    date: '3 days ago'
  },
  {
    id: '4',
    name: 'David R.',
    username: '@daverave24',
    rating: 4,
    content: 'Used this for my dinner party playlist and WOW. The progression from background jazz to upbeat soul was seamless. Guests kept asking who curated it!',
    playlist_info: {
      name: 'Dinner Party Essentials',
      tracks_before: 32,
      tracks_after: 32,
      style_used: 'Narrative Arc'
    },
    date: '5 days ago'
  },
  {
    id: '5',
    name: 'Jennifer C.',
    username: '@jenn_commutes',
    rating: 5,
    content: 'My 90-minute commute playlist is now perfectly timed. Starts energizing, maintains focus in the middle, and winds down as I arrive. It\'s like having a personal DJ!',
    playlist_info: {
      name: 'Daily Commute',
      tracks_before: 67,
      tracks_after: 67,
      style_used: 'Time-based Flow'
    },
    date: '1 week ago'
  }
];

const UserTestimonials: React.FC<TestimonialsProps> = ({
  limit = 3,
  showNavigation = true,
  autoSlide = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleTestimonials, setVisibleTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const testimonialsToShow = sampleTestimonials.slice(0, limit);
    setVisibleTestimonials(testimonialsToShow);
  }, [limit]);

  useEffect(() => {
    if (autoSlide && visibleTestimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % visibleTestimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoSlide, visibleTestimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleTestimonials.length) % visibleTestimonials.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
        }`}
      />
    ));
  };

  if (visibleTestimonials.length === 0) return null;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Quote className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">What Users Say</h3>
        </div>
        
        {showNavigation && visibleTestimonials.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={prevTestimonial}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={nextTestimonial}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {visibleTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="w-full flex-shrink-0">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                {/* User Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold">{testimonial.name}</h4>
                      <span className="text-purple-300 text-sm">{testimonial.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(testimonial.rating)}</div>
                      <span className="text-gray-400 text-sm">{testimonial.date}</span>
                    </div>
                  </div>
                </div>

                {/* Testimonial Content */}
                <p className="text-purple-100 leading-relaxed mb-4">
                  "{testimonial.content}"
                </p>

                {/* Playlist Info */}
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">Playlist:</span>
                    <span className="text-white">{testimonial.playlist_info.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Tracks:</span>
                      <span className="text-white ml-2">{testimonial.playlist_info.tracks_before}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Style:</span>
                      <span className="text-white ml-2">{testimonial.playlist_info.style_used}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {visibleTestimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {visibleTestimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-purple-400 w-6' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-6 text-center">
        <p className="text-purple-200 text-sm mb-3">
          Join thousands of music lovers who've transformed their playlists
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span>⭐ 4.9/5 avg rating</span>
          <span>•</span>
          <span>🎵 10,000+ playlists reordered</span>
          <span>•</span>
          <span>⚡ 99% satisfaction rate</span>
        </div>
      </div>
    </div>
  );
};

export default UserTestimonials;
