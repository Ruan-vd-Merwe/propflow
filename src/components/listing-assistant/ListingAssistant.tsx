"use client";

import { useState } from "react";
import { EntryMethodPicker, type EntryMethod } from "./EntryMethodPicker";
import { VoiceQuickDescribe } from "./VoiceQuickDescribe";
import { VoiceGuidedQA } from "./VoiceGuidedQA";
import { PasteListingText } from "./PasteListingText";
import { ListingImprovementPanel } from "./ListingImprovementPanel";
import type { ListingFormSnapshot, TagCatalogs } from "./types";

type Phase = "picker" | "quick" | "guided" | "paste" | "improve" | "dismissed";

export function ListingAssistant({
  formSnapshot,
  hasPhotos,
  currentName,
  currentDescription,
  tagCatalogs,
  onApplyFields,
  onApplyTitle,
  onApplyDescription,
}: {
  formSnapshot: ListingFormSnapshot;
  hasPhotos: boolean;
  currentName: string;
  currentDescription: string;
  tagCatalogs: TagCatalogs;
  onApplyFields: (fields: Partial<ListingFormSnapshot>) => void;
  onApplyTitle: (title: string) => void;
  onApplyDescription: (description: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("picker");

  function handleSelect(method: EntryMethod) {
    if (method === "manual") {
      setPhase("dismissed");
      return;
    }
    setPhase(method);
  }

  function handleApply(fields: Partial<ListingFormSnapshot>) {
    onApplyFields(fields);
    setPhase("improve");
  }

  switch (phase) {
    case "picker":
      return <EntryMethodPicker onSelect={handleSelect} />;
    case "quick":
      return (
        <VoiceQuickDescribe
          formSnapshot={formSnapshot}
          tagCatalogs={tagCatalogs}
          onApply={handleApply}
          onCancel={() => setPhase("picker")}
        />
      );
    case "guided":
      return (
        <VoiceGuidedQA
          formSnapshot={formSnapshot}
          tagCatalogs={tagCatalogs}
          onApply={handleApply}
          onCancel={() => setPhase("picker")}
        />
      );
    case "paste":
      return (
        <PasteListingText
          formSnapshot={formSnapshot}
          tagCatalogs={tagCatalogs}
          onApply={handleApply}
          onCancel={() => setPhase("picker")}
        />
      );
    case "improve":
      return (
        <ListingImprovementPanel
          formSnapshot={formSnapshot}
          hasPhotos={hasPhotos}
          currentName={currentName}
          currentDescription={currentDescription}
          onApplyTitle={onApplyTitle}
          onApplyDescription={onApplyDescription}
          onDone={() => setPhase("dismissed")}
        />
      );
    case "dismissed":
      return null;
  }
}
