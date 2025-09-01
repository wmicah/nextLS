import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const { token } = await params
		const lessonId = token

		const lesson = await db.event.findUnique({
			where: { id: lessonId },
		})

		if (!lesson) {
			return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
		}

		// Update lesson status to confirmed
		await db.event.update({
			where: { id: lessonId },
			data: {
				description: "Lesson confirmed by client",
			},
		})

		// Return success page
		return new NextResponse(
			`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lesson Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 30px; border-radius: 10px; text-align: center; }
            .success { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <h1>Lesson Confirmed!</h1>
            <p>Your lesson has been successfully confirmed. You will receive a reminder before your scheduled time.</p>
            <p>Thank you!</p>
          </div>
        </body>
      </html>
    `,
			{
				headers: { "Content-Type": "text/html" },
			}
		)
	} catch (error) {
		console.error("Error accepting lesson:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
