import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./theme";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./index.css";

// A page left open across an update asks for files the update replaced. Reload
// once to pick up the new build; the guard stops a loop if the file is really gone.
window.addEventListener("vite:preloadError", (e) => {
  try {
    const last = Number(sessionStorage.getItem("bl-reloaded") || 0);
    if (Date.now() - last < 30000) return;
    sessionStorage.setItem("bl-reloaded", String(Date.now()));
  } catch { /* no storage: reload anyway */ }
  e.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgb(var(--surface))",
                color: "rgb(var(--text))",
                border: "1px solid rgb(var(--border))",
                borderRadius: "12px",
                fontSize: "13px",
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
