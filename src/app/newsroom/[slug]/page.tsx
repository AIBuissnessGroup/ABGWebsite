import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostDetailClient from '@/components/newsroom/PostDetailClient';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/newsroom/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return {
        title: 'Post Not Found | ABG Newsroom',
        description: 'The requested post could not be found.'
      };
    }
    
    const post = await response.json();
    
    return {
      title: post.seoTitle || `${post.title} | ABG Newsroom`,
      description: post.seoDescription || post.description,
      authors: [{ name: post.author }],
      openGraph: {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.description,
        type: 'article',
        publishedTime: post.datePublished,
        authors: [post.author],
        images: post.openGraphImage || post.thumbnail ? [{
          url: post.openGraphImage || post.thumbnail,
          width: 1200,
          height: 630,
          alt: post.title,
        }] : [],
        url: `/newsroom/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.description,
        images: post.openGraphImage || post.thumbnail ? [post.openGraphImage || post.thumbnail] : [],
      },
      keywords: post.tags?.join(', '),
    };
  } catch (error) {
    return {
      title: 'Post Not Found | ABG Newsroom',
      description: 'The requested post could not be found.'
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/newsroom/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      notFound();
    }
    
    const post = await response.json();
    
    return <PostDetailClient post={post} />;
  } catch (error) {
    notFound();
  }
}