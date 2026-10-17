import { RouterProvider } from "react-router-dom";
import router from "./router";
import { PassageProvider } from "./features/passages/PassageContext";
import { ExamProvider } from "./features/exams/ExamContext";

export default function App() {
  return (
    <PassageProvider>
      <ExamProvider>
        <RouterProvider router={router} />
      </ExamProvider>
    </PassageProvider>
  );
}
