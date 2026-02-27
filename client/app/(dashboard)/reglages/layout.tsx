import type { ReactNode } from "react";
import { ReglagesNav } from "@/components/navigation/ReglagesNav";

export default function ReglagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <ReglagesNav />
      {children}
    </div>
  );
}
