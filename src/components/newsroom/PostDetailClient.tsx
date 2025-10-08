'use client';

import { useEffect, useState } from 'react';
import { NewsroomPost } from '@/types/newsroom';
import Image from 'next/image';
import Link from 'next/link';
import { markdownToHtml, cleanContent } from '@/lib/markdown';
import FloatingShapes from '../FloatingShapes';
import { 
  CalendarDaysIcon, 
  EyeIcon, 
  ClockIcon,
  ArrowLeftIcon,
  ShareIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import {
  PlayCircleIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  UserCircleIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/solid';

interface PostDetailClientProps {
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
  'member-spotlight': 'Member Spotlight',
  'project-update': 'Project Update',
};

export default function PostDetailClient({ post }: PostDetailClientProps) {
  const [startTime] = useState(Date.now());
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);
  
  const IconComponent = TYPE_ICONS[post.type];
  const typeColor = TYPE_COLORS[post.type];
  const typeLabel = TYPE_LABELS[post.type];
  
  // Track analytics - separate effects to prevent overcounting
  useEffect(() => {
    // Generate a unique session ID that persists across re-renders
    const storageKey = `newsroom-view-${post.slug}`;
    let sessionId = sessionStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random()}`;
      sessionStorage.setItem(storageKey, sessionId);
    }
    
    // Check if we've already tracked this view in this session
    const viewTrackedKey = `${storageKey}-tracked`;
    let hasTrackedView = sessionStorage.getItem(viewTrackedKey) === 'true';
    
    // Track page view only once per session
    const trackView = async () => {
      if (hasTrackedView) return;
      hasTrackedView = true;
      sessionStorage.setItem(viewTrackedKey, 'true');
      
      try {
        await fetch(`/api/newsroom/${post.slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            referrer: document.referrer,
          }),
        });
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };
    
    trackView();
    
    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / scrollHeight) * 100);
      
      if (scrollDepth > maxScrollDepth) {
        setMaxScrollDepth(scrollDepth);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Track time on page when leaving
    const handleBeforeUnload = async () => {
      const timeOnPage = Date.now() - startTime;
      
      try {
        navigator.sendBeacon(`/api/newsroom/${post.slug}`, JSON.stringify({
          sessionId,
          timeOnPage,
          scrollDepth: maxScrollDepth,
        }));
      } catch (error) {
        console.error('Failed to track time on page:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [post.slug]); // Only depend on post.slug to prevent re-runs

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k views`;
    }
    return `${views} views`;
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        // TODO: Add toast notification
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  // Extract YouTube video ID for embedding
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  // Extract Spotify embed URL
  const getSpotifyEmbedUrl = (url: string) => {
    const match = url.match(/spotify\.com\/(episode|show|track)\/([^?&\n]+)/);
    return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
  };

  const renderMediaEmbed = () => {
    if (!post.mediaEmbedLink) return null;

    // YouTube video
    const youtubeEmbed = getYouTubeEmbedUrl(post.mediaEmbedLink);
    if (youtubeEmbed) {
      return (
        <div className="aspect-video w-full mb-8">
          <iframe
            src={youtubeEmbed}
            title={post.title}
            className="w-full h-full rounded-lg"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );
    }

    // Spotify embed
    const spotifyEmbed = getSpotifyEmbedUrl(post.mediaEmbedLink);
    if (spotifyEmbed) {
      return (
        <div className="w-full mb-8">
          <iframe
            src={spotifyEmbed}
            width="100%"
            height="232"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
          />
        </div>
      );
    }

    // Generic embed link
    return (
      <div className="mb-8 p-6 bg-white/10 border border-white/20 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <IconComponent className="w-6 h-6 text-yellow-400" />
          <span className="text-white/80 font-medium">External Media</span>
        </div>
        <a
          href={post.mediaEmbedLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-400 hover:text-yellow-300 underline break-all"
        >
          {post.mediaEmbedLink}
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#00274c] relative">
      <FloatingShapes />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/newsroom"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Newsroom
          </Link>
        </div>

        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            {/* Type and Featured Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white ${typeColor}`}>
                <IconComponent className="w-4 h-4" />
                {typeLabel}
              </span>
              
              {post.featured && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-600 text-white">
                  <StarIcon className="w-4 h-4" />
                  Featured
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
              {post.description}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {post.author.charAt(0)}
                </div>
                <span className="text-white font-medium">{post.author}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4" />
                {post.datePublished ? formatDate(post.datePublished) : formatDate(post.createdAt)}
              </div>
              
              
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {post.thumbnail && (
            <div className="relative aspect-video w-full mb-8 rounded-xl overflow-hidden">
              <Image
                src={post.thumbnail}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Media Embed */}
          {renderMediaEmbed()}

          {/* Content */}
          <article className="max-w-4xl mx-auto">
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(cleanContent(post.body)) }}
            />
            
            <style jsx global>{`
              .article-content {
                font-size: 1.1rem;
                line-height: 1.7;
                color: #e5e7eb;
              }
              
              /* Clean section headings */
              .article-content h2 {
                color: #3b82f6;
                font-size: 1.8rem;
                font-weight: 700;
                margin: 2.5rem 0 1rem 0;
                padding-bottom: 0.5rem;
                border-bottom: 2px solid rgba(59, 130, 246, 0.3);
              }
              
              /* Subsection headings */
              .article-content h3 {
                color: #fbbf24;
                font-size: 1.4rem;
                font-weight: 600;
                margin: 2rem 0 0.75rem 0;
                padding-left: 1rem;
                border-left: 4px solid #fbbf24;
              }
              
              .article-content h4 {
                color: #e5e7eb;
                font-size: 1.2rem;
                font-weight: 600;
                margin: 1.5rem 0 0.5rem 0;
              }
              
              /* Clean paragraphs */
              .article-content p {
                color: #d1d5db;
                line-height: 1.7;
                margin-bottom: 1.5rem;
                text-align: justify;
              }
              
              /* Organized lists */
              .article-content ul, .article-content ol {
                margin: 1.5rem 0;
                padding-left: 2rem;
              }
              
              .article-content li {
                color: #d1d5db;
                margin: 0.5rem 0;
                line-height: 1.6;
              }
              
              .article-content ul li {
                list-style-type: disc;
              }
              
              .article-content ol li {
                list-style-type: decimal;
              }
              
              /* Simple dividers */
              .article-content hr {
                border: none;
                height: 1px;
                background: linear-gradient(90deg, transparent, #374151, transparent);
                margin: 2.5rem 0;
              }
              
              /* Clean blockquotes */
              .article-content blockquote {
                background: rgba(31, 41, 55, 0.3);
                border-left: 4px solid #fbbf24;
                padding: 1rem 1.5rem;
                margin: 1.5rem 0;
                color: #d1d5db;
                font-style: italic;
                border-radius: 0 0.5rem 0.5rem 0;
              }
              
              /* Code elements */
              .article-content code {
                background: rgba(31, 41, 55, 0.8);
                color: #fbbf24;
                padding: 0.2rem 0.4rem;
                border-radius: 0.25rem;
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
              }
              
              .article-content pre {
                background: rgba(31, 41, 55, 0.8);
                border: 1px solid rgba(107, 114, 128, 0.3);
                padding: 1.5rem;
                border-radius: 0.5rem;
                overflow-x: auto;
                margin: 1.5rem 0;
              }
              
              /* Text formatting */
              .article-content strong {
                color: #ffffff;
                font-weight: 600;
              }
              
              .article-content em {
                color: #e5e7eb;
                font-style: italic;
              }
              
              .article-content a {
                color: #3b82f6;
                text-decoration: underline;
                text-decoration-color: rgba(59, 130, 246, 0.5);
              }
              
              .article-content a:hover {
                color: #60a5fa;
                text-decoration-color: #3b82f6;
              }
            `}</style>
          </article>

          {/* Footer */}
          <footer className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Published by</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{post.author}</p>
                    <p className="text-sm text-gray-400">AI Business Group Executive Board</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Share Post
              </button>
            </div>
          </footer>
        </article>
      </div>
      
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.description,
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "AI Business Group",
              "url": "https://aibusinessgroup.org"
            },
            "datePublished": post.datePublished || post.createdAt,
            "dateModified": post.updatedAt,
            ...(post.thumbnail && {
              "image": {
                "@type": "ImageObject",
                "url": post.thumbnail,
                "width": 1200,
                "height": 630
              }
            }),
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://aibusinessgroup.org/newsroom/${post.slug}`
            }
          })
        }}
      />
    </div>
  );
}