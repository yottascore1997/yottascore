import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

// GET all notifications
export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.govtExamNotification.findMany({
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST new notification
export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle FormData for file upload
    const formData = await req.formData();
    console.log("Received form data:", Object.fromEntries(formData.entries())); // Debug log

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const year = formData.get("year") as string;
    const month = formData.get("month") as string;
    const applyLastDate = formData.get("applyLastDate") as string;
    const applyLink = formData.get("applyLink") as string;
    const logoFile = formData.get("logo") as File | null;

    // Validate required fields
    if (!title || !description || !year || !month || !applyLastDate || !applyLink) {
      console.log("Missing fields:", { title, description, year, month, applyLastDate, applyLink }); // Debug log
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate year and month
    if (parseInt(year) < 2000 || parseInt(year) > 2100) {
      return NextResponse.json(
        { error: "Invalid year" },
        { status: 400 }
      );
    }

    if (parseInt(month) < 1 || parseInt(month) > 12) {
      return NextResponse.json(
        { error: "Invalid month" },
        { status: 400 }
      );
    }

    // Handle logo upload
    let logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      try {
        // Create a unique filename
        const timestamp = Date.now();
        const fileExtension = logoFile.name.split('.').pop();
        const fileName = `exam-logo-${timestamp}.${fileExtension}`;
        
        // Convert file to buffer
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Save file to public/uploads directory
        const fs = require('fs');
        const path = require('path');
        
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        
        // Set the URL for the uploaded file
        logoUrl = `/uploads/${fileName}`;
        console.log("Logo uploaded successfully:", logoUrl);
      } catch (error) {
        console.error("Error uploading logo:", error);
        return NextResponse.json(
          { error: "Failed to upload logo" },
          { status: 500 }
        );
      }
    }

    // Create notification
    const notification = await prisma.govtExamNotification.create({
      data: {
        title,
        description,
        year: parseInt(year),
        month: parseInt(month),
        applyLastDate: new Date(applyLastDate),
        applyLink,
        logoUrl,
      },
    });

    console.log("Created notification:", notification); // Debug log
    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 