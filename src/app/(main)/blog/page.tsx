'use client';

import { useState, useMemo } from "react";
import { Card, CardBody, Button, Input, Select, SelectItem } from "@heroui/react";
import { BlogPostCard, BlogPostCardSkeleton } from "@/components";
import { 
  TagIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { useFetchBlogPosts } from "@/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { createSearchablePost, searchPosts } from "@/utils/contentSearch";

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Všechny");
  
  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Fetch all published blog posts
  const { posts: allPosts, loading, error } = useFetchBlogPosts(100); // Get more posts for filtering
  
  // Get unique categories from posts
  const categories = useMemo(() => {
    // Since we removed tags, just return a simple category list
    return ["Všechny"];
  }, []);

  // Filter posts based on debounced search and category
  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];
    
    // Create searchable posts with content excerpts
    const searchablePosts = allPosts.map(createSearchablePost);
    
    // Filter by search term using optimized search
    const searchFiltered = debouncedSearchTerm === "" 
      ? searchablePosts 
      : searchPosts(searchablePosts, debouncedSearchTerm);
    
    // Filter by category
    return searchFiltered.filter(post => {
      const matchesCategory = selectedCategory === "Všechny";
      return matchesCategory;
    });
  }, [allPosts, debouncedSearchTerm, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Header - Enhanced Modern Design */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full mb-6">
          <TagIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Blog</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Novinky a články
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Sledujte nejnovější události, výsledky a příběhy z našeho oddílu národní házené
        </p>
      </div>

      {/* Search and Filter - Enhanced Design */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Hledat v článcích..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              className="w-full bg-white dark:bg-gray-800 border-0 shadow-sm focus:ring-2 focus:ring-blue-500"
              size="lg"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              placeholder="Kategorie"
              selectedKeys={[selectedCategory]}
              onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              className="w-full"
              size="lg"
              aria-label="Vyberte kategorii"
            >
              {categories.map((category) => (
                <SelectItem key={category}>{category}</SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Results Count - Enhanced Design */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
          <TagIcon className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {loading ? "Načítání..." : `Nalezeno ${filteredPosts.length} článků`}
          </span>
        </div>
      </div>

      {/* Blog Posts Grid */}
      {loading ? (
        // Loading state
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BlogPostCardSkeleton key={i} variant="blog" />
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="text-center py-12">
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardBody className="text-center">
              <TagIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                Chyba při načítání článků
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
              <Button 
                color="primary" 
                variant="bordered"
                onPress={() => window.location.reload()}
              >
                Zkusit znovu
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : filteredPosts.length > 0 ? (
        // Success state - display posts
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <BlogPostCard key={post.id} post={post} variant="blog" />
          ))}
        </div>
      ) : (
        // No posts state
        <div className="text-center py-12">
          <Card className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
            <CardBody className="text-center">
              <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Žádné články nenalezeny
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {searchTerm || selectedCategory !== "Všechny" 
                  ? "Pro vybrané filtry nebyly nalezeny žádné články."
                  : "Zatím nebyly publikovány žádné články."
                }
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Newsletter Signup */}
      <Card className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <CardBody className="text-center">
          <h3 className="text-2xl font-bold mb-2">
            Nechte si posílat novinky
          </h3>
          <p className="text-blue-100 mb-4">
            Přihlaste se k odběru novinek a buďte první, kdo se dozví o důležitých událostech v našem oddílu.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Váš email"
              className="flex-1 px-4 py-2 rounded-md text-gray-900"
            />
            <Button color="primary" className="bg-white text-blue-600 hover:bg-blue-50">
              Přihlásit
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 