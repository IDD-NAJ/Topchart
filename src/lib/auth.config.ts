import { AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";
import { NeonAdapter } from "./auth-adapter";
import { sql } from "./db";

export const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.SESSION_SECRET,
  trustHost: true,
  basePath: "/api/auth",
  adapter: NeonAdapter(),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        },
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? ".topchart.store" : undefined,
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      return true;
    },
    async session({ session, user }: { session: any; user: any }) {
      if (session.user && user) {
        session.user.id = user.id;
        
        try {
          const result = await sql`
            SELECT id, email, first_name, last_name, phone, wallet_balance, is_verified, role, referral_code, created_at
            FROM users WHERE id = ${user.id}
          `;
          if (result.length > 0) {
            const dbUser = result[0];
            session.user.firstName = dbUser.first_name;
            session.user.lastName = dbUser.last_name;
            session.user.phone = dbUser.phone;
            session.user.walletBalance = Number(dbUser.wallet_balance);
            session.user.isVerified = dbUser.is_verified;
            session.user.role = dbUser.role;
            session.user.referralCode = dbUser.referral_code;
            session.user.createdAt = dbUser.created_at;
          }
        } catch (error) {
          console.error("Error fetching user data in session callback:", error);
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
