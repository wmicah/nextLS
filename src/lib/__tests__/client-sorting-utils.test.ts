/**
 * Unit tests for client sorting utilities
 * Run with: npm test client-sorting-utils
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  getLatestProgramDueDate,
  compareClientsByProgramDueDate,
  ClientForSorting,
} from "../client-sorting-utils";
import { getStartOfDay } from "../date-utils";

describe("getLatestProgramDueDate", () => {
  const today = getStartOfDay();

  it("should return null for client with no programs", () => {
    const client: ClientForSorting = {
      id: "1",
      name: "Test Client",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
    };

    const result = getLatestProgramDueDate(client, false);
    expect(result).toBeNull();
  });

  it("should return null for client with only completed programs", () => {
    const client: ClientForSorting = {
      id: "1",
      name: "Test Client",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
      programAssignments: [
        {
          id: "pa1",
          startDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
          completed: true,
          completedAt: new Date().toISOString(),
          program: {
            id: "p1",
            title: "Test Program",
            duration: 2,
          },
        },
      ],
    };

    const result = getLatestProgramDueDate(client, false);
    expect(result).toBeNull();
  });

  it("should return null for client with only past programs", () => {
    const pastDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
    const client: ClientForSorting = {
      id: "1",
      name: "Test Client",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
      programAssignments: [
        {
          id: "pa1",
          startDate: new Date(pastDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // Started 3 weeks ago
          completed: false,
          completedAt: null,
          program: {
            id: "p1",
            title: "Test Program",
            duration: 2, // 2 weeks, so ended 1 week ago
          },
        },
      ],
    };

    const result = getLatestProgramDueDate(client, false);
    expect(result).toBeNull();
  });

  it("should return end date for client with one active program", () => {
    const startDate = new Date(today);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // 2 weeks later

    const client: ClientForSorting = {
      id: "1",
      name: "Test Client",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
      programAssignments: [
        {
          id: "pa1",
          startDate: startDate.toISOString(),
          completed: false,
          completedAt: null,
          program: {
            id: "p1",
            title: "Test Program",
            duration: 2,
          },
        },
      ],
    };

    const result = getLatestProgramDueDate(client, false);
    expect(result).not.toBeNull();
    expect(result?.toISOString().split("T")[0]).toBe(
      getStartOfDay(endDate).toISOString().split("T")[0]
    );
  });

  it("should return latest end date for client with multiple programs", () => {
    const startDate1 = new Date(today);
    const endDate1 = new Date(startDate1);
    endDate1.setDate(endDate1.getDate() + 14); // Ends in 2 weeks

    const startDate2 = new Date(today);
    const endDate2 = new Date(startDate2);
    endDate2.setDate(endDate2.getDate() + 21); // Ends in 3 weeks (later)

    const client: ClientForSorting = {
      id: "1",
      name: "Test Client",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
      programAssignments: [
        {
          id: "pa1",
          startDate: startDate1.toISOString(),
          completed: false,
          completedAt: null,
          program: {
            id: "p1",
            title: "Program 1",
            duration: 2,
          },
        },
        {
          id: "pa2",
          startDate: startDate2.toISOString(),
          completed: false,
          completedAt: null,
          program: {
            id: "p2",
            title: "Program 2",
            duration: 3,
          },
        },
      ],
    };

    const result = getLatestProgramDueDate(client, false);
    expect(result).not.toBeNull();
    // Should return the later date (endDate2)
    expect(result?.toISOString().split("T")[0]).toBe(
      getStartOfDay(endDate2).toISOString().split("T")[0]
    );
  });

  it("should ignore programs without startDate", () => {
    const client: ClientForSorting = {
      id: "1",
      name: "Test Client",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
      programAssignments: [
        {
          id: "pa1",
          startDate: null, // No start date
          completed: false,
          completedAt: null,
          program: {
            id: "p1",
            title: "Test Program",
            duration: 2,
          },
        },
      ],
    };

    const result = getLatestProgramDueDate(client, false);
    expect(result).toBeNull();
  });
});

describe("compareClientsByProgramDueDate", () => {
  const today = getStartOfDay();

  it("should prioritize client with no programs over client with programs", () => {
    const clientA: ClientForSorting = {
      id: "1",
      name: "Client A (No Programs)",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
    };

    const clientB: ClientForSorting = {
      id: "2",
      name: "Client B (Has Programs)",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
      programAssignments: [
        {
          id: "pa1",
          startDate: today.toISOString(),
          completed: false,
          completedAt: null,
          program: {
            id: "p1",
            title: "Test Program",
            duration: 2,
          },
        },
      ],
    };

    const result = compareClientsByProgramDueDate(clientA, clientB, "asc", false);
    expect(result).toBeLessThan(0); // Client A should come first
  });

  it("should sort clients with programs by latest end date (ascending)", () => {
    const startDate1 = new Date(today);
    const endDate1 = new Date(startDate1);
    endDate1.setDate(endDate1.getDate() + 14); // Ends in 2 weeks

    const startDate2 = new Date(today);
    const endDate2 = new Date(startDate2);
    endDate2.setDate(endDate2.getDate() + 21); // Ends in 3 weeks (later)

    const clientA: ClientForSorting = {
      id: "1",
      name: "Client A (Earlier End)",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
      programAssignments: [
        {
          id: "pa1",
          startDate: startDate1.toISOString(),
          completed: false,
          completedAt: null,
          program: {
            id: "p1",
            title: "Program 1",
            duration: 2,
          },
        },
      ],
    };

    const clientB: ClientForSorting = {
      id: "2",
      name: "Client B (Later End)",
      createdAt: new Date().toISOString(),
      nextLessonDate: null,
      programAssignments: [
        {
          id: "pa2",
          startDate: startDate2.toISOString(),
          completed: false,
          completedAt: null,
          program: {
            id: "p2",
            title: "Program 2",
            duration: 3,
          },
        },
      ],
    };

    // Ascending: earlier dates come first
    const result = compareClientsByProgramDueDate(clientA, clientB, "asc", false);
    expect(result).toBeLessThan(0); // Client A (earlier end) should come first
  });

  it("should sort clients with no programs by creation date (newest first for asc)", () => {
    const olderDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
    const newerDate = new Date(today); // Today

    const clientA: ClientForSorting = {
      id: "1",
      name: "Client A (Older)",
      createdAt: olderDate.toISOString(),
      nextLessonDate: null,
    };

    const clientB: ClientForSorting = {
      id: "2",
      name: "Client B (Newer)",
      createdAt: newerDate.toISOString(),
      nextLessonDate: null,
    };

    // Ascending: newest first (so newer client comes first)
    const result = compareClientsByProgramDueDate(clientA, clientB, "asc", false);
    expect(result).toBeGreaterThan(0); // Client B (newer) should come first
  });
});

