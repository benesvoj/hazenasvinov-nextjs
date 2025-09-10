/**
 * Utility functions for content searching optimization
 */

/**
 * Generates a searchable excerpt from content
 * @param content - The full content string
 * @param maxLength - Maximum length of the excerpt (default: 500)
 * @returns A truncated excerpt suitable for searching
 */
export function generateSearchExcerpt(content: string, maxLength: number = 500): string {
  if (!content) return '';
  
  // Remove HTML tags for better text search
  const textContent = content.replace(/<[^>]*>/g, ' ');
  
  // Clean up whitespace
  const cleanedContent = textContent.replace(/\s+/g, ' ').trim();
  
  // Truncate to maxLength
  if (cleanedContent.length <= maxLength) {
    return cleanedContent;
  }
  
  // Find the last complete word within the limit
  const truncated = cleanedContent.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    // If we can find a good word boundary, use it
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  // Otherwise, just truncate and add ellipsis
  return truncated + '...';
}

/**
 * Creates a searchable content field for posts
 * @param post - The post object
 * @returns An object with searchable fields
 */
export function createSearchablePost(post: any) {
  return {
    ...post,
    searchableContent: generateSearchExcerpt(post.content),
    searchableTitle: post.title || '',
  };
}

/**
 * Searches through posts with optimized content matching
 * @param posts - Array of posts
 * @param searchTerm - The search term
 * @returns Filtered posts
 */
export function searchPosts(posts: any[], searchTerm: string): any[] {
  if (!searchTerm.trim()) return posts;
  
  const searchLower = searchTerm.toLowerCase();
  
  return posts.filter(post => {
    // Search in title (always full text)
    const titleMatch = post.title?.toLowerCase().includes(searchLower);
    
    // Search in content excerpt (optimized)
    const contentMatch = post.searchableContent?.toLowerCase().includes(searchLower);
    
    return titleMatch || contentMatch;
  });
}
