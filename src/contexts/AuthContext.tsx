import React, { createContext, useContext, useEffect, useState } from 'react';

// Simplified User interface
export interface User {
    id: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simple anonymous auth: generate a random ID if not exists
        let userId = localStorage.getItem('debate_partner_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('debate_partner_id', userId);
        }

        setUser({ id: userId });
        setLoading(false);
    }, []);

    const signOut = async () => {
        // For anonymous auth, maybe just clear the ID? 
        // Or do nothing as there is no real "sign out".
        // Let's clear to simulate reset.
        localStorage.removeItem('debate_partner_id');
        window.location.reload();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
