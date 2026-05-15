import { AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";
import { NeonAdapter } from "./auth-adapter";
import { sql } from "./db";
import { getAppUrl } from "./app-url";

export const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  basePath: "/api/auth",
  adapter: NeonAdapter(),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          redirect_uri: `${getAppUrl()}/api/auth/callback/google`,
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
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      // Allow sign in
      return true;
    },
    async session({ session, user }: { session: any; user: any }) {
      // Add user ID to session
      if (session.user && user) {
        session.user.id = user.id;
        
        // Fetch additional user data from our database
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
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
