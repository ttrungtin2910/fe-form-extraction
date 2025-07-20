import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

import App from "./App";
import { ToastProvider } from "components/common/ToastProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ToastProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ToastProvider>
);
