"use client";

import ProgramBuilder from "@/components/ProgramBuilder";

export default function ProgramBuilderDemo() {
  return (
    <div>
      <ProgramBuilder
        onSave={weeks => {
          console.log("Program saved:", weeks);
          alert("Program saved! Check console for details.");
        }}
      />
    </div>
  );
}
