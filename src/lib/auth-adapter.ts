import { sql } from "@/lib/db";
import { encryptToken } from "@/lib/google-oauth";
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from "@auth/core/adapters";

export function NeonAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      const { name, email, emailVerified, image } = user;
      const [created] = await sql`
        INSERT INTO users (id, email, first_name, last_name, password_hash, wallet_balance, is_verified, role, referral_code, created_at, updated_at, image)
        VALUES (
          gen_random_uuid(),
          ${email},
          ${name?.split(' ')[0] || ''},
          ${name?.split(' ').slice(1).join(' ') || ''},
          '',
          0.00,
          ${emailVerified ? true : false},
          'USER',
          UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
          NOW(),
          NOW(),
          ${image || null}
        )
        RETURNING id, email, first_name as "firstName", last_name as "lastName", is_verified as "emailVerified", image, created_at as "createdAt"
      `;
      return {
        id: created.id,
        email: created.email,
        emailVerified: created.emailVerified ? new Date(created.createdAt) : null,
        name: `${created.firstName} ${created.lastName}`.trim(),
        image: created.image,
      };
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      const result = await sql`
        SELECT id, email, first_name, last_name, is_verified, image, created_at
        FROM users WHERE id = ${id}
      `;
      if (result.length === 0) return null;
      const user = result[0];
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.is_verified ? new Date(user.created_at) : null,
        name: `${user.first_name} ${user.last_name}`.trim(),
        image: user.image,
      };
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const result = await sql`
        SELECT id, email, first_name, last_name, is_verified, image, created_at
        FROM users WHERE email = ${email.toLowerCase()}
      `;
      if (result.length === 0) return null;
      const user = result[0];
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.is_verified ? new Date(user.created_at) : null,
        name: `${user.first_name} ${user.last_name}`.trim(),
        image: user.image,
      };
    },

    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }): Promise<AdapterUser | null> {
      const result = await sql`
        SELECT u.id, u.email, u.first_name, u.last_name, u.is_verified, u.image, u.created_at
        FROM accounts a
        JOIN users u ON a.user_id = u.id
        WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
      `;
      if (result.length === 0) return null;
      const user = result[0];
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.is_verified ? new Date(user.created_at) : null,
        name: `${user.first_name} ${user.last_name}`.trim(),
        image: user.image,
      };
    },

    async updateUser(user: Partial<AdapterUser> & { id: string }): Promise<AdapterUser> {
      const { id, name, email, emailVerified, image } = user;
      const [updated] = await sql`
        UPDATE users
        SET 
          first_name = COALESCE(${name?.split(' ')[0] || null}, first_name),
          last_name = COALESCE(${name?.split(' ').slice(1).join(' ') || null}, last_name),
          email = COALESCE(${email || null}, email),
          is_verified = COALESCE(${emailVerified ? true : null}, is_verified),
          image = COALESCE(${image || null}, image),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, email, first_name, last_name, is_verified, image, created_at
      `;
      return {
        id: updated.id,
        email: updated.email,
        emailVerified: updated.is_verified ? new Date(updated.created_at) : null,
        name: `${updated.first_name} ${updated.last_name}`.trim(),
        image: updated.image,
      };
    },

    async deleteUser(userId: string): Promise<void> {
      await sql`DELETE FROM users WHERE id = ${userId}`;
    },

    async linkAccount(account: AdapterAccount): Promise<void> {
      await sql`
        INSERT INTO accounts (
          user_id, type, provider, provider_account_id, 
          refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
        )
        VALUES (
          ${account.userId},
          ${account.type},
          ${account.provider},
          ${account.providerAccountId},
          ${account.refresh_token ? encryptToken(String(account.refresh_token)) : null},
          ${account.access_token ? encryptToken(String(account.access_token)) : null},
          ${account.expires_at || null},
          ${account.token_type || null},
          ${account.scope || null},
          ${account.id_token ? encryptToken(String(account.id_token)) : null},
          ${account.session_state || null}
        )
      `;
    },

    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }): Promise<void> {
      await sql`
        DELETE FROM accounts 
        WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
      `;
    },

    async createSession(session: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      const expiresIso = session.expires.toISOString();
      await sql`
        INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
        VALUES (gen_random_uuid(), ${session.userId}, ${session.sessionToken}, ${expiresIso}, NOW())
      `;
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const result = await sql`
        SELECT 
          s.token as session_token, s.user_id, s.expires_at,
          u.id, u.email, u.first_name, u.last_name, u.is_verified, u.image, u.created_at
        FROM auth_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      `;
      if (result.length === 0) return null;
      const row = result[0];
      return {
        session: {
          sessionToken: row.session_token,
          userId: row.user_id,
          expires: new Date(row.expires_at),
        },
        user: {
          id: row.id,
          email: row.email,
          emailVerified: row.is_verified ? new Date(row.created_at) : null,
          name: `${row.first_name} ${row.last_name}`.trim(),
          image: row.image,
        },
      };
    },

    async updateSession(session: Partial<AdapterSession> & { sessionToken: string }): Promise<AdapterSession | null | undefined> {
      const expiresIso = session.expires?.toISOString();
      await sql`
        UPDATE auth_sessions
        SET expires_at = COALESCE(${expiresIso || null}, expires_at)
        WHERE token = ${session.sessionToken}
      `;
      return session as AdapterSession;
    },

    async deleteSession(sessionToken: string): Promise<void> {
      await sql`DELETE FROM auth_sessions WHERE token = ${sessionToken}`;
    },

    async createVerificationToken(token: VerificationToken): Promise<VerificationToken> {
      const expiresIso = token.expires.toISOString();
      await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (${token.identifier}, ${token.token}, ${expiresIso})
      `;
      return token;
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }): Promise<VerificationToken | null> {
      const result = await sql`
        DELETE FROM verification_tokens
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING identifier, token, expires
      `;
      if (result.length === 0) return null;
      return {
        identifier: result[0].identifier,
        token: result[0].token,
        expires: new Date(result[0].expires),
      };
    },
  };
}
