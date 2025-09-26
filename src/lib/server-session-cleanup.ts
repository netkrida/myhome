/**
 * Server-side session cleanup utilities
 * This file contains only server-side cleanup functions
 */

import { cookies } from "next/headers";

/**
 * Server-side session cleanup utility
 */
export class ServerSessionCleanup {
  /**
   * Clear all authentication-related cookies on the server
   */
  static async clearAuthCookies(): Promise<void> {
    try {
      const cookieStore = await cookies();
      
      const authCookies = [
        // NextAuth v4 cookies
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.csrf-token",
        "__Secure-next-auth.csrf-token",
        "next-auth.callback-url",
        "__Secure-next-auth.callback-url",
        "next-auth.pkce.code_verifier",
        "__Secure-next-auth.pkce.code_verifier",
        
        // Auth.js v5 cookies
        "authjs.session-token",
        "__Secure-authjs.session-token",
        "authjs.csrf-token",
        "__Secure-authjs.csrf-token",
        "authjs.callback-url",
        "__Secure-authjs.callback-url",
        "authjs.pkce.code_verifier",
        "__Secure-authjs.pkce.code_verifier",
        
        // Custom auth cookies
        "auth-token",
        "session-token",
        "user-session",
        "auth_token",
        "session_token",
        "user_session"
      ];

      for (const cookieName of authCookies) {
        try {
          cookieStore.delete(cookieName);
          console.log(`🧹 Server cleanup - Cleared cookie: ${cookieName}`);
        } catch (error) {
          console.log(`⚠️ Server cleanup - Could not clear cookie: ${cookieName}`);
        }
      }

      console.log("✅ Server cleanup - All auth cookies cleared");
    } catch (error) {
      console.error("❌ Server cleanup - Error clearing cookies:", error);
      throw error;
    }
  }

  /**
   * Create response headers to clear cookies on client
   */
  static createCookieClearHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const authCookies = [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
      "authjs.csrf-token",
      "__Secure-authjs.csrf-token"
    ];

    const cookieValues = authCookies.map(name => 
      `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    headers['Set-Cookie'] = cookieValues.join(', ');
    
    return headers;
  }

  /**
   * Get comprehensive list of all possible auth cookies
   */
  static getAllPossibleAuthCookies(): string[] {
    return [
      // NextAuth v4 cookies
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.csrf-token",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
      "next-auth.pkce.code_verifier",
      "__Secure-next-auth.pkce.code_verifier",
      "next-auth.state",
      "__Secure-next-auth.state",
      
      // Auth.js v5 cookies
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "authjs.csrf-token",
      "__Secure-authjs.csrf-token",
      "authjs.callback-url",
      "__Secure-authjs.callback-url",
      "authjs.pkce.code_verifier",
      "__Secure-authjs.pkce.code_verifier",
      "authjs.state",
      "__Secure-authjs.state",
      
      // Custom auth cookies
      "auth-token",
      "session-token",
      "user-session",
      "auth_token",
      "session_token",
      "user_session",
      "user-context",
      "auth-state",
      "login-state",
      
      // Provider-specific cookies
      "discord-oauth-state",
      "google-oauth-state",
      "github-oauth-state",
      "oauth-state",
      "oauth-code-verifier",
      "oauth-nonce",
      
      // CSRF and security cookies
      "csrf-token",
      "__Secure-csrf-token",
      "xsrf-token",
      "__Secure-xsrf-token",
      
      // Session management cookies
      "connect.sid",
      "session",
      "sessionid",
      "JSESSIONID",
      "PHPSESSID",
      
      // Framework-specific cookies
      "laravel_session",
      "django_session",
      "express-session",
      "koa.sess",
      "koa.sess.sig",
      
      // Custom application cookies that might store auth data
      "remember_token",
      "access_token",
      "refresh_token",
      "id_token",
      "bearer_token"
    ];
  }
}

/**
 * Convenience functions for easy import
 */
export const clearAuthCookies = () => ServerSessionCleanup.clearAuthCookies();
export const createCookieClearHeaders = () => ServerSessionCleanup.createCookieClearHeaders();
export const getAllPossibleAuthCookies = () => ServerSessionCleanup.getAllPossibleAuthCookies();
