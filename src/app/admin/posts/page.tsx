'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useDisclosure } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  UserIcon,
  TagIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import Image from 'next/image';
import { BlogPost } from "@/types";
import { useCategories } from "@/hooks/useCategories";
import {AddPostModal, EditPostModal, DeletePostModal} from "./components";
import { formatDateString } from "@/helpers";

interface User {
  id: string;
  email: string;
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dbError, setDbError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  
  // Use the categories hook
  const { categories, loading: categoriesLoading, error: categoriesError, fetchCategoriesFull } = useCategories();
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const supabase = createClient();


  // Fetch blog posts
  const fetchPosts = useCallback(async () => {
    try {
      // Check if supabase client is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('Supabase client not properly initialized');
        setPosts([]);
        setDbError('Supabase client not properly initialized');
        return;
      }

      setLoading(true);
      
      try {
        const { data: testData, error: testError } = await supabase
          .from('blog_posts')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error('Database connection test failed:', testError);
          
          // Check if it's a table not found error
          if (testError.message && testError.message.includes('relation "blog_posts" does not exist')) {
            const errorMsg = 'The blog_posts table does not exist. Please run the create_blog_posts_table.sql script in your Supabase database.';
            console.error(errorMsg);
            setDbError(errorMsg);
          } else if (testError.code === '42501' && testError.message.includes('permission denied')) {
            const errorMsg = 'Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features.';
            console.log(errorMsg);
            setDbError(errorMsg);
          } else {
            setDbError(`Database connection failed: ${testError.message || 'Unknown error'}`);
          }
          
          throw testError;
        }
        
        console.log('Database connection successful');
        setDbError(null); // Clear any previous errors
      } catch (connectionError) {
        console.error('Failed to connect to database:', connectionError);
        if (!dbError) {
          setDbError('Failed to connect to database. Please check your Supabase configuration.');
        }
        throw connectionError;
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database query error:', error);
        
        // Check for specific permission errors
        if (error.code === '42501' && error.message.includes('permission denied')) {
          console.log('Permission denied for blog_posts table - this is normal for unauthenticated users');
          setDbError('Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features.');
        } else {
          setDbError(`Database query failed: ${error.message || 'Unknown error'}`);
        }
        
        throw error;
      }
      
      console.log('Posts fetched successfully:', data?.length || 0, 'posts');
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else if (error && typeof error === 'object') {
        console.error('Error object:', JSON.stringify(error, null, 2));
      }
      
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, dbError]);

  // Fetch users for author selection
  const fetchUsers = useCallback(async () => {
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables not configured. Cannot fetch users.');
        setUsers([{
          id: 'default-user',
          email: 'admin@hazenasvinov.cz'
        }]);
        return;
      }

      // Check if supabase client is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('Supabase client not properly initialized');
        setUsers([{
          id: 'default-user',
          email: 'admin@hazenasvinov.cz'
        }]);
        return;
      }

      // Try to get the current user from auth (this doesn't require table access)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.log('User error, using fallback users:', userError);
        setUsers([{
          id: 'default-user',
          email: 'admin@hazenasvinov.cz'
        }]);
        return;
      }

      // If we have a user, use the current user
      if (user) {
        console.log('Authenticated user found:', user.email);
        setUsers([{
          id: user.id,
          email: user.email || 'unknown@example.com'
        }]);
      } else {
        // No user, use fallback user
        console.log('No authenticated user found, using fallback users');
        setUsers([{
          id: 'default-user',
          email: 'admin@hazenasvinov.cz'
        }]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Always fall back to default user on any error
      setUsers([{
        id: 'default-user',
        email: 'admin@hazenasvinov.cz'
      }]);
    }
  }, [supabase]);



  // Initial data fetch
  useEffect(() => {
    fetchPosts();
    fetchUsers();
    fetchCategoriesFull();
  }, [fetchPosts, fetchUsers, fetchCategoriesFull]);

  // Upload image to Supabase storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Open add post modal
  const handleAddPost = () => {
    onAddOpen();
  };

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    onEditOpen();
  };

  // Open delete post modal
  const handleDeletePost = (post: BlogPost) => {
    setSelectedPost(post);
    onDeleteOpen();
  };

  // Add new post
  const addPost = async (formData: any, imageFile: File | null) => {
    try {
      // Validate required fields
      if (!formData.title || !formData.slug || !formData.content || !formData.excerpt) {
        console.error('Missing required fields for new post:', {
          title: !!formData.title,
          slug: !!formData.slug,
          content: !!formData.content,
          excerpt: !!formData.excerpt
        });
        return;
      }

      // Ensure author_id is set
      const authorId = formData.author_id || 'default-user';
      
      // Upload image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          console.error('Failed to upload image');
          // Continue without image
        }
      }
      
      console.log('Attempting to add post with data:', {
        title: formData.title,
        slug: formData.slug,
        content: formData.content.substring(0, 100) + '...',
        excerpt: formData.excerpt,
        author_id: authorId,
        status: formData.status,
        tags: formData.tags,
        image_url: imageUrl
      });

      // Check if table exists and has proper structure
      try {
        const { data: tableCheck, error: tableCheckError } = await supabase
          .from('blog_posts')
          .select('id')
          .limit(1);
        
        if (tableCheckError) {
          console.error('Table structure check failed:', tableCheckError);
          if (tableCheckError.message && tableCheckError.message.includes('relation "blog_posts" does not exist')) {
            const errorMsg = 'The blog_posts table does not exist. Please run the create_blog_posts_table.sql script in your Supabase database.';
            console.error(errorMsg);
            setDbError(errorMsg);
            return;
          } else if (tableCheckError.code === '42501' && tableCheckError.message.includes('permission denied')) {
            const errorMsg = 'Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features.';
            console.log(errorMsg);
            setDbError(errorMsg);
            return;
          } else {
            setDbError(`Database connection failed: ${tableCheckError.message || 'Unknown error'}`);
            return;
          }
        } else {
          console.log('Table structure check passed');
        }
      } catch (tableCheckError) {
        console.error('Error checking table structure:', tableCheckError);
      }

      // Prepare insert data (only include fields that exist)
      const insertData: any = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        author_id: authorId,
        status: formData.status,
        tags: formData.tags,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
        created_at: formData.created_at ? new Date(formData.created_at).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Only add image_url if the column exists (will be handled by database)
      if (imageUrl) {
        insertData.image_url = imageUrl;
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Supabase error adding post:', error);
        
        // Check if it's a column not found error
        if (error.code === 'PGRST204' && error.message.includes('image_url')) {
          console.error('The image_url column does not exist. Please run the add_image_url_to_blog_posts.sql script first.');
          // Try inserting without image_url
          const { image_url, ...insertDataWithoutImage } = insertData;
          const { data: retryData, error: retryError } = await supabase
            .from('blog_posts')
            .insert([insertDataWithoutImage])
            .select();
          
          if (retryError) {
            throw retryError;
          }
          
          console.log('Post added successfully without image:', retryData);
        } else {
          throw error;
        }
      } else {
        console.log('Post added successfully:', data);
      }
      
      fetchPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else if (error && typeof error === 'object') {
        console.error('Error object:', JSON.stringify(error, null, 2));
      }
      
      // You could add user notification here
      // setDbError(`Failed to add post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update existing post
  const updatePost = async (formData: any, imageFile: File | null) => {
    if (!selectedPost) return;

    try {
      // Validate required fields
      if (!formData.title || !formData.slug || !formData.content || !formData.excerpt) {
        console.error('Missing required fields for update:', {
          title: !!formData.title,
          slug: !!formData.slug,
          content: !!formData.content,
          excerpt: !!formData.excerpt
        });
        return;
      }

      // Ensure author_id is set
      const authorId = formData.author_id || 'default-user';
      
      // Upload image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          console.error('Failed to upload image');
          // Continue without image
        }
      }
      
      console.log('Attempting to update post with data:', {
        id: selectedPost.id,
        title: formData.title,
        slug: formData.slug,
        content: formData.content.substring(0, 100) + '...',
        excerpt: formData.excerpt,
        author_id: authorId,
        status: formData.status,
        tags: formData.tags,
        image_url: imageUrl
      });

      // Prepare update data (only include fields that exist)
      const updateData: any = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        author_id: authorId,
        status: formData.status,
        tags: formData.tags,
        created_at: formData.created_at ? new Date(formData.created_at).toISOString() : undefined,
        updated_at: new Date().toISOString()
      };

      // Only add image_url if the column exists (will be handled by database)
      if (imageUrl) {
        updateData.image_url = imageUrl;
      }

      // Add published_at if status is published
      if (formData.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', selectedPost.id)
        .select();

      if (error) {
        console.error('Supabase error updating post:', error);
        
        // Check if it's a column not found error
        if (error.code === 'PGRST204' && error.message.includes('image_url')) {
          console.error('The image_url column does not exist. Please run the add_image_url_to_blog_posts.sql script first.');
          // Try updating without image_url
          const { image_url, ...updateDataWithoutImage } = updateData;
          const { data: retryData, error: retryError } = await supabase
            .from('blog_posts')
            .update(updateDataWithoutImage)
            .eq('id', selectedPost.id)
            .select();
          
          if (retryError) {
            throw retryError;
          }
          
          console.log('Post updated successfully without image:', retryData);
        } else {
          throw error;
        }
      } else {
        console.log('Post updated successfully:', data);
      }
      
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else if (error && typeof error === 'object') {
        console.error('Error object:', JSON.stringify(error, null, 2));
      }
    }
  };

  // Delete post
  const deletePost = async () => {
    if (!selectedPost) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', selectedPost.id);

      if (error) throw error;
      
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Filter posts based on search and status
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Chip color="success" variant="flat">Publikováno</Chip>;
      case 'draft':
        return <Chip color="warning" variant="flat">Koncept</Chip>;
      case 'archived':
        return <Chip color="secondary" variant="flat">Archivováno</Chip>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Správa článků</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Spravujte blogové články a novinky
          </p>
        </div>
        <Button 
          color="primary" 
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={handleAddPost}
        >
          Nový článek
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Hledat v článcích..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<TagIcon className="w-4 h-4 text-gray-400" />}
            />
            <Select
              placeholder="Filtr podle stavu"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="all">Všechny stavy</SelectItem>
              <SelectItem key="draft">Koncept</SelectItem>
              <SelectItem key="published">Publikováno</SelectItem>
              <SelectItem key="archived">Archivováno</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardBody className="p-0">
          {loading || categoriesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Načítání článků...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* TODO: replace table with Table component */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Obrázek</th>
                    <th className="text-left py-3 px-4 font-semibold">Název</th>
                    <th className="text-left py-3 px-4 font-semibold">Kategorie</th>
                    <th className="text-left py-3 px-4 font-semibold">Autor</th>
                    <th className="text-left py-3 px-4 font-semibold">Stav</th>
                    <th className="text-left py-3 px-4 font-semibold">Vytvořeno</th>
                    <th className="text-left py-3 px-4 font-semibold">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        {post.image_url ? (
                          <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                            <Image
                              src={post.image_url}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <PhotoIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{post.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{post.slug}</div>
                        </div>
                      </td>
                      {/* TODO: Add category name instead of tag */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {post.tags && post.tags.length > 0 ? (
                            post.tags.slice(0, 3).map((tag, index) => (
                              <Chip
                                key={index}
                                size="sm"
                                variant="bordered"
                                color="primary"
                                className="text-xs"
                              >
                                {tag}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">Žádné tagy</span>
                          )}
                          {post.tags && post.tags.length > 3 && (
                            <Chip size="sm" variant="bordered" color="default" className="text-xs">
                              +{post.tags.length - 3}
                            </Chip>
                          )}
                        </div>
                      </td>
                      {/* TODO: add author name instead of ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {post.author_id === 'default-user' ? 'Admin' : `ID: ${post.author_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDateString(post.created_at)} 
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            isIconOnly
                            onPress={() => handleEditPost(post)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => handleDeletePost(post)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {dbError || categoriesError ? 'Chyba databáze' : 'Žádné články'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    {dbError || categoriesError
                      ? "Nelze načíst články kvůli chybě databáze. Zkontrolujte konfiguraci Supabase."
                      : searchTerm || statusFilter !== "all" 
                        ? "Pro vybrané filtry nebyly nalezeny žádné články."
                        : "Zatím nebyly vytvořeny žádné články."
                    }
                  </p>
                  {(dbError || categoriesError) && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        <strong>Detaily chyby:</strong> {dbError || categoriesError}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Post Modal */}
      <AddPostModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        onSubmit={addPost}
        users={users}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSubmit={updatePost}
        post={selectedPost}
        users={users}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeletePostModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={deletePost}
        post={selectedPost}
      />
    </div>
  );
}
