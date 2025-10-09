import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";

import { AuthAPI } from "../api/auth.api";
import { UserRepository } from "../repositories/user.repository";
import { env } from "@/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      // ...other properties
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    // ...other properties
  }
}



/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  // Note: Using JWT sessions for NextAuth v5 beta compatibility
  // Database sessions will be re-enabled when NextAuth v5 stable is released
  // adapter: PrismaAdapter(db),

  // Add debug logging for production issues
  debug: process.env.NODE_ENV === "development",

  // Add trustHost for Vercel deployment
  trustHost: true,

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔍 NextAuth - Authorize called with:", {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ NextAuth - Missing credentials");
          return null;
        }

        try {
          const result = await AuthAPI.authenticateUser(
            credentials.email as string,
            credentials.password as string
          );

          // fix: discriminated union Result type - guard before accessing data
          console.log("🔍 NextAuth - AuthAPI result:", {
            success: result.success,
            hasData: result.success ? !!result.data : false,
            userId: result.success ? result.data.id : undefined,
            userRole: result.success ? result.data.role : undefined,
          });

          if (result.success) {
            const user = {
              id: result.data.id,
              email: result.data.email,
              name: result.data.name,
              role: result.data.role,
              image: null, // AuthAPI doesn't return image, will be handled by profile API
            };
            console.log("✅ NextAuth - User authenticated:", {
              id: user.id,
              email: user.email,
              role: user.role,
            });
            return user;
          }
        } catch (error) {
          console.error("❌ NextAuth - Auth error:", error);
        }

        console.log("❌ NextAuth - Authentication failed");
        return null;
      }
    }),
    ...(env.AUTH_DISCORD_ID && env.AUTH_DISCORD_SECRET ? [
      DiscordProvider({
        clientId: env.AUTH_DISCORD_ID,
        clientSecret: env.AUTH_DISCORD_SECRET,
      })
    ] : []),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      // Include role and id in JWT token when user signs in
      if (user) {
        console.log("🔍 NextAuth JWT - Adding user to token:", {
          userId: user.id,
          userRole: user.role,
        });
        token.role = user.role;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.lastValidated = Date.now();
      }

      // Validate existing token against database every 10 minutes (less frequent)
      const now = Date.now();
      const lastValidated = token.lastValidated as number || 0;
      const validationInterval = 10 * 60 * 1000; // 10 minutes

      if (token.id && (now - lastValidated > validationInterval)) {
        try {
          console.log("🔍 NextAuth JWT - Validating user against database:", {
            userId: token.id,
            lastValidated: new Date(lastValidated).toISOString(),
          });

          const dbUser = await UserRepository.findById(token.id as string);

          if (!dbUser || !dbUser.isActive) {
            console.log("❌ NextAuth JWT - User not found or inactive, invalidating token:", {
              userId: token.id,
              userExists: !!dbUser,
              isActive: dbUser?.isActive,
            });

            // Return empty object to invalidate the token
            return {};
          }

          // Update token with fresh data from database
          token.role = dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.lastValidated = now;

          console.log("✅ NextAuth JWT - User validated successfully:", {
            userId: token.id,
            role: token.role,
          });
        } catch (error) {
          console.error("❌ NextAuth JWT - Error validating user:", error);
          // On database error, keep the token but don't update lastValidated
          // This prevents constant validation attempts
          console.log("⚠️ NextAuth JWT - Keeping existing token due to DB error");
        }
      }

      return token;
    },
    session: ({ session, token }) => {
      // Check if token is valid (not empty object)
      if (!token.id || !token.role) {
        console.log("❌ NextAuth Session - Invalid token, returning null session");
        return null as any;
      }

      // Send properties to the client
      console.log("🔍 NextAuth Session - Creating session:", {
        hasToken: !!token,
        tokenId: token.id,
        tokenRole: token.role,
        tokenEmail: token.email,
      });

      const sessionData = {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          email: token.email as string,
          name: token.name as string,
        },
      };

      console.log("✅ NextAuth Session - Session created:", {
        userId: sessionData.user.id,
        userRole: sessionData.user.role,
        userEmail: sessionData.user.email,
      });

      return sessionData;
    },
    async signIn() {
      // Allow sign in
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 NextAuth Redirect:", { url, baseUrl });

      // Handle logout redirects
      if (url.includes("/api/auth/signout") || url.includes("signout")) {
        console.log("🚪 NextAuth - Logout redirect to login");
        return `${baseUrl}/login`;
      }

      // If there's a specific URL to redirect to, use it
      if (url.startsWith("/") && !url.startsWith("//")) {
        return `${baseUrl}${url}`;
      }

      // For successful login, redirect to dashboard which will handle role-based routing
      // The /dashboard page will read the user's role from the database and redirect appropriately
      if (url === baseUrl || url.includes("/api/auth/callback")) {
        return `${baseUrl}/dashboard`;
      }

      return url.startsWith(baseUrl) ? url : `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },

  // Add error handling for production
  events: {
    async signIn(message) {
      console.log("🔐 NextAuth SignIn Event:", message);
    },
    async signOut(message) {
      console.log("🚪 NextAuth SignOut Event:", message);
    },
    async createUser(message) {
      console.log("👤 NextAuth CreateUser Event:", message);
    },
    async session(message) {
      console.log("📋 NextAuth Session Event:", message);
    },
  },

  // Cookie configuration for NextAuth v5 (Auth.js) compatibility
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-authjs.session-token`
        : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-authjs.callback-url`
        : `authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-authjs.csrf-token`
        : `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Production-specific settings
  ...(process.env.NODE_ENV === "production" && {
    useSecureCookies: true,
  }),
} satisfies NextAuthConfig;
