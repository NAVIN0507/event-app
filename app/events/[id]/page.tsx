import { db } from '@/drizzle/db'
import { events } from '@/drizzle/schemas/events'
import { users } from '@/drizzle/schemas/user.schema'
import { usersToEvents } from '@/drizzle/schemas/usersToEvents'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { eq, count, and } from 'drizzle-orm'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Clock, Globe, User, Building, Edit, Settings } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

interface AttendeeData {
  user: {
    id: string | null
    name: string | null
    email: string | null
    phone: string | null
  } | null
  registeredAt: Date
  checkedIn: boolean
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
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
      .where(eq(events.id, id))
      .limit(1)

    if (eventResult.length === 0) {
      notFound()
    }

    const event = eventResult[0]

    // Get attendee count and list for organizers
    const attendeeCount = await db
      .select({ count: count() })
      .from(usersToEvents)
      .where(eq(usersToEvents.eventId, id))

    // Check if current user is registered
    let isRegistered = false
    let userRegistration = null
    if (session?.user?.id) {
      const registration = await db
        .select({
          registeredAt: usersToEvents.registeredAt,
          checkedIn: usersToEvents.checkedIn,
        })
        .from(usersToEvents)
        .where(
          and(
            eq(usersToEvents.eventId, id),
            eq(usersToEvents.userId, session.user.id)
          )
        )
        .limit(1)
      
      if (registration.length > 0) {
        isRegistered = true
        userRegistration = registration[0]
      }
    }

    const eventDate = new Date(event.date)
    const isUpcoming = eventDate > new Date()
    const isOrganizer = session?.user?.id === event.organizerId

    // Get attendee list for organizers
    let attendeeList: AttendeeData[] = []
    if (isOrganizer) {
      attendeeList = await db
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
    }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.image && (
              <div className="aspect-video relative overflow-hidden rounded-lg animate-fade-in group">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )}

            {/* Event Details */}
            <Card className="animate-slide-up hover-lift">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-3xl gradient-text">{event.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={isUpcoming ? "default" : "secondary"} className="animate-bounce-in">
                      {isUpcoming ? "Upcoming" : "Past"}
                    </Badge>
                    {isOrganizer && (
                      <Button size="sm" variant="outline" asChild className="hover-lift">
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    )}
                  </div>
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
                      className="text-primary hover:underline break-all"
                    >
                      {event.onlineLink}
                    </a>
                  </div>
                )}

                {/* Registration Status for Attendees */}
                {isRegistered && !isOrganizer && userRegistration && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Registration Confirmed</h4>
                    <p className="text-green-700 text-sm">
                      Registered on {format(new Date(userRegistration.registeredAt), "PPP")}
                    </p>
                    {userRegistration.checkedIn && (
                      <Badge className="mt-2" variant="secondary">
                        Checked In
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendee Management for Organizers */}
            {isOrganizer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Attendee Management
                  </CardTitle>
                  <CardDescription>
                    Manage your event attendees and check-ins
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {attendeeList.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          {attendeeList.length} registered attendees
                        </p>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/events/${event.id}/attendees`}>
                            <Settings className="h-4 w-4 mr-1" />
                            Manage All
                          </Link>
                        </Button>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {attendeeList.slice(0, 5).map((attendee) => (
                          <div key={attendee.user?.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <p className="font-medium">{attendee.user?.name}</p>
                              <p className="text-sm text-muted-foreground">{attendee.user?.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {attendee.checkedIn ? (
                                <Badge variant="secondary">Checked In</Badge>
                              ) : (
                                <Badge variant="outline">Registered</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {attendeeList.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{attendeeList.length - 5} more attendees
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No attendees registered yet
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration/Management Card */}
            <Card className="animate-slide-in-left hover-lift glass" style={{animationDelay: '0.2s'}}>
              <CardHeader>
                <CardTitle className="text-2xl gradient-text">
                  {event.isPaid ? `₹${event.price}` : "Free"}
                </CardTitle>
                <CardDescription>
                  {isOrganizer 
                    ? "Event Management" 
                    : isRegistered 
                      ? "You're registered!" 
                      : "Join this event"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {session ? (
                  isOrganizer ? (
                    <div className="space-y-2">
                      <Button className="w-full hover-lift" asChild>
                        <Link href={`/dashboard/events/${event.id}/manage`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Event
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full hover-lift" asChild>
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Event
                        </Link>
                      </Button>
                    </div>
                  ) : session.user.role === 'attendee' ? (
                    isRegistered ? (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" disabled>
                          Already Registered
                        </Button>
                        {event.isOnline && event.onlineLink && (
                          <Button variant="secondary" className="w-full hover-lift" asChild>
                            <a href={event.onlineLink} target="_blank" rel="noopener noreferrer">
                              Join Event
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : isUpcoming ? (
                      <Button className="w-full hover-lift animate-bounce-in" asChild>
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
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Only attendees can register for events
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <Button className="w-full hover-lift" asChild>
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
            <Card className="animate-slide-in-left hover-lift" style={{animationDelay: '0.4s'}}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Organizer
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">{event.organizer?.name || 'Unknown Organizer'}</p>
                  {event.organizer?.organizationName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{event.organizer.organizationName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Stats for Organizers */}
            {isOrganizer && (
              <Card className="animate-slide-in-left hover-lift glass" style={{animationDelay: '0.6s'}}>
                <CardHeader>
                  <CardTitle className="gradient-text">Event Statistics</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Total Registrations</span>
                    <span className="font-semibold text-lg">{attendeeCount[0]?.count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Checked In</span>
                    <span className="font-semibold text-lg">
                      {attendeeList.filter(a => a.checkedIn).length}
                    </span>
                  </div>
                  {event.isPaid && (
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-semibold text-lg text-primary">
                        ₹{((attendeeCount[0]?.count || 0) * parseFloat(event.price || '0')).toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
  } catch (error) {
    console.error('Error loading event:', error)
    notFound()
  }
}