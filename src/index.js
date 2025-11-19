import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

import App from "./App";
import { ToastProvider } from "components/common/ToastProvider";
import { AuthProvider } from "contexts/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ToastProvider>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ToastProvider>
);
