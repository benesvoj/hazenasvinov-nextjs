import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';

import {UpdateBlogPost} from '@/types';

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAuth(async (user, supabase) => {
    const {id} = await params;
    const {data, error} = await supabase.from('blog_posts').select('*').eq('id', id).single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Blog post not found', 404);
    }

    return successResponse(data);
  });
}

export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body: UpdateBlogPost = await request.json();

    // Remove id from body if present (it's in the URL)
    const {id: _, ...updateData} = body;

    const {data, error} = await admin
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Blog post not found', 404);
    }

    return successResponse(data);
  });
}

export async function DELETE(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;

    const {error} = await admin.from('blog_posts').delete().eq('id', id);

    if (error) throw error;

    return successResponse({message: 'Blog post deleted successfully'});
  });
}
