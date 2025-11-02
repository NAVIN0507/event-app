import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
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
      return NextResponse.json({ message: 'Only organizers can manage events' }, { status: 403 })
    }

    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1)

    if (eventResult.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = eventResult[0]

    // Check if user is the organizer
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ message: 'Not authorized to manage this event' }, { status: 403 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event for management:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
      return NextResponse.json({ message: 'Only organizers can manage events' }, { status: 403 })
    }

    // Check if event exists and user is the organizer
    const existingEvent = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1)

    if (existingEvent.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    if (existingEvent[0].organizerId !== session.user.id) {
      return NextResponse.json({ message: 'Not authorized to manage this event' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      date,
      time,
      location,
      isOnline,
      onlineLink,
      isPaid,
      price,
      image
    } = body

    // Validation
    if (!title || !date) {
      return NextResponse.json({ message: 'Title and date are required' }, { status: 400 })
    }

    if (!isOnline && !location) {
      return NextResponse.json({ message: 'Location is required for offline events' }, { status: 400 })
    }

    if (isPaid && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json({ message: 'Valid price is required for paid events' }, { status: 400 })
    }

    // Update event
    const updatedEvent = await db
      .update(events)
      .set({
        title,
        description: description || null,
        date: new Date(date),
        time: time || null,
        location: isOnline ? null : location,
        isOnline: Boolean(isOnline),
        onlineLink: isOnline ? onlineLink : null,
        isPaid: Boolean(isPaid),
        price: isPaid ? price : '0.00',
        image: image || null,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning()

    return NextResponse.json(updatedEvent[0])
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}