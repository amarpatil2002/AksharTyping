import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../modules/dashboard/components/Sidebar";

export default function AppLayout() {
  const location = useLocation();

  // Detect the active typing test, whether the URL uses
  // /typing-exam or /typing-exams.
  const isTypingExamRunning =
    /\/typing-exams?\/.*\/passages\/.*\/start\/?$/i.test(location.pathname);

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {!isTypingExamRunning && <Sidebar />}

      <main
        className={
          isTypingExamRunning
            ? "min-h-screen w-full"
            : "min-h-screen w-full pt-16 lg:ml-72 lg:w-[calc(100%-18rem)] lg:pt-0"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
