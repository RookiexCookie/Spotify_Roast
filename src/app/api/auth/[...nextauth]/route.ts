import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

// Helper function to refresh the token
async function refreshAccessToken(token: any) {
  try {
    const url = "https://developer.spotify.com/documentation/web-api/concepts/apps3";
    
    // Spotify requires a specific encoding for the refresh call
    const basicAuth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
    };
  } catch (error) {
    console.error("RefreshAccessTokenError", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user-read-email user-top-read playlist-read-private", // Added playlist scope just in case
        },
      },
    }),
  ],
callbacks: {
    async jwt({ token, account, user }) {
      // 1. Initial Sign In
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_at ?? 3600) * 1000,
          refreshToken: account.refresh_token,
          user, // <--- IMPORTANT: Pass the user object (contains image) to the token
          picture: user.image, // Ensure picture is explicitly saved
        };
      }

      // 2. Return previous token if not expired
      if (Date.now() < (token.accessTokenExpires as number) - 10000) {
        return token;
      }

      // 3. Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      
      // FIX: Explicitly pass the image and name from token to session.user
      if (session.user) {
        session.user.image = token.picture || token.user?.image;
        session.user.name = token.name || token.user?.name;
      }
      
      return session;
    },
  },
});

export { handler as GET, handler as POST };