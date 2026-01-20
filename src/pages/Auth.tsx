import { Button } from '@/components/ui/button';
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
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome to Debate Pal</CardTitle>
                    <CardDescription>
                        Your personal debate tracking assistant.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <p className="mb-4 text-sm text-gray-500">
                            Setting up your anonymous session...
                        </p>
                        <Button className="w-full" onClick={() => window.location.reload()}>
                            Click to Start
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
