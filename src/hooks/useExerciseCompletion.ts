"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { trpc } from "@/app/_trpc/client";

export function useExerciseCompletion() {
  const [exerciseCompletions, setExerciseCompletions] = useState<
    Map<string, boolean>
  >(new Map());

  const utils = trpc.useUtils();

  // Load all completions
  const { data: completions = [], refetch: refetchCompletions } =
    trpc.exerciseCompletion.getExerciseCompletions.useQuery();

  // Mutation for marking exercises complete
  const markExerciseCompleteMutation =
    trpc.exerciseCompletion.markExerciseComplete.useMutation({
      onSuccess: () => {
        // Invalidate and refetch completions to ensure UI is in sync
        utils.exerciseCompletion.getExerciseCompletions.invalidate();
      },
      onError: error => {
        console.error("Failed to update exercise completion:", error);
        // Revert optimistic update on error
        refetchCompletions();
      },
    });

  // Create a stable string representation of completions for comparison
  const completionsKey = useMemo(() => {
    if (!completions || completions.length === 0) {
      return "empty";
    }
    return completions
      .map(
        c =>
          `${c.exerciseId}-${c.programDrillId}-${c.completed}-${c.date || ""}`
      )
      .sort()
      .join("|");
  }, [completions]);

  // Update completions only when the key changes
  useEffect(() => {
    if (!completions || completions.length === 0) {
      setExerciseCompletions(new Map());
      return;
    }

    const map = new Map<string, boolean>();
    completions.forEach(completion => {
      let key: string;
      // Include date in the key if it exists
      const dateSuffix = completion.date ? `-${completion.date}` : "";
      if (completion.programDrillId === "standalone-routine") {
        // This is a standalone routine exercise
        key = `standalone-${completion.exerciseId}${dateSuffix}`;
      } else if (completion.programDrillId === "standalone-drill") {
        // This is a standalone drill
        key = `standalone-${completion.exerciseId}${dateSuffix}`;
      } else {
        // This is a routine exercise within a program
        key = `${completion.programDrillId}-${completion.exerciseId}${dateSuffix}`;
      }
      map.set(key, completion.completed);
    });

    setExerciseCompletions(map);
  }, [completionsKey]);

  // Check if an exercise is completed
  const isExerciseCompleted = (
    exerciseId: string,
    programDrillId?: string,
    date?: string
  ) => {
    // Handle different types of exercises
    let key: string;
    if (programDrillId) {
      // Check if this is a routine assignment ID (standalone routine)
      if (programDrillId.startsWith("cm") && programDrillId.length > 20) {
        // This looks like a routine assignment ID, treat as standalone routine
        key = `standalone-${exerciseId}${date ? `-${date}` : ""}`;
      } else {
        // This is a program drill ID
        key = `${programDrillId}-${exerciseId}${date ? `-${date}` : ""}`;
      }
    } else {
      // For standalone exercises, use a special key
      key = `standalone-${exerciseId}${date ? `-${date}` : ""}`;
    }
    return exerciseCompletions.get(key) || false;
  };

  // Mark an exercise as complete/incomplete
  const markExerciseComplete = async (
    exerciseId: string,
    programDrillId: string | undefined,
    completed: boolean,
    date?: string
  ) => {
    // Handle different types of exercises
    let key: string;
    let actualProgramDrillId: string;

    if (programDrillId) {
      // Check if this is a routine assignment ID (standalone routine)
      if (programDrillId.startsWith("cm") && programDrillId.length > 20) {
        // This looks like a routine assignment ID, treat as standalone routine
        key = `standalone-${exerciseId}${date ? `-${date}` : ""}`;
        actualProgramDrillId = "standalone-routine";
      } else {
        // This is a program drill ID
        key = `${programDrillId}-${exerciseId}${date ? `-${date}` : ""}`;
        actualProgramDrillId = programDrillId;
      }
    } else {
      // For standalone exercises, use a special programDrillId
      key = `standalone-${exerciseId}${date ? `-${date}` : ""}`;
      actualProgramDrillId = "standalone-routine";
    }

    console.log("🎯 markExerciseComplete called with:", {
      exerciseId,
      programDrillId,
      completed,
      date,
      key,
      actualProgramDrillId,
    });

    // Update UI immediately (optimistic update)
    setExerciseCompletions(prev => {
      const newMap = new Map(prev);
      newMap.set(key, completed);
      return newMap;
    });

    try {
      await markExerciseCompleteMutation.mutateAsync({
        exerciseId,
        programDrillId: actualProgramDrillId,
        completed,
        date,
      });
    } catch (error) {
      console.error("❌ Failed to update exercise completion:", error);
      // Revert optimistic update on error
      setExerciseCompletions(prev => {
        const newMap = new Map(prev);
        newMap.set(key, !completed);
        return newMap;
      });
      throw error;
    }
  };

  return {
    isExerciseCompleted,
    markExerciseComplete,
    refetchCompletions,
  };
}
