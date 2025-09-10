"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, Button, Input, useDisclosure, Select, SelectItem, Chip, Image } from "@heroui/react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  PhotoIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { BlogPost } from "@/types";
import { useCategories } from "@/hooks/useCategories";
import { AddPostModal, EditPostModal, DeletePostModal } from "./components";
import { formatDateString } from "@/helpers";
import { AdminContainer } from "../components/AdminContainer";
import { translations } from "@/lib/translations";
import { showToast, LoadingSpinner } from "@/components";
import { adminStatusFilterOptions } from "@/constants";
import { useDebounce } from "@/hooks/useDebounce";
import { createSearchablePost, searchPosts } from "@/utils/contentSearch";

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
  
  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [userError, setUserError] = useState<string | null>(null);

  const t = translations.admin.posts;

  // Use the categories hook
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    fetchCategoriesFull,
  } = useCategories();

  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const supabase = createClient();

  // Fetch blog posts
  const fetchPosts = useCallback(async () => {
    try {
      // Check if supabase client is properly initialized
      if (!supabase || typeof supabase.from !== "function") {
        console.error("Supabase client not properly initialized");
        setPosts([]);
        setDbError("Supabase client not properly initialized");
        return;
      }

      setLoading(true);

      try {
        const { data: testData, error: testError } = await supabase
          .from("blog_posts")
          .select("id")
          .limit(1);

        if (testError) {
          console.error("Database connection test failed:", testError);

          // Check if it's a table not found error
          if (
            testError.message &&
            testError.message.includes('relation "blog_posts" does not exist')
          ) {
            const errorMsg =
              "The blog_posts table does not exist. Please run the create_blog_posts_table.sql script in your Supabase database.";
            console.error(errorMsg);
            setDbError(errorMsg);
          } else if (
            testError.code === "42501" &&
            testError.message.includes("permission denied")
          ) {
            const errorMsg =
              "Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features.";
            setDbError(errorMsg);
          } else {
            setDbError(
              `Database connection failed: ${
                testError.message || "Unknown error"
              }`
            );
          }

          throw testError;
        }

        setDbError(null); // Clear any previous errors
      } catch (connectionError) {
        if (!dbError) {
          setDbError(
            "Failed to connect to database. Please check your Supabase configuration."
          );
        }
        throw connectionError;
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database query error:", error);

        // Check for specific permission errors
        if (
          error.code === "42501" &&
          error.message.includes("permission denied")
        ) {
          setDbError(
            "Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features."
          );
        } else {
          setDbError(
            `Database query failed: ${error.message || "Unknown error"}`
          );
        }

        throw error;
      }

      setPosts(data || []);
    } catch (error) {
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else if (error && typeof error === "object") {
        console.error("Error object:", JSON.stringify(error, null, 2));
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
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.warn(
          "Supabase environment variables not configured. Cannot fetch users."
        );
        setUsers([
          {
            id: "default-user",
            email: "admin@hazenasvinov.cz",
          },
        ]);
        return;
      }

      // Check if supabase client is properly initialized
      if (!supabase || typeof supabase.from !== "function") {
        console.error("Supabase client not properly initialized");
        setUsers([
          {
            id: "default-user",
            email: "admin@hazenasvinov.cz",
          },
        ]);
        return;
      }

      // Try to get the current user from auth (this doesn't require table access)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setUsers([
          {
            id: "default-user",
            email: "admin@hazenasvinov.cz",
          },
        ]);
        return;
      }

      // If we have a user, use the current user
      if (user) {
        setUsers([
          {
            id: user.id,
            email: user.email || "unknown@example.com",
          },
        ]);
      } else {
        // No user, use fallback user
        setUsers([
          {
            id: "default-user",
            email: "admin@hazenasvinov.cz",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);

      // Always fall back to default user on any error
      setUsers([
        {
          id: "default-user",
          email: "admin@hazenasvinov.cz",
        },
      ]);
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
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
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
      if (
        !formData.title ||
        !formData.slug ||
        !formData.content ||
        !formData.status ||
        !formData.category_id
      ) {
        showToast.warning("Missing required fields for new post");
        return;
      }

      // Ensure author_id is set
      const authorId = formData.author_id || "default-user";

      // Upload image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          console.error("Failed to upload image");
          // Continue without image
        }
      }

      // Check if table exists and has proper structure
      try {
        const { data: tableCheck, error: tableCheckError } = await supabase
          .from("blog_posts")
          .select("id")
          .limit(1);

        if (tableCheckError) {
          console.error("Table structure check failed:", tableCheckError);
          if (
            tableCheckError.message &&
            tableCheckError.message.includes(
              'relation "blog_posts" does not exist'
            )
          ) {
            const errorMsg =
              "The blog_posts table does not exist. Please run the create_blog_posts_table.sql script in your Supabase database.";
            console.error(errorMsg);
            setDbError(errorMsg);
            return;
          } else if (
            tableCheckError.code === "42501" &&
            tableCheckError.message.includes("permission denied")
          ) {
            const errorMsg =
              "Permission denied for blog_posts table. This is normal for unauthenticated users. Please log in to access admin features.";
            setDbError(errorMsg);
            return;
          } else {
            setDbError(
              `Database connection failed: ${
                tableCheckError.message || "Unknown error"
              }`
            );
            return;
          }
        }
      } catch (tableCheckError) {
        console.error("Error checking table structure:", tableCheckError);
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
        published_at:
          formData.status === "published" ? new Date().toISOString() : null,
        created_at: formData.created_at
          ? new Date(formData.created_at).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Only add image_url if the column exists (will be handled by database)
      if (imageUrl) {
        insertData.image_url = imageUrl;
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .insert([insertData])
        .select();

      if (error) {
        console.error("Supabase error adding post:", error);

        // Check if it's a column not found error
        if (error.code === "PGRST204" && error.message.includes("image_url")) {
          console.error(
            "The image_url column does not exist. Please run the add_image_url_to_blog_posts.sql script first."
          );
          // Try inserting without image_url
          const { image_url, ...insertDataWithoutImage } = insertData;
          const { data: retryData, error: retryError } = await supabase
            .from("blog_posts")
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
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else if (error && typeof error === "object") {
        console.error("Error object:", JSON.stringify(error, null, 2));
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
      if (
        !formData.title ||
        !formData.slug ||
        !formData.content
      ) {
        console.error("Missing required fields for update:", {
          title: !!formData.title,
          slug: !!formData.slug,
          content: !!formData.content,
        });
        return;
      }

      // Ensure author_id is set
      const authorId = formData.author_id || "default-user";

      // Upload image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          console.error("Failed to upload image");
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
        created_at: formData.created_at
          ? new Date(formData.created_at).toISOString()
          : undefined,
        updated_at: new Date().toISOString(),
      };

      // Only add image_url if the column exists (will be handled by database)
      if (imageUrl) {
        updateData.image_url = imageUrl;
      }

      // Add published_at if status is published
      if (formData.status === "published") {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", selectedPost.id)
        .select();

      if (error) {
        console.error("Supabase error updating post:", error);

        // Check if it's a column not found error
        if (error.code === "PGRST204" && error.message.includes("image_url")) {
          console.error(
            "The image_url column does not exist. Please run the add_image_url_to_blog_posts.sql script first."
          );
          // Try updating without image_url
          const { image_url, ...updateDataWithoutImage } = updateData;
          const { data: retryData, error: retryError } = await supabase
            .from("blog_posts")
            .update(updateDataWithoutImage)
            .eq("id", selectedPost.id)
            .select();

          if (retryError) {
            throw retryError;
          }
        } else {
          throw error;
        }
      }
      
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error("Error updating post:", error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else if (error && typeof error === "object") {
        console.error("Error object:", JSON.stringify(error, null, 2));
      }
    }
  };

  // Delete post
  const deletePost = async () => {
    if (!selectedPost) return;

    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", selectedPost.id);

      if (error) throw error;

      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Create searchable posts with content excerpts
  const searchablePosts = posts.map(createSearchablePost);
  
  // Filter posts based on debounced search and status
  const filteredPosts = searchablePosts.filter((post) => {
    const matchesSearch = searchPosts([post], debouncedSearchTerm).length > 0;
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Chip color="success" variant="flat">
            {adminStatusFilterOptions.published}
          </Chip>
        );
      case "draft":
        return (
          <Chip color="warning" variant="flat">
            {adminStatusFilterOptions.draft}
          </Chip>
        );
      case "archived":
        return (
          <Chip color="secondary" variant="flat">
            {adminStatusFilterOptions.archived}
          </Chip>
        );
      default:
        return null;
    }
  };

  return (
    <AdminContainer
      title={t.title}
      description={t.description}
      icon={<DocumentTextIcon className="w-8 h-8 text-blue-600" />}
      actions={
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={handleAddPost}
        >
          {t.addPost}
        </Button>
      }
    >
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
              onSelectionChange={(keys) =>
                setStatusFilter(Array.from(keys)[0] as string)
              }
              className="w-full md:w-48"
            >
              {Object.entries(adminStatusFilterOptions).map(([key, value]) => (
                <SelectItem key={key}>
                  {value}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardBody className="p-0">
          {loading || categoriesLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* TODO: replace table with Table component */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">
                      Obrázek
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Název</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Kategorie
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Autor</th>
                    <th className="text-left py-3 px-4 font-semibold">Stav</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Vytvořeno
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-4">
                        {post.image_url ? (
                          <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                            <Image
                              src={post.image_url}
                              alt={post.title}
                              width={64}
                              height={64}
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
                          <div className="font-medium text-gray-900 dark:text-white">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {post.slug}
                          </div>
                        </div>
                      </td>
                      {/* TODO: Add category name instead of tag */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {post.category_id !== null ? categories.find((category) => category.id === post.category_id)?.name : "-"}
                        </div>
                      </td>
                      {/* TODO: add author name instead of ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {post.author_id === "default-user"
                              ? "Admin"
                              : `ID: ${post.author_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
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
                    {dbError || categoriesError
                      ? "Chyba databáze"
                      : "Žádné články"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    {dbError || categoriesError
                      ? "Nelze načíst články kvůli chybě databáze. Zkontrolujte konfiguraci Supabase."
                      : searchTerm || statusFilter !== "all"
                      ? "Pro vybrané filtry nebyly nalezeny žádné články."
                      : "Zatím nebyly vytvořeny žádné články."}
                  </p>
                  {(dbError || categoriesError) && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        <strong>Detaily chyby:</strong>{" "}
                        {dbError || categoriesError}
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
    </AdminContainer>
  );
}
