/**
 * Simple test script to send a lesson reminder
 * Uses built-in fetch (Node.js 18+)
 */

async function sendTestReminder() {
  try {
    console.log("🧪 Sending test reminder to shizukaedit@gmail.com...");

    const response = await fetch("http://localhost:3000/api/test-reminder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientEmail: "shizukaedit@gmail.com",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Test reminder sent successfully!");
      console.log("📋 Results:", JSON.stringify(result, null, 2));

      if (result.data?.confirmationLink) {
        console.log("\n🔗 Confirmation Link:");
        console.log(result.data.confirmationLink);
        console.log("\n📱 You can test the confirmation by visiting this link");
      }
    } else {
      const error = await response.text();
      console.error("❌ Test reminder failed:", response.status, error);
    }
  } catch (error) {
    console.error("❌ Test reminder error:", error.message);
    console.log(
      "\n💡 Make sure your Next.js app is running on http://localhost:3000"
    );
  }
}

// Run the test
sendTestReminder();
