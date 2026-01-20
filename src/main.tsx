import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConvexClientProvider } from "./components/ConvexClientProvider";

createRoot(document.getElementById("root")!).render(
    <ConvexClientProvider>
        <App />
    </ConvexClientProvider>
);
