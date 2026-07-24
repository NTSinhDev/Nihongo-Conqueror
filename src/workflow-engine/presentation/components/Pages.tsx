import React, { useMemo } from "react";
import { createLessonBuilderService } from "../../infrastructure/compositionRoot";
import { LessonBuilderStore } from "../lessonBuilderStore";
import { LessonBuilderProvider } from "../lessonBuilderContext";
import { Layout } from "./Layout";

interface PagesProps {
  onClose?: () => void;
}

export function LessonBuilderDashboard({ onClose }: PagesProps) {
  // Stabilize the service and store instances across dashboard re-renders
  const store = useMemo(() => {
    const service = createLessonBuilderService();
    return new LessonBuilderStore(service);
  }, []);

  return (
    <LessonBuilderProvider store={store}>
      <div className="w-full h-full min-h-[600px] bg-stone-100 flex flex-col rounded-2xl border border-stone-200 overflow-hidden">
        <Layout onClose={onClose} />
      </div>
    </LessonBuilderProvider>
  );
}
