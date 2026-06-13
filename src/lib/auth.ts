// import { redirect } from "next/navigation";
// import { DrizzleAdapter } from "@auth/drizzle-adapter";
// import { eq } from "drizzle-orm";
// import NextAuth from "next-auth";

// import type { Adapter } from "next-auth/adapters";

// import { authConfig } from "@/config/auth";
// import { db } from "./db";
// import { users } from "./db/schema";

// export const {
//   handlers,
//   auth,
//   signIn,
//   signOut,
//   unstable_update: update,
// } = NextAuth({
//   ...authConfig,

//   adapter: DrizzleAdapter(db) as Adapter,

//   session: {
//     strategy: "jwt",
//   },

//   pages: {
//     signIn: "/login",
//     newUser: "/signup",
//   },

//   events: {
//     linkAccount: async ({ user }) => {
//       await db
//         .update(users)
//         .set({ emailVerified: new Date() })
//         .where(eq(users.id, user.id!));
//     },
//   },

//   callbacks: {
//     jwt: async ({ token }) => {
//       const user = await db.query.users.findFirst({
//         where: (u, { eq }) => eq(u.id, token.sub!),
//       });

//       if (user) {
//         const { id, name, email, username, image: picture } = user;

//         token = {
//           ...token,
//           id,
//           name,
//           email,
//           username,
//           picture,
//         };
//       }

//       return token;
//     },

//     session: async ({ session, token }) => {
//       if (token.sub && session.user) {
//         const { id, name, email, username, picture: image } = token;

//         session.user = {
//           ...session.user,
//           id,
//           name,
//           email,
//           username,
//           image,
//         };
//       }

//       return session;
//     },
//   },
// });

// /**
//  * Gets the current user from the server session
//  *
//  * @returns The current user
//  */
// export async function getUser() {
//   const session = await auth();
//   return session?.user;
// }

// /**
//  * Checks if the current user is authenticated
//  * If not, redirects to the login page
//  */
// export const checkAuth = async () => {
//   const session = await auth();
//   if (!session) redirect("/login");
// };

import { redirect } from "next/navigation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";

import type { Adapter } from "next-auth/adapters";

import { authConfig } from "@/config/auth";
import { db } from "./db";
import { users } from "./db/schema";

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth({
  ...authConfig,

  adapter: DrizzleAdapter(db) as Adapter,

  events: {
    linkAccount: async ({ user }) => {
      if (!user.id) return;

      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.id, user.id));
    },
  },

  callbacks: {
    jwt: async ({ token, user, account }) => {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id as string,
          name: user.name,
          email: (user.email ?? "") as string,
          username: (user as { username?: string | null }).username,
          picture: user.image,
        };
      }

      // Return previous token if no sub
      if (!token.sub) return token;

      const userId = token.sub;

      // Refresh user data from DB (optional — remove if you don't need live updates)
      try {
        const dbUser = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
        });

        if (dbUser) {
          return {
            ...token,
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email ?? "",
            username: dbUser.username,
            picture: dbUser.image,
          };
        }
      } catch (error) {
        // If DB fails, don't break auth — return existing token
        console.error("JWT callback DB error:", error);
      }

      return token;
    },

    session: async ({ session, token }) => {
      if (token.sub && session.user) {
        const user = session.user as {
          id: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
          username?: string | null;
        };

        user.id = token.sub;
        user.name = token.name;
        user.email = token.email;
        user.image = token.picture;
        user.username = token.username;
      }

      return session;
    },
  },
});

export async function getUser() {
  const session = await auth();
  return session?.user;
}

export const checkAuth = async () => {
  const session = await auth();
  if (!session) redirect("/login");
};
