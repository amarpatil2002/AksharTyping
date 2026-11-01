import type { RouteObject } from "react-router-dom";

import { examRoutes } from "../exam/routes/exam.routes";
import { passageRoutes } from "./routes/passage.routes";

export const typingExamRoutes: RouteObject[] = [
  ...examRoutes,
  ...passageRoutes,
];
