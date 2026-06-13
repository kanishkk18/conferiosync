// import { compare } from "bcryptjs";
// import CredentialsProvider from "next-auth/providers/credentials";
// import GitHubProvider from "next-auth/providers/github";
// import GoogleProvider from "next-auth/providers/google";

// import type { NextAuthConfig } from "next-auth";

// import { db } from "@/lib/db";
// import { env } from "@/lib/env";
// import { loginSchema } from "@/lib/validations";

// export const authConfig: NextAuthConfig = {
//   providers: [
//     GoogleProvider({
//       clientId: env.GOOGLE_CLIENT_ID,
//       clientSecret: env.GOOGLE_CLIENT_SECRET,
//     }),
//     GitHubProvider({
//       clientId: env.GITHUB_CLIENT_ID,
//       clientSecret: env.GITHUB_CLIENT_SECRET,
//     }),
//     CredentialsProvider({
//       async authorize(credentials) {
//         const validatedFields = loginSchema.safeParse(credentials);

//         if (validatedFields.success) {
//           const user = validatedFields.data;

//           const dbUser = await db.query.users.findFirst({
//             where: (u, { eq }) =>
//               user.type === "email" ?
//                 eq(u.email, user.email!)
//               : eq(u.username, user.username!),
//           });

//           if (dbUser && dbUser.password) {
//             const isValid = await compare(user.password, dbUser.password);

//             if (isValid) {
//               return dbUser;
//             }
//           }
//         }

//         return null;
//       },
//     }),
//   ],
// };

import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import type { NextAuthConfig } from "next-auth";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/validations";

export const authConfig: NextAuthConfig = {
  // REQUIRED for production on Vercel
  trustHost: true,

  // REQUIRED in production (or set AUTH_SECRET env var)
  secret: env.AUTH_SECRET,

  // Since you use CredentialsProvider, force JWT sessions
  session: {
    strategy: "jwt",
  },

  // Optional but recommended: custom error page
  pages: {
    signIn: "/login",
    error: "/auth/error", // or "/login?error=auth"
  },

  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        type: { label: "Type", type: "text" },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) return null;

        const user = validatedFields.data;

        const dbUser = await db.query.users.findFirst({
          where: (u, { eq }) =>
            user.type === "email" ?
              eq(u.email, user.email!)
            : eq(u.username, user.username!),
        });

        if (!dbUser || !dbUser.password) return null;

        const isValid = await compare(user.password, dbUser.password);
        if (!isValid) return null;

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image,
          username: dbUser.username,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
};
