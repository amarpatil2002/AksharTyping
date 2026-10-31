import type { RouteObject } from "react-router-dom";

import TypingExamListPage from "../pages/TypingExamListPage";
import TypingExamDetailPage from "../pages/TypingExamDetailPage";
// import TypingPassagesPage from "../pages/TypingPassagesPage";
// import TypingTestPage from "../pages/TypingTestPage";
// import TypingAttemptHistoryPage from "../pages/TypingAttemptHistoryPage";
// import TypingResultPage from "../pages/TypingResultPage";

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

  // Examination passages
  //   {
  //     path: ":examId/passages",
  //     element: <TypingPassagesPage />,
  //   },

  //   // Start and complete typing examination
  //   {
  //     path: ":examId/passages/:passageId/start",
  //     element: <TypingTestPage />,
  //   },

  //   // User attempt history
  //   {
  //     path: "attempts/history",
  //     element: <TypingAttemptHistoryPage />,
  //   },

  //   // Examination result
  //   {
  //     path: "attempts/:attemptId/result",
  //     element: <TypingResultPage />,
  //   },
];
