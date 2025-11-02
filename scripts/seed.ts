// Environment variables should be loaded by tsx --env-file flag
// Verify DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set.')
  console.error('   Make sure your .env file exists and contains DATABASE_URL.')
  process.exit(1)
}

import { db } from '../drizzle/db'
import { users } from '../drizzle/schemas/user.schema'
import { events } from '../drizzle/schemas/events'
import { usersToEvents } from '../drizzle/schemas/usersToEvents'
import bcrypt from 'bcryptjs'

// Sample event data
const sampleEvents = [
    {
        title: "React Conference 2024",
        description: "Join us for the biggest React conference of the year! Learn about the latest features, best practices, and connect with fellow developers. This conference will cover React 18, Next.js 14, and the future of web development.",
        date: new Date('2024-12-15'),
        time: "09:00 AM",
        location: "Tech Convention Center, Bangalore",
        isOnline: false,
        price: "2500",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop"
    },
    {
        title: "JavaScript Masterclass",
        description: "Deep dive into advanced JavaScript concepts including closures, prototypes, async programming, and modern ES6+ features. Perfect for intermediate to advanced developers.",
        date: new Date('2024-12-20'),
        time: "02:00 PM",
        location: null,
        isOnline: true,
        onlineLink: "https://zoom.us/j/123456789",
        price: "1500",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop"
    },
    {
        title: "Free Web Development Workshop",
        description: "Learn the basics of web development with HTML, CSS, and JavaScript. This beginner-friendly workshop is perfect for those starting their coding journey.",
        date: new Date('2024-12-25'),
        time: "10:00 AM",
        location: "Community Center, Mumbai",
        isOnline: false,
        price: "0",
        isPaid: false,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop"
    },
    {
        title: "AI & Machine Learning Summit",
        description: "Explore the latest trends in artificial intelligence and machine learning. Industry experts will share insights on neural networks, deep learning, and practical AI applications.",
        date: new Date('2025-01-10'),
        time: "09:30 AM",
        location: "Innovation Hub, Hyderabad",
        isOnline: false,
        price: "3500",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop"
    },
    {
        title: "Node.js Performance Optimization",
        description: "Learn how to optimize Node.js applications for better performance. Topics include memory management, clustering, caching strategies, and monitoring.",
        date: new Date('2025-01-15'),
        time: "11:00 AM",
        location: null,
        isOnline: true,
        onlineLink: "https://meet.google.com/abc-defg-hij",
        price: "2000",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop"
    },
    {
        title: "UI/UX Design Workshop",
        description: "Master the principles of user interface and user experience design. Learn about design thinking, prototyping, and creating user-centered designs.",
        date: new Date('2025-01-20'),
        time: "01:00 PM",
        location: "Design Studio, Pune",
        isOnline: false,
        price: "1800",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop"
    },
    {
        title: "Open Source Contribution Meetup",
        description: "Connect with the open source community and learn how to contribute to popular projects. We'll cover Git workflows, code reviews, and finding projects to contribute to.",
        date: new Date('2025-01-25'),
        time: "06:00 PM",
        location: "Tech Park, Chennai",
        isOnline: false,
        price: "0",
        isPaid: false,
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
    },
    {
        title: "Cloud Computing with AWS",
        description: "Comprehensive workshop on Amazon Web Services. Learn about EC2, S3, Lambda, and how to build scalable cloud applications.",
        date: new Date('2025-02-01'),
        time: "10:00 AM",
        location: null,
        isOnline: true,
        onlineLink: "https://teams.microsoft.com/l/meetup-join/xyz",
        price: "2800",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop"
    },
    {
        title: "Mobile App Development with React Native",
        description: "Build cross-platform mobile applications using React Native. Learn navigation, state management, and publishing to app stores.",
        date: new Date('2025-02-05'),
        time: "09:00 AM",
        location: "Mobile Dev Center, Delhi",
        isOnline: false,
        price: "3000",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop"
    },
    {
        title: "Cybersecurity Fundamentals",
        description: "Essential cybersecurity concepts for developers. Learn about secure coding practices, common vulnerabilities, and how to protect applications.",
        date: new Date('2025-02-10'),
        time: "02:30 PM",
        location: null,
        isOnline: true,
        onlineLink: "https://webex.com/meet/security101",
        price: "0",
        isPaid: false,
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop"
    },
    {
        title: "DevOps and CI/CD Pipeline",
        description: "Learn modern DevOps practices including Docker, Kubernetes, Jenkins, and automated deployment pipelines. Hands-on workshop with real-world examples.",
        date: new Date('2025-02-15'),
        time: "10:30 AM",
        location: "DevOps Center, Bangalore",
        isOnline: false,
        price: "2200",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=400&fit=crop"
    },
    {
        title: "Blockchain Development Workshop",
        description: "Introduction to blockchain technology and smart contract development. Learn Solidity, Web3.js, and build your first DApp.",
        date: new Date('2025-02-20'),
        time: "11:30 AM",
        location: null,
        isOnline: true,
        onlineLink: "https://discord.gg/blockchain-workshop",
        price: "4000",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop"
    },
    // Past events for testing
    {
        title: "Python Data Science Bootcamp",
        description: "Intensive bootcamp covering pandas, numpy, matplotlib, and machine learning with scikit-learn. Perfect for data science beginners.",
        date: new Date('2024-11-15'),
        time: "09:00 AM",
        location: "Data Science Institute, Mumbai",
        isOnline: false,
        price: "2500",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
    },
    {
        title: "GraphQL API Development",
        description: "Build modern APIs with GraphQL. Learn schema design, resolvers, and integration with popular databases and frameworks.",
        date: new Date('2024-10-20'),
        time: "02:00 PM",
        location: null,
        isOnline: true,
        onlineLink: "https://zoom.us/j/graphql123",
        price: "1800",
        isPaid: true,
        image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop"
    },
    {
        title: "Tech Career Fair 2024",
        description: "Connect with top tech companies and explore career opportunities. Free event with networking sessions and company presentations.",
        date: new Date('2024-09-25'),
        time: "10:00 AM",
        location: "Convention Center, Hyderabad",
        isOnline: false,
        price: "0",
        isPaid: false,
        image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop"
    }
]

// Sample organizers
const sampleOrganizers = [
    {
        name: "Tech Events India",
        email: "organizer1@techeventsindia.com",
        organizationName: "Tech Events India",
        role: "organizer" as const,
        phone: "+91-9876543210"
    },
    {
        name: "DevCommunity",
        email: "organizer2@devcommunity.org",
        organizationName: "DevCommunity",
        role: "organizer" as const,
        phone: "+91-9876543211"
    },
    {
        name: "Innovation Labs",
        email: "organizer3@innovationlabs.in",
        organizationName: "Innovation Labs",
        role: "organizer" as const,
        phone: "+91-9876543212"
    },
    {
        name: "Code Academy",
        email: "organizer4@codeacademy.edu",
        organizationName: "Code Academy",
        role: "organizer" as const,
        phone: "+91-9876543213"
    }
]

// Sample attendees
const sampleAttendees = [
    {
        name: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        role: "attendee" as const,
        phone: "+91-8765432109"
    },
    {
        name: "Priya Patel",
        email: "priya.patel@example.com",
        role: "attendee" as const,
        phone: "+91-8765432108"
    },
    {
        name: "Amit Kumar",
        email: "amit.kumar@example.com",
        role: "attendee" as const,
        phone: "+91-8765432107"
    },
    {
        name: "Sneha Reddy",
        email: "sneha.reddy@example.com",
        role: "attendee" as const,
        phone: "+91-8765432106"
    },
    {
        name: "Vikram Singh",
        email: "vikram.singh@example.com",
        role: "attendee" as const,
        phone: "+91-8765432105"
    }
]

async function clearDatabase() {
    console.log('🗑️  Clearing existing data...')
    
    // Delete in correct order due to foreign key constraints
    await db.delete(usersToEvents)
    console.log('   ✓ Cleared registrations')
    
    await db.delete(events)
    console.log('   ✓ Cleared events')
    
    await db.delete(users)
    console.log('   ✓ Cleared users')
}

async function seed() {
    try {
        console.log('🌱 Starting database seeding...')

        // Check if data already exists
        const existingUsers = await db.select().from(users).limit(1)
        if (existingUsers.length > 0) {
            console.log('⚠️  Database already contains data.')
            console.log('   This script will clear all existing data and reseed.')
            console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...')
            
            // Wait 5 seconds
            await new Promise(resolve => setTimeout(resolve, 5000))
            
            await clearDatabase()
        }

        // Hash password for all users
        const hashedPassword = await bcrypt.hash('password123', 10)

        // Create organizers
        console.log('👥 Creating organizers...')
        const createdOrganizers = []
        for (const organizer of sampleOrganizers) {
            const [createdOrganizer] = await db.insert(users).values({
                name: organizer.name,
                email: organizer.email,
                password: hashedPassword,
                phone: organizer.phone,
                role: organizer.role,
                organizationName: organizer.organizationName
            }).returning()
            createdOrganizers.push(createdOrganizer)
            console.log(`   ✓ Created organizer: ${organizer.name}`)
        }

        // Create attendees
        console.log('👤 Creating attendees...')
        const createdAttendees = []
        for (const attendee of sampleAttendees) {
            const [createdAttendee] = await db.insert(users).values({
                name: attendee.name,
                email: attendee.email,
                password: hashedPassword,
                phone: attendee.phone,
                role: attendee.role
            }).returning()
            createdAttendees.push(createdAttendee)
            console.log(`   ✓ Created attendee: ${attendee.name}`)
        }

        // Create events
        console.log('🎉 Creating events...')
        const createdEvents = []
        for (let i = 0; i < sampleEvents.length; i++) {
            const event = sampleEvents[i]
            const organizer = createdOrganizers[i % createdOrganizers.length]

            const [createdEvent] = await db.insert(events).values({
                ...event,
                organizerId: organizer.id
            }).returning()
            createdEvents.push(createdEvent)
            console.log(`   ✓ Created event: ${event.title}`)
        }

        // Create some registrations
        console.log('📝 Creating sample registrations...')
        let registrationCount = 0

        for (const event of createdEvents) {
            // Randomly register 1-4 attendees for each event
            const numRegistrations = Math.floor(Math.random() * 4) + 1
            const shuffledAttendees = [...createdAttendees].sort(() => 0.5 - Math.random())

            for (let i = 0; i < Math.min(numRegistrations, shuffledAttendees.length); i++) {
                const attendee = shuffledAttendees[i]
                const isCheckedIn = Math.random() > 0.7 // 30% chance of being checked in

                await db.insert(usersToEvents).values({
                    userId: attendee.id,
                    eventId: event.id,
                    registeredAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
                    checkedIn: isCheckedIn
                })
                registrationCount++
            }
        }

        console.log(`   ✓ Created ${registrationCount} registrations`)

        console.log('\n🎊 Database seeding completed successfully!')
        console.log('\n📊 Summary:')
        console.log(`   • ${createdOrganizers.length} organizers created`)
        console.log(`   • ${createdAttendees.length} attendees created`)
        console.log(`   • ${createdEvents.length} events created`)
        console.log(`   • ${registrationCount} registrations created`)

        console.log('\n🔐 Login credentials:')
        console.log('   Organizers: Use any organizer email with password "password123"')
        console.log('   Attendees: Use any attendee email with password "password123"')
        console.log('\n   Example organizer: organizer1@techeventsindia.com / password123')
        console.log('   Example attendee: rahul.sharma@example.com / password123')

    } catch (error) {
        console.error('❌ Error seeding database:', error)
        process.exit(1)
    }
}

// Run the seed function
seed().then(() => {
    console.log('✅ Seeding process completed')
    process.exit(0)
}).catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
})