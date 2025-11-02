import { db } from '@/drizzle/db'
import { users } from '@/drizzle/schemas/user.schema'
import React from 'react'

const page = async() => {
  const getAllUsers  = await db.select().from(users)
  return (
    <div>
      {JSON.stringify(getAllUsers , null , 2)}
    </div>
  )
}

export default page