'use client';

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import Link from "@/components/Link";
import Image from "next/image";
import { 
  CalendarIcon, 
  UserIcon, 
  TagIcon,
  ArrowRightIcon,
  PhotoIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import { useFetchBlogPosts } from "@/hooks/useFetchBlogPosts";
import { useState, useMemo } from "react";

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Všechny");
  
  // Fetch all published blog posts
  const { posts: allPosts, loading, error } = useFetchBlogPosts(100); // Get more posts for filtering
  
  // Get unique categories from posts
  const categories = useMemo(() => {
    if (!allPosts) return ["Všechny"];
    
    const uniqueCategories = new Set<string>();
    allPosts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => uniqueCategories.add(tag));
      }
    });
    
    return ["Všechny", ...Array.from(uniqueCategories).sort()];
  }, [allPosts]);

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];
    
    return allPosts.filter(post => {
      const matchesSearch = searchTerm === "" || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesCategory = selectedCategory === "Všechny" || 
        (post.tags && post.tags.includes(selectedCategory));
      
      return matchesSearch && matchesCategory;
    });
  }, [allPosts, searchTerm, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Novinky a články
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Sledujte nejnovější události, výsledky a příběhy z našeho oddílu národní házené
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Hledat v článcích..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            placeholder="Kategorie"
            selectedKeys={[selectedCategory]}
            onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
            className="w-full"
          >
            {categories.map((category) => (
              <SelectItem key={category}>{category}</SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          {loading ? "Načítání..." : `Nalezeno ${filteredPosts.length} článků`}
        </p>
      </div>

      {/* Blog Posts Grid */}
      {loading ? (
        // Loading state
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-0">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardBody>
            </Card>
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
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-0">
                {/* Post Image */}
                {post.image_url ? (
                  <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Post Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.tags.slice(0, 2).map((tag, index) => (
                      <Chip
                        key={index}
                        size="sm"
                        variant="bordered"
                        color="primary"
                        className="text-xs"
                      >
                        {tag}
                      </Chip>
                    ))}
                    {post.tags.length > 2 && (
                      <Chip size="sm" variant="bordered" color="default" className="text-xs">
                        +{post.tags.length - 2}
                      </Chip>
                    )}
                  </div>
                )}
                
                {/* Post Title */}
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {post.title}
                </h2>
              </CardHeader>
              
              <CardBody>
                {/* Post Excerpt */}
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                {/* Post Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{post.author_id === 'default-user' ? 'Admin' : `ID: ${post.author_id}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString('cs-CZ')}</span>
                  </div>
                </div>

                {/* Read More Button */}
                <Button 
                  as={Link} 
                  href={`/blog/${post.slug}`}
                  size="sm" 
                  color="primary"
                  endContent={<ArrowRightIcon className="w-4 h-4" />}
                  className="w-full"
                >
                  Přečíst více
                </Button>
              </CardBody>
            </Card>
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