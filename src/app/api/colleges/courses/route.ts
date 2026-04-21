import { NextRequest, NextResponse } from 'next/server';
import { getCourses } from '@/lib/services/colleges';


export async function GET(request: NextRequest) {
    try {
        const courses = await getCourses();

        return NextResponse.json({
            courses: courses.map(l => l.name).sort((a, b) => a.localeCompare(b)),
            totalCount: courses.length,
        });
    } catch (error) {
        console.error('Get courses error:', error);
        return NextResponse.json({ error: 'Failed to get courses' }, { status: 500 });
    }
}
