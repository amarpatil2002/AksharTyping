import type { RouteObject } from "react-router-dom";

import TypingExamListPage from "../pages/TypingExamListPage";
import TypingExamDetailPage from "../pages/TypingExamDetailPage";
import TypingTestPage from "../pages/TypingTestPage";
import TypingExamSetupPage from "../pages/TypingExamSetupPage";
// import TypingAttemptHistoryPage from "../pages/TypingAttemptHistoryPage";
import TypingResultPage from "../pages/TypingResultPage";

export const typingRoutes: RouteObject[] = [
  // Published examination list
  {
    index: true,
    element: <TypingExamListPage />,
  },

  // Examination details
  {
    path: ":examId",
    element: <TypingExamDetailPage />,
  },

  {
    path: ":examId/passages/:passageId/setup",
    element: <TypingExamSetupPage />,
  },
  {
    path: ":examId/passages/:passageId/start",
    element: <TypingTestPage />,
  },

  //   // User attempt history
  //   {
  //     path: "attempts/history",
  //     element: <TypingAttemptHistoryPage />,
  //   },

  //   // Examination result
  {
    path: "attempts/:attemptId/result",
    element: <TypingResultPage />,
  },
];
