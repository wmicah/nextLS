"use client";

// NextLevel Coaching - Email Test Page
// Test your email service in the browser

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function EmailTestPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [testType, setTestType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testTypes = [
    { value: "welcome", label: "Welcome Email" },
    { value: "coach-notification", label: "Coach Notification" },
    { value: "lesson-reminder", label: "Lesson Reminder" },
    { value: "program-assignment", label: "Program Assignment" },
    { value: "test-config", label: "Configuration Test" },
  ];

  const handleTest = async () => {
    if (!email || !testType) {
      toast.error("Please fill in email and test type");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testType,
          email,
          name: name || undefined,
          coachName: coachName || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setResult(data);
      } else {
        toast.error(data.message || "Test failed");
        setResult(data);
      }
    } catch (error) {
      toast.error("Failed to send test email");
      setResult({ error: "Network error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>NextLevel Coaching - Email Test</CardTitle>
            <CardDescription>
              Test your email service configuration with Resend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>

              <div>
                <Label htmlFor="testType">Test Type *</Label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Test Client"
                />
              </div>

              <div>
                <Label htmlFor="coachName">Coach Name (optional)</Label>
                <Input
                  id="coachName"
                  value={coachName}
                  onChange={e => setCoachName(e.target.value)}
                  placeholder="Test Coach"
                />
              </div>
            </div>

            <Button
              onClick={handleTest}
              disabled={isLoading || !email || !testType}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send Test Email"}
            </Button>

            {result && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Test Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>
                <strong>Note:</strong> Make sure you have:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Set up your Resend API key in environment variables</li>
                <li>Added nxlvlcoach.com domain to Resend</li>
                <li>Configured DNS records for your domain</li>
                <li>Verified your domain in Resend dashboard</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
