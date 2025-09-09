export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  category_id?: string;
}