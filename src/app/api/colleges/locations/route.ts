import { NextRequest, NextResponse } from 'next/server';
import { getLocations } from '@/lib/services/colleges';


export async function GET(request: NextRequest) {
    try {
        const locations = await getLocations();

        return NextResponse.json({
            locations: locations.map(l => l.name).sort((a, b) => a.localeCompare(b)),
            totalCount: locations.length,
        });
    } catch (error) {
        console.error('Get locations error:', error);
        return NextResponse.json({ error: 'Failed to get locations' }, { status: 500 });
    }
}
