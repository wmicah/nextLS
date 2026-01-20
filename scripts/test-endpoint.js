// Simple test to check if the tRPC endpoint is accessible
const testEndpoint = async () => {
  try {
    const response = await fetch("/api/trpc/clientRouter.markDrillComplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        drillId: "test-id",
        completed: true,
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    const text = await response.text();
    console.log("Response body:", text);
  } catch (error) {
    console.error("Error testing endpoint:", error);
  }
};

testEndpoint();
