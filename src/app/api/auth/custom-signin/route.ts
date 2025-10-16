import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("Authenticating user:", email);

    // Simple mock authentication - replace this with your actual user validation
    // This is just to get your custom auth working
    const mockUsers = [
      {
        id: "1",
        email: "wmicah56@gmail.com",
        password: "password123",
        firstName: "William",
        lastName: "Micha",
      },
      // Add more test users here
    ];

    const user = mockUsers.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create a session token
    const sessionToken = `session_${user.id}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      sessionToken,
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Custom signin error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
