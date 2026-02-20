import {NextRequest, NextResponse} from 'next/server';

import {supabaseServerClient} from '@/utils/supabase/server';

import {getPublishedCoachCadsByCategory} from '@/queries/coachCards';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');

  if (!categoryId) {
    return NextResponse.json({error: 'categoryId is required'}, {status: 400});
  }

  try {
    const supabase = await supabaseServerClient();
    const result = await getPublishedCoachCadsByCategory({supabase}, categoryId);

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
