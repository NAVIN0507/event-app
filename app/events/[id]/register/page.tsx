import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { eq } from 'drizzle-orm'
import { format } from 'date-fns'
import { Calendar, MapPin, Clock, Globe, ArrowLeft } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

interface RegisterPageProps {
  params: {
    id: string
  }
}

async function registerForEvent(eventId: string, userId: string) {
  'use server'
  
  try {
    // Check if already registered
    const existing = await db
      .select()
      .from(usersToEvents)
      .where(
        eq(usersToEvents.eventId, eventId) && 
        eq(usersToEvents.userId, userId)
      )
      .limit(1)

    if (existing.length > 0) {
      return { success: false, error: 'Already registered' }
    }

    // Register user
    await db.insert(usersToEvents).values({
      eventId,
      userId,
    })

    return { success: true }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

const RegisterPage = async ({ params }: RegisterPageProps) => {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get event details
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
    .where(eq(events.id, params.id))
    .limit(1)

  if (eventResult.length === 0) {
    notFound()
  }

  const event = eventResult[0]

  // Check if already registered
  const existingRegistration = await db
    .select()
    .from(usersToEvents)
    .where(
      eq(usersToEvents.eventId, params.id) && 
      eq(usersToEvents.userId, session.user.id)
    )
    .limit(1)

  if (existingRegistration.length > 0) {
    redirect(`/events/${params.id}`)
  }

  const eventDate = new Date(event.date)
  const isUpcoming = eventDate > new Date()

  if (!isUpcoming) {
    redirect(`/events/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href={`/events/${params.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold">Register for Event</h1>
          </div>

          <div className="grid gap-6">
            {/* Event Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  by {event.organizer.organizationName || event.organizer.name}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {event.image && (
                  <div className="aspect-video relative overflow-hidden rounded-lg">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{format(eventDate, "PPP")}</span>
                    {event.time && (
                      <>
                        <Clock className="h-5 w-5 text-primary ml-2" />
                        <span>{event.time}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {event.isOnline ? (
                      <>
                        <Globe className="h-5 w-5 text-primary" />
                        <span>Online Event</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>{event.location}</span>
                      </>
                    )}
                  </div>
                </div>

                {event.description && (
                  <p className="text-muted-foreground line-clamp-3">
                    {event.description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Details</CardTitle>
                <CardDescription>
                  Confirm your registration for this event
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-medium">Event Price</span>
                    <span className="text-2xl font-bold">
                      {event.isPaid ? `₹${event.price}` : "Free"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Registering as: <strong>{session.user.name}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: <strong>{session.user.email}</strong>
                    </p>
                  </div>

                  {event.isPaid ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        You will be redirected to payment gateway to complete your registration.
                      </p>
                      <Button className="w-full" size="lg">
                        Proceed to Payment
                      </Button>
                    </div>
                  ) : (
                    <form action={async () => {
                      'use server'
                      const result = await registerForEvent(params.id, session.user.id)
                      if (result.success) {
                        redirect(`/events/${params.id}?registered=true`)
                      }
                    }}>
                      <Button type="submit" className="w-full" size="lg">
                        Register for Free
                      </Button>
                    </form>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    By registering, you agree to our terms and conditions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage