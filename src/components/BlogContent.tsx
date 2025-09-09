import { useMemo } from 'react';

interface BlogContentProps {
  content: string;
  className?: string;
}

export default function BlogContent({ content, className = "" }: BlogContentProps) {
  const processedContent = useMemo(() => {
    // Check if content contains HTML tags
    const hasHtmlTags = /<[^>]*>/g.test(content);
    
    if (hasHtmlTags) {
      // Content is HTML, render as-is
      return (
        <div 
          className={`prose prose-lg max-w-none dark:prose-invert ${className}`}
          dangerouslySetInnerHTML={{ __html: content }} 
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
