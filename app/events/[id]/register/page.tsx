"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Calendar, MapPin, Clock, Globe, ArrowLeft, CreditCard, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface RegisterPageProps {
  params: Promise<{
    id: string
  }>
}

interface Event {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  location: string | null
  image: string | null
  isOnline: boolean
  price: string
  isPaid: boolean
  organizer: {
    name: string
    organizationName: string | null
  }
}

const RegisterPage = ({ params }: RegisterPageProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState<string | null>(null)

  // Resolve params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setEventId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!eventId) return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'attendee') {
      router.push(`/events/${eventId}`)
      return
    }

    fetchEvent()
  }, [status, session, eventId, router])

  const fetchEvent = async () => {
    if (!eventId) return

    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const eventData = await response.json()
        setEvent(eventData)
      } else {
        setError('Event not found')
      }
    } catch (error) {
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleFreeRegistration = async () => {
    if (!eventId) return

    setRegistering(true)
    setError('')

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push(`/events/${eventId}?registered=true`)
      } else {
        const data = await response.json()
        setError(data.message || 'Registration failed')
      }
    } catch (error) {
      setError('Registration failed. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  const handlePaidRegistration = async () => {
    if (!eventId) return

    setRegistering(true)
    setError('')

    try {
      const response = await fetch(`/api/events/${eventId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const data = await response.json()
        setError(data.message || 'Payment setup failed')
      }
    } catch (error) {
      setError('Payment setup failed. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Error</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!event) return null

  const eventDate = new Date(event.date)
  const isUpcoming = eventDate > new Date()

  if (!isUpcoming) {
    if (eventId) {
      router.push(`/events/${eventId}`)
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 animate-slide-up">
            <Button variant="ghost" asChild className="mb-4 hover-lift">
              <Link href={`/events/${eventId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Link>
            </Button>

            <h1 className="text-3xl font-bold gradient-text">Register for Event</h1>
          </div>

          <div className="grid gap-6">
            {/* Event Summary */}
            <Card className="animate-slide-up hover-lift" style={{animationDelay: '0.1s'}}>
              <CardHeader>
                <CardTitle className="gradient-text">{event.title}</CardTitle>
                <CardDescription>
                  by {event.organizer.organizationName || event.organizer.name}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {event.image && (
                  <div className="aspect-video relative overflow-hidden rounded-lg group">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
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
            <Card className="animate-slide-up hover-lift glass" style={{animationDelay: '0.3s'}}>
              <CardHeader>
                <CardTitle className="gradient-text">Registration Details</CardTitle>
                <CardDescription>
                  Confirm your registration for this event
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md animate-bounce-in">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border">
                    <span className="font-medium">Event Price</span>
                    <span className="text-2xl font-bold gradient-text">
                      {event.isPaid ? `₹${event.price}` : "Free"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Registering as: <strong>{session?.user?.name}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: <strong>{session?.user?.email}</strong>
                    </p>
                  </div>

                  {event.isPaid ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Secure Payment</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          You will be redirected to Stripe's secure payment gateway to complete your registration.
                        </p>
                      </div>

                      <Button
                        className="w-full hover-lift animate-bounce-in"
                        size="lg"
                        onClick={handlePaidRegistration}
                        disabled={registering}
                      >
                        {registering ? (
                          'Setting up payment...'
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay ₹{event.price} & Register
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">Free Event</span>
                        </div>
                        <p className="text-sm text-green-700">
                          This is a free event. Click below to complete your registration.
                        </p>
                      </div>

                      <Button
                        className="w-full hover-lift animate-bounce-in"
                        size="lg"
                        onClick={handleFreeRegistration}
                        disabled={registering}
                      >
                        {registering ? (
                          'Registering...'
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Register for Free
                          </>
                        )}
                      </Button>
                    </div>
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