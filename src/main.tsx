import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";  // Tailwind base styles first
import "./App.css";    // Your custom styles second
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
