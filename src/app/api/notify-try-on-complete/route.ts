import { NextResponse } from 'next/server';

const completedJobsCache = new Map<string, { tryOnUrlMap?: Record<string, string>, categorization?: any, newBoard?: any }>();

export async function POST(req: Request) {
    try {
        const { boardId, tryOnUrlMap, categorization, newBoard } = await req.json();
        if (!boardId || (!tryOnUrlMap && !newBoard)) {
            return NextResponse.json({ error: 'Missing boardId or required data' }, { status: 400 });
        }
        
        completedJobsCache.set(boardId, { tryOnUrlMap, categorization, newBoard });
        console.log(`[notify-api] Cached completed data for board: ${boardId}`, newBoard ? '(auto-generated)' : '(manual)');

        setTimeout(() => {
            completedJobsCache.delete(boardId);
            console.log(`[notify-api] Cleared cached data for board: ${boardId}`);
        }, 5 * 60 * 1000); 

        return NextResponse.json({ message: 'Notification received' }, { status: 200 });
    } catch (error) {
        console.error('[notify-api] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
        return NextResponse.json({ error: 'Missing boardId query parameter' }, { status: 400 });
    }

    const result = completedJobsCache.get(boardId);

    if (result) {
        completedJobsCache.delete(boardId);
        return NextResponse.json({ status: 'completed', ...result });
    } else {
        return NextResponse.json({ status: 'processing' });
    }
}