import { RouterProvider } from "react-router-dom";
import router from "./router";
import { PassageProvider } from "./features/passages/PassageContext";

export default function App() {
  return (
    <PassageProvider>
      <RouterProvider router={router} />
    </PassageProvider>
  );
}
