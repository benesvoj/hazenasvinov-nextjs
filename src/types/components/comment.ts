export interface Comment {
  id: string;
  content: string;
  author: string;
  user_email: string;
  created_at: string;
  type: 'general' | 'bug' | 'feature' | 'improvement';
}
