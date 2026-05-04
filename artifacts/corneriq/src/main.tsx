import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { axiosInstance } from "@workspace/api-client-react";
import App from "./App";

// Configure API base URL from env
axiosInstance.defaults.baseURL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
