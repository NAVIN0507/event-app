import { db } from "@/drizzle/db";
import { users } from "@/drizzle/schemas/user.schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, email, password, phone, role, organizationName, profileImage } = data;


    await db.insert(users).values({
      name,
      email,
      password: password,
      phone,
      role,
      organizationName: organizationName || null,
      profileImage: profileImage || null,
    });

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error creating user" }, { status: 500 });
  }
}
