'use client';

import { NewsroomPost } from '@/types/newsroom';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDaysIcon, EyeIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import { 
  PlayCircleIcon, 
  SpeakerWaveIcon, 
  DocumentTextIcon,
  UserCircleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/solid';

interface PostCardProps {
  post: NewsroomPost;
}

const TYPE_ICONS = {
  blog: DocumentTextIcon,
  podcast: SpeakerWaveIcon,
  video: PlayCircleIcon,
  'member-spotlight': UserCircleIcon,
  'project-update': RocketLaunchIcon,
};

const TYPE_COLORS = {
  blog: 'bg-blue-600',
  podcast: 'bg-purple-600',
  video: 'bg-red-600',
  'member-spotlight': 'bg-green-600',
  'project-update': 'bg-orange-600',
};

const TYPE_LABELS = {
  blog: 'Article',
  podcast: 'Podcast',
  video: 'Video',
  'member-spotlight': 'Spotlight',
  'project-update': 'Update',
};

export default function PostCard({ post }: PostCardProps) {
  const IconComponent = TYPE_ICONS[post.type];
  const typeColor = TYPE_COLORS[post.type];
  const typeLabel = TYPE_LABELS[post.type];
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  return (
    <Link href={`/newsroom/${post.slug}`} className="group block">
      <article className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {post.thumbnail ? (
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <IconComponent className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${typeColor}`}>
              <IconComponent className="w-3.5 h-3.5" />
              {typeLabel}
            </span>
          </div>
          
          {/* Featured Badge */}
          {post.featured && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-600 text-white">
                <StarIcon className="w-3 h-3" />
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-gray-300 text-sm line-clamp-3 mb-4 leading-relaxed">
            {post.description}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-md"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-md">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                {post.datePublished ? formatDate(post.datePublished) : formatDate(post.createdAt)}
              </div>
              

            </div>

            <div className="text-right">
              <div className="text-gray-300 font-medium text-xs">
                {post.author}
              </div>
            </div>
          </div>

          {/* Media Indicator */}
          {post.mediaEmbedLink && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-1.5 text-xs text-blue-400">
                {post.type === 'video' && <PlayCircleIcon className="w-4 h-4" />}
                {post.type === 'podcast' && <SpeakerWaveIcon className="w-4 h-4" />}
                <span>
                  {post.type === 'video' && 'Watch Video'}
                  {post.type === 'podcast' && 'Listen Now'}
                </span>
              </div>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}