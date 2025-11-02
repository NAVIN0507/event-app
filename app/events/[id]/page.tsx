import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { eq, count } from 'drizzle-orm'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Clock, Globe, User, Building } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

interface EventDetailPageProps {
  params: {
    id: string
  }
}

const EventDetailPage = async ({ params }: EventDetailPageProps) => {
  const session = await getServerSession(authOptions)
  
  // Get event details with organizer info
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
      onlineLink: events.onlineLink,
      price: events.price,
      isPaid: events.isPaid,
      organizerId: events.organizerId,
      organizer: {
        name: users.name,
        email: users.email,
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

  // Get attendee count
  const attendeeCount = await db
    .select({ count: count() })
    .from(usersToEvents)
    .where(eq(usersToEvents.eventId, params.id))

  // Check if current user is registered
  let isRegistered = false
  if (session?.user?.id) {
    const registration = await db
      .select()
      .from(usersToEvents)
      .where(
        eq(usersToEvents.eventId, params.id) && 
        eq(usersToEvents.userId, session.user.id)
      )
      .limit(1)
    
    isRegistered = registration.length > 0
  }

  const eventDate = new Date(event.date)
  const isUpcoming = eventDate > new Date()
  const isOrganizer = session?.user?.id === event.organizerId

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.image && (
              <div className="aspect-video relative overflow-hidden rounded-lg">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            {/* Event Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-3xl">{event.title}</CardTitle>
                  <Badge variant={isUpcoming ? "default" : "secondary"}>
                    {isUpcoming ? "Upcoming" : "Past"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Date and Time */}
                <div className="flex items-center gap-4 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>{format(eventDate, "PPPP")}</span>
                  {event.time && (
                    <>
                      <Clock className="h-5 w-5 text-primary ml-4" />
                      <span>{event.time}</span>
                    </>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-4 text-lg">
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

                {/* Attendees */}
                <div className="flex items-center gap-4 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{attendeeCount[0]?.count || 0} attendees</span>
                </div>

                {/* Description */}
                {event.description && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">About This Event</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Online Link for registered users */}
                {event.isOnline && event.onlineLink && (isRegistered || isOrganizer) && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Join Online</h4>
                    <a 
                      href={event.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {event.onlineLink}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {event.isPaid ? `₹${event.price}` : "Free"}
                </CardTitle>
                <CardDescription>
                  {isRegistered ? "You're registered!" : "Join this event"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {session ? (
                  isOrganizer ? (
                    <Button className="w-full" asChild>
                      <Link href={`/dashboard/events/${event.id}`}>
                        Manage Event
                      </Link>
                    </Button>
                  ) : isRegistered ? (
                    <Button variant="outline" className="w-full" disabled>
                      Already Registered
                    </Button>
                  ) : isUpcoming ? (
                    <Button className="w-full" asChild>
                      <Link href={`/events/${event.id}/register`}>
                        {event.isPaid ? "Buy Ticket" : "Register Free"}
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Event Ended
                    </Button>
                  )
                ) : (
                  <div className="space-y-2">
                    <Button className="w-full" asChild>
                      <Link href="/login">Sign In to Register</Link>
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Don't have an account?{" "}
                      <Link href="/sign-up" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Organizer
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">{event.organizer.name}</p>
                  {event.organizer.organizationName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{event.organizer.organizationName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailPage