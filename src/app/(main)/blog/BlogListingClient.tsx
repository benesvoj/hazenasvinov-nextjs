'use client';

import {useState, useMemo} from 'react';

import {Card, CardBody, Input, Select, SelectItem} from '@heroui/react';

import {TagIcon, MagnifyingGlassIcon} from '@heroicons/react/24/outline';

import {useQuery} from '@tanstack/react-query';

import {useDebounce} from '@/hooks/shared/useDebounce';

import {BlogPostCard, BlogPostCardSkeleton} from '@/components/features';

import {createSearchablePost, searchPosts} from '@/utils/contentSearch';

import {fetchBlogPosts} from '@/queries/blogPosts/queries';
import {Blog} from '@/types';

export function BlogListingClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Všechny');

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ✅ Data is hydrated from server - instant!
  const {data: allPosts = [], isLoading} = useQuery({
    queryKey: ['blog-posts'],
    queryFn: fetchBlogPosts,
  });

  // Debug logging
  console.log('BlogListingClient - allPosts:', {
    count: allPosts?.length || 0,
    isLoading,
    posts: allPosts,
  });

  // Get unique categories
  const categories = useMemo(() => {
    return ['Všechny']; // Can enhance later with actual categories
  }, []);

  // Client-side filtering (instant!)
  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];

    const searchablePosts = allPosts.map(createSearchablePost);

    // Filter by search
    const searchResults = debouncedSearchTerm
      ? searchPosts(searchablePosts, debouncedSearchTerm)
      : searchablePosts;

    // Filter by category and remove any undefined posts
    return searchResults
      .map((sp) => sp.post)
      .filter((post): post is Blog => post !== null && post !== undefined);
  }, [allPosts, debouncedSearchTerm, selectedCategory]);

  // Loading skeleton (rarely shows due to server prefetch)
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="text-gray-600">Načítám články...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <BlogPostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Blog</h1>
        <p className="text-gray-600">Aktuality a zajímavosti z klubu</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <Input
              placeholder="Hledat články..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
              className="flex-1"
            />
            <Select
              placeholder="Kategorie"
              selectedKeys={[selectedCategory]}
              onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              className="w-48"
            >
              {categories.map((cat) => (
                <SelectItem key={cat}>{cat}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <TagIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Žádné články nenalezeny</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
