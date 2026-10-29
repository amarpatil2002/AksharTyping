import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import AppProviders from "./app/providers/AppProviders";
import { router } from "./app/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />

      <Toaster position="top-right" richColors closeButton duration={3500} />
    </AppProviders>
  </StrictMode>,
);
