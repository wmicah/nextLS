// NextLevel Coaching - Email Test Script
// Run this script to test your email service

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL || "test@example.com";

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY environment variable is required");
  process.exit(1);
}

async function testEmail() {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    console.log("🧪 Testing NextLevel Coaching Email Service...");
    console.log(`📧 Sending test email to: ${TEST_EMAIL}`);

    const result = await resend.emails.send({
      from: "NextLevel Coaching <noreply@nxlvlcoach.com>",
      to: [TEST_EMAIL],
      subject: "NextLevel Coaching - Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4A5A70;">NextLevel Coaching Email Test</h1>
          <p>This is a test email to verify your email service is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Domain:</strong> nxlvlcoach.com</p>
          <p>If you received this email, your NextLevel Coaching email service is working properly!</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("❌ Email test failed:", result.error);
      process.exit(1);
    } else {
      console.log("✅ Email test successful!");
      console.log("📧 Email ID:", result.data?.id);
      console.log("📬 Check your inbox for the test email");
    }
  } catch (error) {
    console.error("❌ Email test failed:", error);
    process.exit(1);
  }
}

testEmail();
