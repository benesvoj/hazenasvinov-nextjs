'use client';

import {useMemo, useState} from 'react';

import {Card, CardBody, Input, Select, SelectItem} from '@heroui/react';

import {MagnifyingGlassIcon, TagIcon} from '@heroicons/react/24/outline';

import {useQuery} from '@tanstack/react-query';

import {useDebounce} from '@/hooks/shared/useDebounce';

import {BlogPostCard, BlogPostCardSkeleton} from '@/components/features';

import {createSearchablePost, searchPosts} from '@/utils/contentSearch';

import {fetchBlogPosts} from '@/queries/blogPosts/queries';
import {fetchCategories} from '@/queries/categories/queries';
import {Blog} from '@/types';

export function BlogListingClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Všechny');

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ✅ Data is hydrated from server - instant!
  const {data: allPosts = [], isLoading: postsLoading} = useQuery({
    queryKey: ['blog-posts'],
    queryFn: fetchBlogPosts,
  });

  // ✅ Fetch categories (also hydrated from server)
  const {data: allCategories = [], isLoading: categoriesLoading} = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Create category lookup map for BlogPostCard
  const categoryMap = useMemo(() => {
    const map = new Map();
    allCategories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [allCategories]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    return ['Všechny']; // Can enhance later with actual categories
  }, []);

  const isLoading = postsLoading || categoriesLoading;

  // Client-side filtering (instant!)
  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];

    const searchablePosts = allPosts.map(createSearchablePost);

    // Filter by search
    const searchResults = debouncedSearchTerm
      ? searchPosts(searchablePosts, debouncedSearchTerm)
      : searchablePosts;

    // searchResults already ARE the posts (with search properties added)
    // Just filter out any nulls/undefined
    return searchResults.filter((post): post is Blog => post !== null && post !== undefined);
  }, [allPosts, debouncedSearchTerm]);

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
              aria-label="Hledat články"
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
              className="flex-1"
            />
            <Select
              placeholder="Kategorie"
              aria-label="Filtrovat podle kategorie"
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
            <BlogPostCard
              key={post.id}
              post={post}
              category={categoryMap.get(post.category_id)}
              variant="blog"
            />
          ))}
        </div>
      )}
    </div>
  );
}
