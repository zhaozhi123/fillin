import React from "react";
import ReactDOM from "react-dom/client";
import { installChromeMock } from "../dev/chromeMock";
import App from "./App";
import { getUiLocale } from "./i18n";
import "./styles.css";

installChromeMock();
document.documentElement.lang = getUiLocale();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
