import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BackButton } from "@/components/BackButton";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-muted p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <BackButton to="/" />
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold">404</h1>
            <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
            <a href="/" className="text-primary underline hover:text-primary/90">
              Return to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
