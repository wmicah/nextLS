import { NextRequest, NextResponse } from "next/server"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
	// Check if we have the required environment variables
	if (!process.env.RESEND_API_KEY) {
		return NextResponse.json(
			{ error: "Email service not configured" },
			{ status: 503 }
		)
	}

	// Only import Resend when we have the API key
	const { Resend } = await import("resend")
	const resend = new Resend(process.env.RESEND_API_KEY)

	try {
		const { to, subject, body, coachName, clientName, clientEmail } =
			await request.json()

		// Validate required fields
		if (!to || !subject || !body) {
			return NextResponse.json(
				{ error: "Missing required fields: to, subject, body" },
				{ status: 400 }
			)
		}

		// Send email using Resend
		console.log("📧 Attempting to send email to:", to)
		console.log("📧 Subject:", subject)

		const { data, error } = await resend.emails.send({
			from: "Coach Platform <onboarding@resend.dev>", // For development - replace with your domain for production
			to: [to],
			subject: subject,
			html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4A5A70 0%, #606364 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #4A5A70;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏆 Coach Platform</h1>
          </div>
          <div class="content">
            ${body.replace(/\n/g, "<br>")}
            <br><br>
            <a href="${
							process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
						}/dashboard" class="button">
              View Dashboard
            </a>
          </div>
          <div class="footer">
            <p>This email was sent from your Coach Platform.</p>
            <p>If you have any questions, please contact support.</p>
          </div>
        </body>
        </html>
      `,
		})

		if (error) {
			console.error("❌ Resend error:", error)
			return NextResponse.json(
				{ error: "Failed to send email", details: error },
				{ status: 500 }
			)
		}

		console.log("✅ Email sent successfully:", data)
		return NextResponse.json({ success: true, data })
	} catch (error) {
		console.error("Email API error:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
