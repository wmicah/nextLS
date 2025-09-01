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

		// Delete the lesson
		await db.event.delete({
			where: { id: lessonId },
		})

		// Return success page
		return new NextResponse(
			`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lesson Declined</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 30px; border-radius: 10px; text-align: center; }
            .declined { color: #f44336; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="declined">❌</div>
            <h1>Lesson Declined</h1>
            <p>Your lesson has been declined and removed from the schedule.</p>
            <p>Please contact your coach to reschedule if needed.</p>
          </div>
        </body>
      </html>
    `,
			{
				headers: { "Content-Type": "text/html" },
			}
		)
	} catch (error) {
		console.error("Error declining lesson:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
