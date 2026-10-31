import type { RouteObject } from "react-router-dom";

import ExamPassagesPage from "../pages/ExamPassagesPage";
import CreatePassagePage from "../pages/CreatePassagePage";
import EditPassagePage from "../pages/EditPassagePage";

export const passageRoutes: RouteObject[] = [
  {
    path: ":examId/passages",
    element: <ExamPassagesPage />,
  },
  {
    path: ":examId/passages/create",
    element: <CreatePassagePage />,
  },
  {
    path: ":examId/passages/:passageId/edit",
    element: <EditPassagePage />,
  },
];
