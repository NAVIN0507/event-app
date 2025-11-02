"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SuccessPageProps {
  params: Promise<{
    id: string
  }>
}

const SuccessPage = ({ params }: SuccessPageProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventTitle, setEventTitle] = useState('')
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

    if (!sessionId) {
      router.push(`/events/${eventId}`)
      return
    }

    verifyPayment()
  }, [status, sessionId, eventId, router])

  const verifyPayment = async () => {
    if (!eventId) return

    try {
      const response = await fetch(`/api/events/${eventId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        const data = await response.json()
        setEventTitle(data.eventTitle)
      } else {
        const data = await response.json()
        setError(data.message || 'Payment verification failed')
      }
    } catch (error) {
      setError('Failed to verify payment')
    } finally {
      setLoading(false)
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
            </div>
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
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Payment Error</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild>
                  <Link href={`/events/${eventId}`}>Back to Event</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-green-800 mb-2">
                  Payment Successful!
                </h1>
                <p className="text-lg text-muted-foreground">
                  You have successfully registered for the event
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  {eventTitle}
                </h2>
                <p className="text-green-700">
                  Your registration is confirmed. You will receive a confirmation email shortly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href={`/events/${eventId}`}>
                      <Calendar className="h-4 w-4 mr-2" />
                      View Event Details
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  You can find all your registered events in your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SuccessPage