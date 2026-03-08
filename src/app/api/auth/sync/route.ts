import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { clerkId, email, username, avatar_url } = await req.json();

    if (!clerkId || !email) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists in MongoDB
    let user = await User.findOne({ 
      $or: [
        { clerkId },
        { email }
      ]
    });

    if (user) {
      // Update existing user if clerkId wasn't linked yet or just update profile
      user.clerkId = clerkId;
      if (avatar_url) user.avatar_url = avatar_url;
      await user.save();
      return NextResponse.json({ message: "User synced successfully", user });
    }

    // Create new user in MongoDB
    // Since clerk handles password, we don't need one here
    user = await User.create({
      clerkId,
      email,
      username: username || email.split("@")[0],
      avatar_url,
    });

    return NextResponse.json({ message: "User created and synced", user });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ message: "Server error during sync", error: error.message }, { status: 500 });
  }
}
