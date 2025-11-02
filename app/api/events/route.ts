import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'organizer') {
      return NextResponse.json({ message: 'Only organizers can create events' }, { status: 403 })
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

    // Create event
    const newEvent = await db.insert(events).values({
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
      organizerId: session.user.id,
    }).returning()

    return NextResponse.json(newEvent[0], { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}