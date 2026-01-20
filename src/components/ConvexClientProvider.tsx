import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
// Default to empty string to avoid crash, user will need to set this
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    if (!PUBLISHABLE_KEY) {
        // Fallback UI or simple console warning if key is missing during dev setup
        console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY env var");
    }

    return (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
