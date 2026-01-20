import { SignIn } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function AuthPage() {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md border-0 bg-transparent shadow-none">
                <div className="flex justify-center">
                    <SignIn />
                </div>
            </Card>
        </div>
    );
}
