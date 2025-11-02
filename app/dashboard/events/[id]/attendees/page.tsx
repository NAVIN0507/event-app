"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ArrowLeft, Users, Search, CheckCircle, Clock, Mail, Phone, Download } from 'lucide-react'
import Link from 'next/link'

interface AttendeesPageProps {
  params: {
    id: string
  }
}

interface Attendee {
  user: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  registeredAt: string
  checkedIn: boolean
}

interface Event {
  id: string
  title: string
  date: string
  organizerId: string
}

const AttendeesPage = ({ params }: AttendeesPageProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'organizer') {
      router.push(`/events/${params.id}`)
      return
    }

    fetchEventAndAttendees()
  }, [status, session, params.id, router])

  useEffect(() => {
    filterAttendees()
  }, [attendees, searchTerm, filter])

  const fetchEventAndAttendees = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}/attendees`)
      if (response.ok) {
        const data = await response.json()
        
        // Check if user is the organizer
        if (data.event.organizerId !== session?.user?.id) {
          router.push(`/events/${params.id}`)
          return
        }

        setEvent(data.event)
        setAttendees(data.attendees)
      } else {
        setError('Failed to load attendees')
      }
    } catch (error) {
      setError('Failed to load attendees')
    } finally {
      setLoading(false)
    }
  }

  const filterAttendees = () => {
    let filtered = attendees

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(attendee =>
        attendee.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filter === 'checked-in') {
      filtered = filtered.filter(attendee => attendee.checkedIn)
    } else if (filter === 'not-checked-in') {
      filtered = filtered.filter(attendee => !attendee.checkedIn)
    }

    setFilteredAttendees(filtered)
  }

  const handleCheckIn = async (userId: string) => {
    try {
      const response = await fetch(`/api/events/${params.id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Update local state
        setAttendees(prev =>
          prev.map(attendee =>
            attendee.user.id === userId
              ? { ...attendee, checkedIn: true }
              : attendee
          )
        )
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to check in attendee')
      }
    } catch (error) {
      alert('Failed to check in attendee')
    }
  }

  const exportAttendees = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Registered At', 'Checked In'],
      ...filteredAttendees.map(attendee => [
        attendee.user.name,
        attendee.user.email,
        attendee.user.phone || '',
        format(new Date(attendee.registeredAt), 'PPP'),
        attendee.checkedIn ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event?.title || 'event'}-attendees.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const checkedInCount = attendees.filter(a => a.checkedIn).length
  const totalCount = attendees.length

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/events/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Attendee Management</h1>
          <p className="text-muted-foreground">
            {event?.title} • {format(new Date(event?.date || ''), 'PPP')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{checkedInCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Check-in</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount - checkedInCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manage Attendees</CardTitle>
            <CardDescription>
              Search, filter, and check in your event attendees
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex gap-4 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search attendees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={filter === 'checked-in' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('checked-in')}
                >
                  Checked In
                </Button>
                <Button 
                  variant={filter === 'not-checked-in' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('not-checked-in')}
                >
                  Pending
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={exportAttendees}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Attendees List */}
            <div className="space-y-4">
              {filteredAttendees.length > 0 ? (
                filteredAttendees.map((attendee) => (
                  <div key={attendee.user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{attendee.user.name}</h3>
                        <Badge variant={attendee.checkedIn ? "default" : "outline"}>
                          {attendee.checkedIn ? "Checked In" : "Registered"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{attendee.user.email}</span>
                        </div>
                        {attendee.user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{attendee.user.phone}</span>
                          </div>
                        )}
                        <span>Registered: {format(new Date(attendee.registeredAt), 'PPp')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!attendee.checkedIn && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(attendee.user.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No attendees found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filter !== 'all' 
                      ? "Try adjusting your search or filter criteria."
                      : "No one has registered for this event yet."
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AttendeesPage