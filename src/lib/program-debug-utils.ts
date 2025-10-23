// NextLevel Coaching - Program Debug Utilities
// Help debug program creation issues on Vercel

import { z } from "zod";

// Enhanced validation schema with better error messages
export const enhancedProgramSchema = z.object({
  title: z
    .string()
    .min(1, "Program title is required")
    .max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  level: z.enum(["Drive", "Whip", "Separation", "Stability", "Extension"]),
  duration: z
    .number()
    .min(1, "Duration must be at least 1 week")
    .max(52, "Duration too long"),
  weeks: z
    .array(
      z.object({
        weekNumber: z
          .number()
          .min(1, "Week number must be positive")
          .max(52, "Week number too high"),
        title: z
          .string()
          .min(1, "Week title is required")
          .max(100, "Week title too long"),
        description: z
          .string()
          .max(500, "Week description too long")
          .optional(),
        days: z
          .array(
            z.object({
              dayNumber: z
                .number()
                .min(1, "Day number must be positive")
                .max(7, "Day number too high"),
              title: z
                .string()
                .min(1, "Day title is required")
                .max(100, "Day title too long"),
              description: z
                .string()
                .max(500, "Day description too long")
                .optional(),
              drills: z
                .array(
                  z.object({
                    order: z.number().min(1, "Drill order must be positive"),
                    title: z
                      .string()
                      .min(1, "Drill title is required")
                      .max(100, "Drill title too long"),
                    description: z
                      .string()
                      .max(500, "Drill description too long")
                      .optional(),
                    duration: z
                      .string()
                      .max(50, "Duration too long")
                      .optional(),
                    videoUrl: z
                      .string()
                      .url("Invalid video URL")
                      .optional()
                      .or(z.literal("")),
                    notes: z.string().max(1000, "Notes too long").optional(),
                    sets: z
                      .number()
                      .min(0, "Sets must be non-negative")
                      .max(100, "Sets too high")
                      .optional(),
                    reps: z
                      .number()
                      .min(0, "Reps must be non-negative")
                      .max(1000, "Reps too high")
                      .optional(),
                    tempo: z.string().max(50, "Tempo too long").optional(),
                    supersetId: z
                      .string()
                      .max(100, "Superset ID too long")
                      .optional(),
                    supersetOrder: z
                      .number()
                      .min(0, "Superset order must be non-negative")
                      .max(100, "Superset order too high")
                      .optional(),
                    routineId: z
                      .string()
                      .max(100, "Routine ID too long")
                      .optional(),
                    type: z.string().max(50, "Type too long").optional(),
                  })
                )
                .max(50, "Too many drills per day"), // Limit drills per day
            })
          )
          .max(7, "Too many days per week"), // Limit days per week
      })
    )
    .max(52, "Too many weeks"), // Limit total weeks
});

// Function to validate and clean program data
export function validateAndCleanProgramData(data: any) {
  try {
    // First, validate the structure
    const validated = enhancedProgramSchema.parse(data);

    // Clean up any potential issues
    const cleaned = {
      ...validated,
      weeks: validated.weeks.map(week => ({
        ...week,
        days: week.days.map(day => ({
          ...day,
          drills: day.drills.map((drill, index) => ({
            ...drill,
            order: drill.order || index + 1, // Ensure order is set
            videoUrl: drill.videoUrl === "" ? undefined : drill.videoUrl, // Clean empty URLs
            sets: drill.sets || undefined, // Clean undefined numbers
            reps: drill.reps || undefined,
            supersetOrder: drill.supersetOrder || undefined,
            routineId: drill.routineId || undefined, // Preserve routineId
            type: drill.type || undefined, // Preserve type
          })),
        })),
      })),
    };

    return { success: true, data: cleaned };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => ({
          path: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
      };
    }
    return {
      success: false,
      errors: [
        {
          path: "unknown",
          message: "Unknown validation error",
          code: "unknown",
        },
      ],
    };
  }
}

// Function to check payload size
export function checkPayloadSize(data: any): {
  size: number;
  isTooLarge: boolean;
  limit: number;
} {
  const jsonString = JSON.stringify(data);
  const size = new Blob([jsonString]).size;
  const limit = 4.5 * 1024 * 1024; // 4.5MB limit for Vercel

  return {
    size,
    isTooLarge: size > limit,
    limit,
  };
}

// Function to log program creation details for debugging
export function logProgramCreation(
  data: any,
  context: string = "program-creation"
) {
  const payloadCheck = checkPayloadSize(data);

  console.log(`=== ${context.toUpperCase()} DEBUG ===`);
  console.log(
    "Payload size:",
    `${(payloadCheck.size / 1024 / 1024).toFixed(2)}MB`
  );
  console.log("Is too large:", payloadCheck.isTooLarge);
  console.log("Weeks count:", data.weeks?.length || 0);
  console.log(
    "Total days:",
    data.weeks?.reduce(
      (acc: number, week: any) => acc + (week.days?.length || 0),
      0
    ) || 0
  );
  console.log(
    "Total drills:",
    data.weeks?.reduce(
      (acc: number, week: any) =>
        acc +
        (week.days?.reduce(
          (dayAcc: number, day: any) => dayAcc + (day.drills?.length || 0),
          0
        ) || 0),
      0
    ) || 0
  );

  if (payloadCheck.isTooLarge) {
    console.warn(
      "⚠️ Payload is too large for Vercel! Consider reducing program complexity."
    );
  }

  return payloadCheck;
}
