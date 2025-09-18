#!/usr/bin/env node

/**
 * Test script for thumbnail generation
 * This script helps debug thumbnail generation issues by testing the API endpoint directly
 */

const fs = require("fs");
const path = require("path");

// Test data
const testCases = [
  {
    name: "Master video test",
    filename: "12460736_3840_2160_60fps.mp4",
    videoType: "master",
    videoUrl: null,
  },
  {
    name: "Local video test (no URL)",
    filename: "test_video.mp4",
    videoType: "local",
    videoUrl: null,
  },
  {
    name: "Local video test (with URL)",
    filename: "test_video.mp4",
    videoType: "local",
    videoUrl: "https://example.com/test_video.mp4",
  },
];

async function testThumbnailGeneration() {
  console.log("🧪 Testing thumbnail generation...\n");

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log(`   Filename: ${testCase.filename}`);
    console.log(`   Video Type: ${testCase.videoType}`);
    console.log(`   Video URL: ${testCase.videoUrl || "None"}`);

    try {
      const response = await fetch(
        "http://localhost:3000/api/generate-thumbnail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: testCase.filename,
            videoType: testCase.videoType,
            videoUrl: testCase.videoUrl,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log(`   ✅ Success: ${data.success ? "Yes" : "No"}`);
        if (data.thumbnailUrl) {
          console.log(`   🖼️  Thumbnail URL: ${data.thumbnailUrl}`);
        }
        if (data.error) {
          console.log(`   ⚠️  Error: ${data.error}`);
        }
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
        console.log(`   📝 Response:`, data);
      }
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }

    console.log(""); // Empty line for readability
  }

  // Check if FFmpeg is available
  console.log("🔧 Checking FFmpeg availability...");
  const { spawn } = require("child_process");

  const ffmpegCheck = spawn("ffmpeg", ["-version"]);

  ffmpegCheck.on("close", code => {
    if (code === 0) {
      console.log("✅ FFmpeg is available");
    } else {
      console.log("❌ FFmpeg is not available (exit code:", code, ")");
    }
  });

  ffmpegCheck.on("error", error => {
    console.log("❌ FFmpeg is not available:", error.message);
  });

  // Check upload directories
  console.log("\n📁 Checking upload directories...");
  const uploadDirs = [
    "uploads/master-library-videos",
    "uploads/master-library-thumbnails",
    "uploads/temp-videos",
    "uploads/library-thumbnails",
  ];

  for (const dir of uploadDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      console.log(`✅ ${dir}: ${files.length} files`);
    } else {
      console.log(`❌ ${dir}: Directory does not exist`);
    }
  }
}

// Run the test
testThumbnailGeneration().catch(console.error);

