"use client";

import React, { useState } from "react";
import {
  useDraggable,
} from "@dnd-kit/core";
import { COLORS, getGoldenAccent } from "@/lib/colors";
import { GripVertical, ChevronDown } from "lucide-react";
import { trpc } from "@/app/_trpc/client";
import { CSS } from "@dnd-kit/utilities";

interface ClientDetailDockProps {
  isOpen: boolean;
  activeTab?: "programs" | "routines";
  searchTerm?: string;
  onToggle: () => void;
  onTabChange?: (tab: "programs" | "routines") => void;
  onSearchChange?: (term: string) => void;
  onDragStart?: (item: { type: "program" | "routine"; id: string; title: string }) => void;
  onDragEnd?: (item: { type: "program" | "routine"; id: string; title: string } | null) => void;
}

interface DraggableItemProps {
  item: { id: string; title: string };
  type: "program" | "routine";
}

// Draggable item component using @dnd-kit
function DraggableItem({ item, type }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${type}-${item.id}`,
    data: {
      type,
      id: item.id,
      title: item.title,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-200"
      style={{
        backgroundColor: COLORS.BACKGROUND_CARD,
        borderColor: COLORS.BORDER_SUBTLE,
        ...style,
      }}
      onMouseEnter={e => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
          e.currentTarget.style.borderColor = COLORS.GOLDEN_ACCENT;
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD;
          e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE;
        }
      }}
    >
      <GripVertical
        className="h-4 w-4 flex-shrink-0"
        style={{ color: COLORS.TEXT_MUTED }}
      />
      <span
        className="text-sm font-medium truncate flex-1"
        style={{ color: COLORS.TEXT_PRIMARY }}
      >
        {item.title}
      </span>
    </div>
  );
}

export default function ClientDetailDock({
  isOpen,
  activeTab: controlledActiveTab,
  searchTerm: controlledSearchTerm,
  onToggle,
  onTabChange,
  onSearchChange,
  onDragStart,
  onDragEnd,
}: ClientDetailDockProps) {
  // Use controlled state if provided, otherwise use internal state
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [internalActiveTab, setInternalActiveTab] = useState<"programs" | "routines">("programs");
  
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const searchTerm = controlledSearchTerm ?? internalSearchTerm;
  
  const setActiveTab = (tab: "programs" | "routines") => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  
  const setSearchTerm = (term: string) => {
    if (onSearchChange) {
      onSearchChange(term);
    } else {
      setInternalSearchTerm(term);
    }
  };

  // Fetch programs and routines
  const { data: programs = [] } = trpc.programs.list.useQuery();
  const { data: routines = [] } = trpc.routines.list.useQuery();

  // Filter items based on search
  const filteredPrograms = programs.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredRoutines = routines.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Toggle button when closed - positioned fixed to not interfere with calendar */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 top-1/2 -translate-y-1/2 px-2 py-4 rounded-l-lg shadow-lg transition-all duration-300 z-50"
          style={{
            backgroundColor: COLORS.GOLDEN_ACCENT,
            color: COLORS.BACKGROUND_DARK,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = COLORS.GOLDEN_HOVER;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = COLORS.GOLDEN_ACCENT;
          }}
          title="Expand Dock"
        >
          <ChevronDown className="h-5 w-5 -rotate-90" />
        </button>
      )}
      
      {/* Dock container - only visible when open */}
      {isOpen && (
        <div
          className="absolute right-0 top-0 bottom-0 w-80 z-40 shadow-2xl border-l flex flex-col transition-all duration-300"
          style={{
            backgroundColor: COLORS.BACKGROUND_DARK,
            borderColor: COLORS.BORDER_SUBTLE,
          }}
        >

        {/* Expanded content */}
        {isOpen && (
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{
                borderColor: COLORS.BORDER_SUBTLE,
                backgroundColor: COLORS.BACKGROUND_CARD,
              }}
            >
              <h3
                className="text-lg font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Drag to Assign
              </h3>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: COLORS.TEXT_SECONDARY }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = COLORS.BACKGROUND_CARD_HOVER;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
                title="Collapse"
              >
                <ChevronDown className="h-5 w-5 rotate-90" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <button
                onClick={() => setActiveTab("programs")}
                className="flex-1 px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    activeTab === "programs" ? getGoldenAccent(0.1) : "transparent",
                  color:
                    activeTab === "programs" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
              >
                Programs ({filteredPrograms.length})
              </button>
              <button
                onClick={() => setActiveTab("routines")}
                className="flex-1 px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    activeTab === "routines" ? getGoldenAccent(0.1) : "transparent",
                  color:
                    activeTab === "routines" ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
                }}
              >
                Routines ({filteredRoutines.length})
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  backgroundColor: COLORS.BACKGROUND_CARD,
                  borderColor: COLORS.BORDER_SUBTLE,
                  color: COLORS.TEXT_PRIMARY,
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeTab === "programs" ? (
                filteredPrograms.length > 0 ? (
                  filteredPrograms.map(program => (
                    <DraggableItem
                      key={program.id}
                      item={{ id: program.id, title: program.title }}
                      type="program"
                    />
                  ))
                ) : (
                  <div
                    className="text-center py-8 text-sm"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    {searchTerm ? "No programs found" : "No programs available"}
                  </div>
                )
              ) : filteredRoutines.length > 0 ? (
                filteredRoutines.map(routine => (
                  <DraggableItem
                    key={routine.id}
                    item={{ id: routine.id, title: routine.name }}
                    type="routine"
                  />
                ))
              ) : (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  {searchTerm ? "No routines found" : "No routines available"}
                </div>
              )}
            </div>
          </>
        )}
        </div>
      )}
    </>
  );
}

