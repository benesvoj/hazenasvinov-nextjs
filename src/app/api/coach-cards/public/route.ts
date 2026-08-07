import {NextRequest, NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';

import {getPublishedCoachCardsByCategory} from '@/queries/coachCards';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');

  if (!categoryId) {
    return NextResponse.json({error: 'categoryId is required'}, {status: 400});
  }

  try {
    // Reads through the service role because `coach_cards_with_categories` is no
    // longer readable by anon: querying the view directly used to expose cards
    // their owners never published. The publication filter now lives here,
    // server-side, where a caller cannot drop it.
    const result = await getPublishedCoachCardsByCategory({supabase: supabaseAdmin}, categoryId);

    if (result.error) {
      return NextResponse.json({error: result.error}, {status: 500});
    }

    return NextResponse.json({
      data: result.data,
      count: result.count,
    });
  } catch (error) {
    console.error('Error fetching public coach cards: ', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
