'use client';

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  PhotoIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import Image from 'next/image';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  image_url?: string;
}

interface User {
  id: string;
  email: string;
}

interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dbError, setDbError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    author_id: "",
    status: "draft" as 'draft' | 'published' | 'archived',
    tags: [] as string[],
    image_url: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const supabase = createClient();

  // Test Supabase connection
  const testConnection = useCallback(async () => {
    try {
      console.log('=== SUPABASE CONNECTION TEST ===');
      console.log('Testing Supabase connection...');
      
      // Check environment variables
      console.log('Environment variables check:');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const errorMsg = 'Supabase environment variables are not configured. Please check your .env.local file.';
        console.error(errorMsg);
        setDbError(errorMsg);
        return false;
      }

      // Check if the values look valid
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('URL format check:', url?.startsWith('https://') ? '✅ Valid format' : '❌ Invalid format');
      console.log('Key format check:', key?.startsWith('eyJ') ? '✅ Valid format' : '❌ Invalid format');
      
      if (!url?.startsWith('https://')) {
        const errorMsg = 'Invalid Supabase URL format. Should start with https://';
        console.error(errorMsg);
        setDbError(errorMsg);
        return false;
      }
      
      if (!key?.startsWith('eyJ')) {
        const errorMsg = 'Invalid Supabase key format. Should start with eyJ';
        console.error(errorMsg);
        setDbError(errorMsg);
        return false;
      }

      // Check if supabase client is properly initialized
      console.log('Supabase client check:');
      console.log('Client exists:', !!supabase);
      console.log('Client type:', typeof supabase);
      console.log('Client methods:', supabase ? Object.keys(supabase) : 'No client');
      
      if (!supabase || typeof supabase.from !== 'function') {
        const errorMsg = 'Supabase client not properly initialized';
        console.error(errorMsg);
        setDbError(errorMsg);
        return false;
      }

      // Test basic connection
      console.log('Testing auth.getSession()...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Connection test failed:', error);
        setDbError(`Connection test failed: ${error.message}`);
        return false;
      }

      console.log('✅ Connection test successful');
      console.log('Session data:', data);
      setDbError(null);
      return true;
    } catch (error) {
      console.error('Connection test error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDbError(`Connection test error: ${errorMessage}`);
      return false;
    }
  }, [supabase]);

  // Fetch blog posts
  const fetchPosts = useCallback(async () => {
    try {
      // First test the connection
      const isConnected = await testConnection();
      if (!isConnected) {
        setPosts([]);
        return;
      }

      // Check if supabase client is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('Supabase client not properly initialized');
        setPosts([]);
        setDbError('Supabase client not properly initialized');
        return;
      }

      setLoading(true);
      
      // Test the connection first
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
  }, [supabase, dbError, testConnection]);

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.log('Session error, using fallback users:', sessionError);
        setUsers([{
          id: 'default-user',
          email: 'admin@hazenasvinov.cz'
        }]);
        return;
      }

      // If we have a session, use the current user
      if (session?.user) {
        console.log('Authenticated user found:', session.user.email);
        setUsers([{
          id: session.user.id,
          email: session.user.email || 'unknown@example.com'
        }]);
      } else {
        // No session, use fallback user
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

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables not configured. Cannot fetch categories.');
        setCategories([{ id: 'default-category', code: 'uncategorized', name: 'Nezaradené' }]);
        return;
      }

      // Check if supabase client is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('Supabase client not properly initialized');
        setCategories([{ id: 'default-category', code: 'uncategorized', name: 'Nezaradené' }]);
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        setCategories([{ id: 'default-category', code: 'uncategorized', name: 'Nezaradené' }]);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([{ id: 'default-category', code: 'uncategorized', name: 'Nezaradené' }]);
    }
  }, [supabase]);

  // Initial data fetch
  useEffect(() => {
    fetchPosts();
    fetchUsers();
    fetchCategories();
  }, [fetchPosts, fetchUsers, fetchCategories]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug when title changes
    if (field === 'title') {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  // Handle tag input changes
  const handleTagInputChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags: tags }));
  };

  // Handle image file selection
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview("");
    }
  };

  // Upload image to Supabase storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
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
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      author_id: "default-user", // Set default author instead of empty string
      status: "draft",
      tags: [],
      image_url: ""
    });
    setImageFile(null);
    setImagePreview("");
  };

  // Open add post modal
  const handleAddPost = () => {
    resetForm();
    onAddOpen();
  };

  // Handle edit post
  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      author_id: post.author_id,
      status: post.status,
      tags: post.tags || [],
      image_url: post.image_url || ""
    });
    // Set image preview if post has an image
    if (post.image_url) {
      setImagePreview(post.image_url);
      setImageFile(null); // No file selected when editing
    } else {
      setImagePreview("");
      setImageFile(null);
    }
    onEditOpen();
  };

  // Open delete post modal
  const handleDeletePost = (post: BlogPost) => {
    setSelectedPost(post);
    onDeleteOpen();
  };

  // Add new post
  const addPost = async () => {
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
        created_at: new Date().toISOString(),
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
      
      onAddClose();
      resetForm();
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
  const updatePost = async () => {
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
      
      onEditClose();
      setSelectedPost(null);
      resetForm();
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
      
      onDeleteClose();
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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Publikováno</span>;
      case 'draft':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Koncept</span>;
      case 'archived':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Archivováno</span>;
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

      {/* Connection Status */}
      <Card className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  Stav připojení
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dbError ? '❌ Chyba připojení' : '✅ Připojeno k Supabase'}
                </p>
              </div>
            </div>
            <Button 
              color="secondary" 
              variant="bordered"
              size="sm"
              onPress={async () => {
                await testConnection();
              }}
            >
              Test Connection
            </Button>
          </div>
          {dbError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">Chyba:</p>
              <p className="text-sm text-red-600 mt-1">{dbError}</p>
              <div className="mt-2 text-xs text-red-500">
                <strong>Řešení:</strong>
                <ul className="mt-1 ml-4 list-disc">
                  <li>Zkontrolujte soubor .env.local v kořenovém adresáři projektu</li>
                  <li>Ujistěte se, že NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY jsou správně nastaveny</li>
                  <li>Restartujte vývojový server (npm run dev)</li>
                  <li>Zkontrolujte, zda je váš Supabase projekt aktivní</li>
                </ul>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Configuration Error Message */}
      {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Supabase není nakonfigurován
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Pro správné fungování aplikace je potřeba nastavit Supabase environment proměnné. 
                  Vytvořte soubor .env.local s NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Database Error Message */}
      {dbError && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Chyba databáze
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  {dbError}
                </p>
                {dbError.includes('table does not exist') && (
                  <div className="mt-2 text-xs text-orange-500 dark:text-orange-400">
                    <strong>Řešení:</strong> Spusťte SQL skript create_blog_posts_table.sql ve vaší Supabase databázi.
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Permission Info Message */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Informace o oprávněních
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Chyba &quot;permission denied for table users&quot; je normální pro nepřihlášené uživatele. 
                Aplikace používá fallback uživatele pro správné fungování.
              </p>
              <div className="mt-2 text-xs text-blue-500 dark:text-blue-400">
                <strong>Poznámka:</strong> Pro plný přístup k databázi se přihlaste pomocí Supabase Auth.
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

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
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Načítání článků...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Obrázek</th>
                    <th className="text-left py-3 px-4 font-semibold">Název</th>
                    <th className="text-left py-3 px-4 font-semibold">Tagy</th>
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
                            {new Date(post.created_at).toLocaleDateString('cs-CZ')}
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
                    {dbError ? 'Chyba databáze' : 'Žádné články'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    {dbError 
                      ? "Nelze načíst články kvůli chybě databáze. Zkontrolujte konfiguraci Supabase."
                      : searchTerm || statusFilter !== "all" 
                        ? "Pro vybrané filtry nebyly nalezeny žádné články."
                        : "Zatím nebyly vytvořeny žádné články."
                    }
                  </p>
                  {dbError && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        <strong>Detaily chyby:</strong> {dbError}
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
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Nový článek</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Název článku"
                  placeholder="Zadejte název článku"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  isRequired
                />
                <Input
                  label="Slug (URL)"
                  placeholder="automaticky generováno"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  isRequired
                />
                <Select
                  label="Autor"
                  placeholder="Vyberte autora"
                  selectedKeys={formData.author_id ? [formData.author_id] : []}
                  onSelectionChange={(keys) => handleInputChange('author_id', Array.from(keys)[0] as string)}
                  isRequired
                >
                  {users.map((user) => (
                    <SelectItem key={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Stav"
                  placeholder="Vyberte stav"
                  selectedKeys={[formData.status]}
                  onSelectionChange={(keys) => handleInputChange('status', Array.from(keys)[0] as string)}
                  isRequired
                >
                  <SelectItem key="draft">Koncept</SelectItem>
                  <SelectItem key="published">Publikováno</SelectItem>
                  <SelectItem key="archived">Archivováno</SelectItem>
                </Select>
                <Input
                  label="Tagy"
                  placeholder="tag1, tag2, tag3"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  description="Tagy oddělené čárkami"
                />
                
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategorie
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Chip
                          key={category.id}
                          variant={formData.tags.includes(category.name) ? "solid" : "bordered"}
                          color={formData.tags.includes(category.name) ? "primary" : "default"}
                          onClose={formData.tags.includes(category.name) ? () => {
                            setFormData(prev => ({
                              ...prev,
                              tags: prev.tags.filter(tag => tag !== category.name)
                            }));
                          } : undefined}
                          className="cursor-pointer"
                          onClick={() => {
                            if (!formData.tags.includes(category.name)) {
                              setFormData(prev => ({
                                ...prev,
                                tags: [...prev.tags, category.name]
                              }));
                            }
                          }}
                        >
                          {category.name}
                        </Chip>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Klikněte na kategorii pro přidání/odebrání
                    </p>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Obrázek článku
                  </label>
                  
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Odstranit obrázek"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Obrázek bude nahrán při uložení článku
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                              Nahrajte obrázek
                            </span>
                            <span className="text-gray-500"> nebo přetáhněte</span>
                          </label>
                          <input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            disabled={uploadingImage}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF do 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Perex
                  </label>
                  <Textarea
                    placeholder="Krátký popis článku"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Obsah článku <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Zde napište obsah článku..."
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={12}
                    required
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={addPost}>
              Vytvořit článek
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Post Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Upravit článek</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Název článku"
                  placeholder="Zadejte název článku"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  isRequired
                />
                <Input
                  label="Slug (URL)"
                  placeholder="automaticky generováno"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  isRequired
                />
                <Select
                  label="Autor"
                  placeholder="Vyberte autora"
                  selectedKeys={formData.author_id ? [formData.author_id] : []}
                  onSelectionChange={(keys) => handleInputChange('author_id', Array.from(keys)[0] as string)}
                  isRequired
                >
                  {users.map((user) => (
                    <SelectItem key={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Stav"
                  placeholder="Vyberte stav"
                  selectedKeys={[formData.status]}
                  onSelectionChange={(keys) => handleInputChange('status', Array.from(keys)[0] as string)}
                  isRequired
                >
                  <SelectItem key="draft">Koncept</SelectItem>
                  <SelectItem key="published">Publikováno</SelectItem>
                  <SelectItem key="archived">Archivováno</SelectItem>
                </Select>
                <Input
                  label="Tagy"
                  placeholder="tag1, tag2, tag3"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  description="Tagy oddělené čárkami"
                />
                
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategorie
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Chip
                          key={category.id}
                          variant={formData.tags.includes(category.name) ? "solid" : "bordered"}
                          color={formData.tags.includes(category.name) ? "primary" : "default"}
                          onClose={formData.tags.includes(category.name) ? () => {
                            setFormData(prev => ({
                              ...prev,
                              tags: prev.tags.filter(tag => tag !== category.name)
                            }));
                          } : undefined}
                          className="cursor-pointer"
                          onClick={() => {
                            if (!formData.tags.includes(category.name)) {
                              setFormData(prev => ({
                                ...prev,
                                tags: [...prev.tags, category.name]
                              }));
                            }
                          }}
                        >
                          {category.name}
                        </Chip>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Klikněte na kategorii pro přidání/odebrání
                    </p>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Obrázek článku
                  </label>
                  
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Odstranit obrázek"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Obrázek bude nahrán při uložení článku
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                              Nahrajte obrázek
                            </span>
                            <span className="text-gray-500"> nebo přetáhněte</span>
                          </label>
                          <input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            disabled={uploadingImage}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF do 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Perex
                  </label>
                  <Textarea
                    placeholder="Krátký popis článku"
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Obsah článku <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Zde napište obsah článku..."
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={12}
                    required
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditClose}>
              Zrušit
            </Button>
            <Button color="primary" onPress={updatePost}>
              Uložit změny
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>Smazat článek</ModalHeader>
          <ModalBody>
            <p>
              Opravdu chcete smazat článek <strong>&ldquo;{selectedPost?.title}&rdquo;</strong>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Tato akce je nevratná.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              Zrušit
            </Button>
            <Button color="danger" onPress={deletePost}>
              Smazat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
