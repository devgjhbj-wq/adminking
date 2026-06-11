import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-2xl font-semibold text-primary">404</span>
        </div>
        <p className="text-lg text-muted-foreground">Page not found</p>
        <a href="/" className="inline-flex items-center rounded-pill bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 active:scale-[0.96]">
          Return Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
