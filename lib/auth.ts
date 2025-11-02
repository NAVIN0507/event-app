import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/drizzle/db";
import { users } from "@/drizzle/schemas/user.schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        const user = result[0];
        
        if (!user || user.password !== credentials.password) {
          throw new Error("Invalid credentials");
        }

        // ✅ Return user WITHOUT the image - it's too large for JWT
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          // ❌ DON'T include image here - store URL in DB instead
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // ❌ Don't store image in token
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        
        // ✅ Fetch image from DB only when needed
        // Or store just the Cloudinary URL (not base64)
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};