import { useUser, useClerk } from "@clerk/clerk-react";

// Adapter to match the previous AuthContext interface
export const useAuth = () => {
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();

    return {
        user: user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress } : null,
        loading: !isLoaded,
        signOut
    };
};

// No-op provider as ClerkProvider handles state now
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
