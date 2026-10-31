import type { RouteObject } from "react-router-dom";

import ExamListPage from "../pages/ExamListPage";
import CreateExamPage from "../pages/CreateExamPage";
import EditExamPage from "../pages/EditExamPage";

export const examRoutes: RouteObject[] = [
  {
    index: true,
    element: <ExamListPage />,
  },
  {
    path: "create",
    element: <CreateExamPage />,
  },
  {
    path: ":examId/edit",
    element: <EditExamPage />,
  },
];
