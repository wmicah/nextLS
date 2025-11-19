import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { verifyLessonToken } from "@/lib/jwt"

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const { token } = await params

		// Verify the JWT token
		let tokenPayload
		try {
			tokenPayload = await verifyLessonToken(token)
		} catch (error) {
			return NextResponse.json(
				{ error: "Invalid or expired token" },
				{ status: 401 }
			)
		}

		// Find the lesson
		const lesson = await db.event.findUnique({
			where: { id: tokenPayload.lessonId },
			include: {
				client: true,
				coach: true,
			},
		})

		if (!lesson) {
			return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
		}

		// Verify the lesson belongs to the client in the token
		if (lesson.clientId !== tokenPayload.clientId) {
			return NextResponse.json(
				{ error: "Unauthorized access" },
				{ status: 403 }
			)
		}

		// Return a simple confirmation page
		return new NextResponse(
			`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Confirm Lesson</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 30px; border-radius: 10px; }
            .button { display: inline-block; padding: 12px 24px; margin: 10px; text-decoration: none; border-radius: 5px; }
            .accept { background: #4CAF50; color: white; }
            .decline { background: #f44336; color: white; }
            .lesson-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Confirm Your Lesson</h1>
            <div class="lesson-info">
              <h2>Lesson Details</h2>
              <p><strong>Coach:</strong> ${lesson.coach.name}</p>
              <p><strong>Date:</strong> ${new Date(
								lesson.date
							).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date(
								lesson.date
							).toLocaleTimeString()}</p>
            </div>
            <p>Please confirm or decline this lesson:</p>
            <a href="/api/lesson/confirm/${token}/accept" class="button accept">Accept Lesson</a>
            <a href="/api/lesson/confirm/${token}/decline" class="button decline">Decline Lesson</a>
          </div>
        </body>
      </html>
    `,
			{
				headers: { "Content-Type": "text/html" },
			}
		)
	} catch (error) {
		console.error("Error confirming lesson:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const { token } = await params
		const { action } = await request.json() // "accept" or "decline"

		// Verify the JWT token
		let tokenPayload
		try {
			tokenPayload = await verifyLessonToken(token)
		} catch (error) {
			return NextResponse.json(
				{ error: "Invalid or expired token" },
				{ status: 401 }
			)
		}

		const lesson = await db.event.findUnique({
			where: { id: tokenPayload.lessonId },
		})

		if (!lesson) {
			return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
		}

		// Verify the lesson belongs to the client in the token
		if (lesson.clientId !== tokenPayload.clientId) {
			return NextResponse.json(
				{ error: "Unauthorized access" },
				{ status: 403 }
			)
		}

		if (action === "accept") {
			// Update lesson status to confirmed
			await db.event.update({
				where: { id: tokenPayload.lessonId },
				data: {
					status: "CONFIRMED",
					description: lesson.description
						? `${lesson.description} - Confirmed by client`
						: "Confirmed by client",
				},
			})
		} else if (action === "decline") {
			// Update lesson status to declined instead of deleting
			await db.event.update({
				where: { id: tokenPayload.lessonId },
				data: {
					status: "DECLINED",
					description: lesson.description
						? `${lesson.description} - Declined by client`
						: "Declined by client",
				},
			})
		}

		return NextResponse.json({ success: true, action })
	} catch (error) {
		console.error("Error processing lesson confirmation:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
