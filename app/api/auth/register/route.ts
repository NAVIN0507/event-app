import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/drizzle/db'
import { users } from '@/drizzle/schemas/user.schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, role, organizationName } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: role || 'attendee',
      organizationName: role === 'organizer' ? organizationName : null,
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })

    return NextResponse.json(
      { message: 'User created successfully', user: newUser[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}