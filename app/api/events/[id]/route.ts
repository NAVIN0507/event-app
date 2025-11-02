import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventResult = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        time: events.time,
        location: events.location,
        image: events.image,
        isOnline: events.isOnline,
        price: events.price,
        isPaid: events.isPaid,
        organizer: {
          name: users.name,
          organizationName: users.organizationName,
        },
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(eq(events.id, id))
      .limit(1)

    if (eventResult.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json(eventResult[0])
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}