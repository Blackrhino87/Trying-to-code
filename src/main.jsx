import React from "react";
import { createRoot } from "react-dom/client";

/* Self-hosted so the app still renders correctly with no signal — the
   artifact version fetched these from Google Fonts at runtime. Latin subset
   only: it halves what the phone has to cache on first open. */
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

import "./styles.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
