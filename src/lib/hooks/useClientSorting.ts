/**
 * Custom hook for sorting clients
 * Provides memoized sorting with support for multiple sort criteria
 */

import { useMemo } from "react";
import { compareClientsByProgramDueDate } from "../client-sorting-utils";
import { getStartOfDay } from "../date-utils";

export interface ClientForSorting {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
  nextLessonDate: string | null;
  programAssignments?: Array<{
    id: string;
    startDate: string | null;
    completed: boolean;
    completedAt: string | null;
    program: {
      id: string;
      title: string;
      duration: number;
    };
  }>;
}

export type SortBy = "name" | "dueDate" | "createdAt" | "nextLesson";
export type SortOrder = "asc" | "desc";

interface UseClientSortingOptions {
  clients: ClientForSorting[];
  sortBy: SortBy;
  sortOrder: SortOrder;
  enableDebug?: boolean;
}

/**
 * Custom hook to sort clients based on the specified criteria
 * Results are memoized for performance
 */
export function useClientSorting({
  clients,
  sortBy,
  sortOrder,
  enableDebug = process.env.NODE_ENV === "development",
}: UseClientSortingOptions): ClientForSorting[] {
  return useMemo(() => {
    return [...clients].sort((a, b) => {
      let aValue: any, bValue: any;
      const now = new Date();

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;

        case "dueDate":
          // Use the shared utility function
          return compareClientsByProgramDueDate(a, b, sortOrder, enableDebug);

        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;

        case "nextLesson": {
          const today = getStartOfDay(now);

          const getNextLessonDate = (client: ClientForSorting) => {
            if (client.nextLessonDate) {
              const lessonDate = new Date(client.nextLessonDate);
              return lessonDate > today ? lessonDate : null;
            }
            return null;
          };

          const aNextLesson = getNextLessonDate(a);
          const bNextLesson = getNextLessonDate(b);

          if (aNextLesson && bNextLesson) {
            aValue = aNextLesson;
            bValue = bNextLesson;
          } else if (aNextLesson && !bNextLesson) {
            return -1;
          } else if (!aNextLesson && bNextLesson) {
            return 1;
          } else {
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
          }
          break;
        }

        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      // Handle different sort types
      if (sortBy === "createdAt") {
        if (sortOrder === "asc") {
          return aValue < bValue ? 1 : -1; // Newest first (descending dates)
        } else {
          return aValue > bValue ? 1 : -1; // Oldest first (ascending dates)
        }
      } else {
        // For name and nextLesson, use normal logic
        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }
    });
  }, [clients, sortBy, sortOrder, enableDebug]);
}

