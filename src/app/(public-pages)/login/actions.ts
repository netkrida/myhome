"use server";

import { signIn } from "@/server/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      error: "Email and password are required"
    };
  }

  try {
    console.log("🔐 Server Action - Attempting login for:", email);
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    console.log("🔐 Server Action - Login result:", result);

    // If login successful, redirect to dashboard
    redirect("/dashboard");
    
  } catch (error) {
    console.error("🔐 Server Action - Login error:", error);
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error: "Invalid credentials"
          };
        default:
          return {
            error: "Authentication failed"
          };
      }
    }
    
    // If it's a redirect error (which is expected), let it through
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    
    return {
      error: "An unexpected error occurred"
    };
  }
}
