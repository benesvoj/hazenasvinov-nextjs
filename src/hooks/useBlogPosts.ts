import {useState, useEffect, useCallback, useMemo} from 'react';
import {createClient} from '@/utils/supabase/client';
import {BlogPost} from '@/types';
import {useCategories, useDebounce} from '@/hooks';
import {showToast} from '@/components';
import {adminStatusFilterOptions, statusFilterToDbValue} from '@/constants';
import {createSearchablePost, searchPosts} from '@/utils/contentSearch';

interface User {
  id: string;
  email: string;
}

export interface UseBlogPostsResult {
  // Data
  posts: BlogPost[];
  users: User[];
  categories: any[];

  // Loading states
  loading: boolean;
  categoriesLoading: boolean;
  userError: string | null;
  dbError: string | null;
  categoriesError: string | null;

  // Search and filters
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  debouncedSearchTerm: string;

  // Computed data
  filteredPosts: any[];
  categoryLookupMap: Map<string, string>;

  // Actions
  fetchPosts: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
  addPost: (formData: Omit<BlogPost, 'id' | 'updated_at'>, imageFile: File | null) => Promise<void>;
  updatePost: (
    formData: Omit<BlogPost, 'id' | 'updated_at'> & {id: string},
    imageFile: File | null
  ) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  validatePostData: (formData: Omit<BlogPost, 'id' | 'updated_at'>, isUpdate?: boolean) => boolean;
}

export function useBlogPosts(): UseBlogPostsResult {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dbError, setDbError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use the categories hook
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    fetchCategories,
  } = useCategories();

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
        const {data: testData, error: testError} = await supabase
          .from('blog_posts')
          .select('id')
          .limit(1);

        if (testError) {
          console.error('Database connection test failed:', testError);

          // Check if it's a table not found error
          if (
            testError.message &&
            testError.message.includes('relation "blog_posts" does not exist')
          ) {
            const errorMsg =
              'The blog_posts table does not exist. Please run the create_blog_posts_table.sql script in your Supabase database.';
            console.error(errorMsg);
            setDbError(errorMsg);
          } else if (
            testError.code === '42501' &&
            testError.message.includes('permission denied')
          ) {
            const errorMsg =
              'Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features.';
            setDbError(errorMsg);
          } else {
            setDbError(`Database connection failed: ${testError.message || 'Unknown error'}`);
          }

          throw testError;
        }

        setDbError(null); // Clear any previous errors
      } catch (connectionError) {
        if (!dbError) {
          setDbError('Failed to connect to database. Please check your Supabase configuration.');
        }
        throw connectionError;
      }

      const {data, error} = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', {ascending: false});

      if (error) {
        console.error('Database query error:', error);

        // Check for specific permission errors
        if (error.code === '42501' && error.message.includes('permission denied')) {
          setDbError(
            'Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features.'
          );
        } else {
          setDbError(`Database query failed: ${error.message || 'Unknown error'}`);
        }

        throw error;
      }

      setPosts(data || []);
    } catch (error) {
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
        setUsers([
          {
            id: 'default-user',
            email: 'admin@hazenasvinov.cz',
          },
        ]);
        return;
      }

      // Check if supabase client is properly initialized
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('Supabase client not properly initialized');
        setUsers([
          {
            id: 'default-user',
            email: 'admin@hazenasvinov.cz',
          },
        ]);
        return;
      }

      // Try to get the current user from auth (this doesn't require table access)
      const {
        data: {user},
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setUsers([
          {
            id: 'default-user',
            email: 'admin@hazenasvinov.cz',
          },
        ]);
        return;
      }

      // If we have a user, use the current user
      if (user) {
        setUsers([
          {
            id: user.id,
            email: user.email || 'unknown@example.com',
          },
        ]);
      } else {
        // No user, use fallback user
        setUsers([
          {
            id: 'default-user',
            email: 'admin@hazenasvinov.cz',
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);

      // Always fall back to default user on any error
      setUsers([
        {
          id: 'default-user',
          email: 'admin@hazenasvinov.cz',
        },
      ]);
    }
  }, [supabase]);

  // Upload image to Supabase storage
  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `blog-images/${fileName}`;

        // Upload to Supabase storage
        const {error: uploadError} = await supabase.storage
          .from('blog-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          return null;
        }

        // Get public URL
        const {
          data: {publicUrl},
        } = supabase.storage.from('blog-images').getPublicUrl(filePath);

        return publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        return null;
      }
    },
    [supabase]
  );

  // Validation function for blog posts
  const validatePostData = useCallback(
    (formData: Omit<BlogPost, 'id' | 'updated_at'>, isUpdate: boolean = false) => {
      const requiredFields = isUpdate
        ? ['title', 'slug', 'content']
        : ['title', 'slug', 'content', 'status', 'category_id'];

      const missingFields = requiredFields.filter((field) => !(formData as any)[field]);

      if (missingFields.length > 0) {
        const message = isUpdate
          ? `Missing required fields for update: ${missingFields.join(', ')}`
          : `Missing required fields for new post: ${missingFields.join(', ')}`;

        showToast.warning(message);
        return false;
      }

      return true;
    },
    []
  );

  // Add new post
  const addPost = useCallback(
    async (formData: Omit<BlogPost, 'id' | 'updated_at'>, imageFile: File | null) => {
      try {
        // Validate required fields
        if (!validatePostData(formData, false)) {
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

        // Check if table exists and has proper structure
        try {
          const {data: tableCheck, error: tableCheckError} = await supabase
            .from('blog_posts')
            .select('id')
            .limit(1);

          if (tableCheckError) {
            console.error('Table structure check failed:', tableCheckError);
            if (
              tableCheckError.message &&
              tableCheckError.message.includes('relation "blog_posts" does not exist')
            ) {
              const errorMsg =
                'The blog_posts table does not exist. Please run the create_blog_posts_table.sql script in your Supabase database.';
              console.error(errorMsg);
              setDbError(errorMsg);
              return;
            } else if (
              tableCheckError.code === '42501' &&
              tableCheckError.message.includes('permission denied')
            ) {
              const errorMsg =
                'Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features.';
              setDbError(errorMsg);
              return;
            } else {
              setDbError(
                `Database connection failed: ${tableCheckError.message || 'Unknown error'}`
              );
              return;
            }
          }
        } catch (tableCheckError) {
          console.error('Error checking table structure:', tableCheckError);
        }

        // Prepare insert data (only include fields that exist)
        const insertData: any = {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          author_id: authorId,
          status: formData.status,
          category_id: formData.category_id,
          match_id: formData.match_id || null, // Include match_id
          published_at: formData.status === 'published' ? new Date().toISOString() : null,
          created_at: formData.created_at
            ? new Date(formData.created_at).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Only add image_url if the column exists (will be handled by database)
        if (imageUrl) {
          insertData.image_url = imageUrl;
        }

        const {data, error} = await supabase.from('blog_posts').insert([insertData]).select();

        if (error) {
          console.error('Supabase error adding post:', error);

          // Check if it's a column not found error
          if (error.code === 'PGRST204' && error.message.includes('image_url')) {
            console.error(
              'The image_url column does not exist. Please run the add_image_url_to_blog_posts.sql script first.'
            );
            // Try inserting without image_url
            const {image_url, ...insertDataWithoutImage} = insertData;
            const {data: retryData, error: retryError} = await supabase
              .from('blog_posts')
              .insert([insertDataWithoutImage])
              .select();

            if (retryError) {
              throw retryError;
            }
          } else {
            throw error;
          }
        }

        fetchPosts();
      } catch (error) {
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
    },
    [validatePostData, uploadImage, supabase, fetchPosts]
  );

  // Update existing post
  const updatePost = useCallback(
    async (
      formData: Omit<BlogPost, 'id' | 'updated_at'> & {id: string},
      imageFile: File | null
    ) => {
      try {
        // Validate required fields
        if (!validatePostData(formData, true)) {
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

        // Prepare update data (only include fields that exist)
        const updateData: any = {
          title: formData.title,
          slug: formData.slug,
          content: formData.content,
          author_id: authorId,
          status: formData.status,
          category_id: formData.category_id,
          match_id: formData.match_id || null, // Include match_id
          created_at: formData.created_at ? new Date(formData.created_at).toISOString() : undefined,
          updated_at: new Date().toISOString(),
        };

        // Only add image_url if the column exists (will be handled by database)
        if (imageUrl) {
          updateData.image_url = imageUrl;
        }

        // Add published_at if status is published
        if (formData.status === 'published') {
          updateData.published_at = new Date().toISOString();
        }

        const {data, error} = await supabase
          .from('blog_posts')
          .update(updateData)
          .eq('id', formData.id)
          .select();

        if (error) {
          console.error('Supabase error updating post:', error);

          // Check if it's a column not found error
          if (error.code === 'PGRST204' && error.message.includes('image_url')) {
            console.error(
              'The image_url column does not exist. Please run the add_image_url_to_blog_posts.sql script first.'
            );
            // Try updating without image_url
            const {image_url, ...updateDataWithoutImage} = updateData;
            const {data: retryData, error: retryError} = await supabase
              .from('blog_posts')
              .update(updateDataWithoutImage)
              .eq('id', formData.id)
              .select();

            if (retryError) {
              throw retryError;
            }
          } else {
            throw error;
          }
        }

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
    },
    [validatePostData, uploadImage, supabase, fetchPosts]
  );

  // Delete post
  const deletePost = useCallback(
    async (postId: string) => {
      try {
        const {error} = await supabase.from('blog_posts').delete().eq('id', postId);

        if (error) throw error;

        fetchPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    },
    [supabase, fetchPosts]
  );

  // Initial data fetch
  useEffect(() => {
    fetchPosts();
    fetchUsers();
    fetchCategories();
  }, [fetchPosts, fetchUsers, fetchCategories]);

  // Create searchable posts with content excerpts
  const searchablePosts = useMemo(() => posts.map(createSearchablePost), [posts]);

  // Memoized category lookup map for performance
  const categoryLookupMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  // Filter posts based on debounced search and status
  const filteredPosts = useMemo(() => {
    return searchablePosts.filter((post) => {
      const matchesSearch = searchPosts([post], debouncedSearchTerm).length > 0;
      const dbStatusValue =
        statusFilterToDbValue[statusFilter as keyof typeof statusFilterToDbValue];
      const matchesStatus = statusFilter === 'all' || post.status === dbStatusValue;
      return matchesSearch && matchesStatus;
    });
  }, [searchablePosts, debouncedSearchTerm, statusFilter]);

  return {
    // Data
    posts,
    users,
    categories,

    // Loading states
    loading,
    categoriesLoading,
    userError,
    dbError,
    categoriesError,

    // Search and filters
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    debouncedSearchTerm,

    // Computed data
    filteredPosts,
    categoryLookupMap,

    // Actions
    fetchPosts,
    fetchUsers,
    uploadImage,
    addPost,
    updatePost,
    deletePost,
    validatePostData,
  };
}
