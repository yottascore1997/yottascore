"use client";
import { useState } from "react";

export default function TestNotificationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createTestNotification = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/exam-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "UPSC Civil Services Examination 2024",
          description: `The Union Public Service Commission (UPSC) has announced the Civil Services Examination 2024.

Key Details:
- Preliminary Examination: June 16, 2024
- Main Examination: September 20, 2024
- Total Vacancies: 1056
- Age Limit: 21-32 years
- Educational Qualification: Bachelor's degree

Important Dates:
- Application Start: February 14, 2024
- Last Date to Apply: March 5, 2024
- Admit Card Release: May 2024

Selection Process:
1. Preliminary Examination
2. Main Examination
3. Personality Test (Interview)

For more details, visit the official website.`,
          year: 2024,
          month: 2,
          applyLastDate: "2024-03-05",
          applyLink: "https://upsc.gov.in",
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to create notification" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Test Exam Notification</h1>
      
      <div className="mb-6">
        <button
          onClick={createTestNotification}
          disabled={loading}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Create Test Notification"}
        </button>
      </div>

      {result && (
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-bold mb-2">Testing Steps:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click "Create Test Notification" to create a sample notification</li>
          <li>Check the result above for success/error</li>
          <li>Go to <a href="/admin/exam-notifications" className="text-blue-700 hover:underline">Notifications List</a> to verify the created notification</li>
          <li>Go to <a href="/notifications" className="text-blue-700 hover:underline">Student View</a> to see how it appears to students</li>
        </ol>
      </div>
    </div>
  );
} 