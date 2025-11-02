"use client"
import { useSession } from 'next-auth/react'
import React from 'react'

const page = () => {
    const {data}  = useSession();
  return (
    <div>{JSON.stringify(data , null , 2)}</div>
  )
}

export default page