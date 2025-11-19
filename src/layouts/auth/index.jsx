import { Routes, Route, Navigate } from "react-router-dom";
import routes from "routes.js";
import DarkVeil from "components/backgrounds/DarkVeil";

export default function Auth() {
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/auth") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };

  document.documentElement.dir = "ltr";

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* DarkVeil Background Animation for all auth pages */}
      <div className="fixed inset-0 z-0">
        <DarkVeil
          speed={0.5}
          hueShift={230}
          noiseIntensity={0}
          scanlineIntensity={0}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      {/* Content with relative z-index */}
      <div className="relative z-10 min-h-screen w-full">
        <Routes>
          {getRoutes(routes)}
          <Route path="/" element={<Navigate to="/auth/sign-in" replace />} />
        </Routes>
      </div>
    </div>
  );
}
