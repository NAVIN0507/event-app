import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'organizer') {
      return NextResponse.json({ message: 'Only organizers can view attendees' }, { status: 403 })
    }

    // Get event details and verify organizer
    const eventResult = await db
      .select({
        id: events.id,
        title: events.title,
        date: events.date,
        organizerId: events.organizerId,
      })
      .from(events)
      .where(eq(events.id, id))
      .limit(1)

    if (eventResult.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = eventResult[0]

    // Check if user is the organizer
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ message: 'Not authorized to view attendees for this event' }, { status: 403 })
    }

    // Get attendees list
    const attendees = await db
      .select({
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
        registeredAt: usersToEvents.registeredAt,
        checkedIn: usersToEvents.checkedIn,
      })
      .from(usersToEvents)
      .leftJoin(users, eq(usersToEvents.userId, users.id))
      .where(eq(usersToEvents.eventId, id))
      .orderBy(usersToEvents.registeredAt)

    return NextResponse.json({
      event,
      attendees,
    })
  } catch (error) {
    console.error('Error fetching attendees:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}