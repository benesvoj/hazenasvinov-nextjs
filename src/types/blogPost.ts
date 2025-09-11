/**
 * Blog post type
 * @description Blog post type
 */
export interface BlogPost {
  /** Primary key */
  id: string;
  /** Title */
  title: string;
  /** URL-friendly identifier */
  slug: string;
  /** Full post content */
  content: string;
  /** Author ID */
  author_id: string;
  /** Status */
  status: string;
  /** Timestamp when the post was published */
  published_at?: string;
  /** Timestamp when the post was created */
  created_at: string;
  /** Timestamp when the post was last updated */
  updated_at?: string;
  /** Image URL */
  image_url?: string;
  /** Category ID, relation to categories table */
  category_id?: string;
  /** Optional reference to related match */
  match_id?: string;
}
