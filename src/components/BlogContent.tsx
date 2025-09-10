import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface BlogContentProps {
  content: string;
  className?: string;
}

export default function BlogContent({ content, className = "" }: BlogContentProps) {
  const processedContent = useMemo(() => {
    // Check if content contains HTML tags
    const hasHtmlTags = /<[^>]*>/g.test(content);
    
    if (hasHtmlTags) {
      // Content is HTML, sanitize before rendering
      const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
        ALLOW_DATA_ATTR: false
      });
      
      return (
        <div 
          className={`prose prose-lg max-w-none dark:prose-invert ${className}`}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
        />
      );
    } else {
      // Content is plain text, preserve line breaks and format nicely
      return (
        <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
          <div className="whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
      );
    }
  }, [content, className]);

  return processedContent;
}
