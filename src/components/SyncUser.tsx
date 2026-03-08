"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function SyncUser() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          // Point to our backend API URL for syncing
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          
          await fetch(`${apiUrl}/auth/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              username: user.username || user.firstName || "User",
              avatar_url: user.imageUrl,
            }),
          });
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user]);

  return null;
}
