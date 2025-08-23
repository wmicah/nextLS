import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

export async function GET(
	request: NextRequest,
	{ params }: { params: { token: string } }
) {
	try {
		const token = params.token

		// TODO: Implement proper token verification
		// For now, we'll use a simple approach
		// In production, you'd want to use JWT or similar

		// Extract lesson ID from token (this is a simplified approach)
		const lessonId = token // In real implementation, decode the token

		// Find the lesson
		const lesson = await db.event.findUnique({
			where: { id: lessonId },
			include: {
				client: true,
				coach: true,
			},
		})

		if (!lesson) {
			return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
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
	{ params }: { params: { token: string } }
) {
	try {
		const token = params.token
		const { action } = await request.json() // "accept" or "decline"

		// TODO: Implement proper token verification
		const lessonId = token

		const lesson = await db.event.findUnique({
			where: { id: lessonId },
		})

		if (!lesson) {
			return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
		}

		if (action === "accept") {
			// Update lesson status to confirmed
			await db.event.update({
				where: { id: lessonId },
				data: {
					// Add a status field to the Event model if needed
					// For now, we'll just update the description
					description: "Lesson confirmed by client",
				},
			})
		} else if (action === "decline") {
			// Delete the lesson or mark as declined
			await db.event.delete({
				where: { id: lessonId },
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
