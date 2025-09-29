'use client';

import {useMemo, useEffect, useState} from 'react';
interface BlogContentProps {
  content: string;
  className?: string;
}

export default function BlogContent({content, className = ''}: BlogContentProps) {
  const [isClient, setIsClient] = useState(false);
  const [DOMPurify, setDOMPurify] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we're in browser environment
  useEffect(() => {
    setIsClient(true);

    // Dynamically import DOMPurify only on client side
    if (typeof window !== 'undefined') {
      import('dompurify')
        .then((module) => {
          setDOMPurify(module.default);
          setIsLoading(false);
        })
        .catch((error) => {
          console.warn('Failed to load DOMPurify:', error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const processedContent = useMemo(() => {
    // Check if content contains HTML tags
    const hasHtmlTags = /<[^>]*>/g.test(content);

    // Show loading state while DOMPurify is being loaded
    if (hasHtmlTags && isClient && isLoading) {
      return (
        <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
          <div className="whitespace-pre-wrap leading-relaxed opacity-50">Loading content...</div>
        </div>
      );
    }

    if (hasHtmlTags && isClient && DOMPurify && !isLoading) {
      // Content is HTML, sanitize before rendering (client-side only)
      const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          'p',
          'br',
          'strong',
          'em',
          'u',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'ol',
          'li',
          'blockquote',
          'a',
          'img',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
        ALLOW_DATA_ATTR: false,
      });

      return (
        <div
          className={`prose prose-lg max-w-none dark:prose-invert ${className}`}
          dangerouslySetInnerHTML={{__html: sanitizedContent}}
        />
      );
    } else if (hasHtmlTags && !isClient) {
      // Server-side rendering: strip HTML tags for safety
      const strippedContent = content.replace(/<[^>]*>/g, '');
      return (
        <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
          <div className="whitespace-pre-wrap leading-relaxed">{strippedContent}</div>
        </div>
      );
    } else {
      // Content is plain text, preserve line breaks and format nicely
      return (
        <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
          <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
        </div>
      );
    }
  }, [content, className, isClient, DOMPurify, isLoading]);

  return processedContent;
}
