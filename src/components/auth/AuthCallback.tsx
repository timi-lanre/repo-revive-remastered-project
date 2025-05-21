
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { toast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Get token from URL if present (for OAuth flow)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        // If there's a code parameter, we're in an OAuth flow
        if (code) {
          // Exchange code for token - implement this in your auth service if needed
          // await authService.exchangeCodeForToken(code);
        }
        
        // Check if the user is authenticated
        const isAuthenticated = await authService.isAuthenticated();
        
        if (isAuthenticated) {
          // Check if user is admin to redirect appropriately
          const isAdmin = await authService.isAdmin();
          
          toast({
            title: "Login Successful",
            description: "You have been successfully logged in.",
          });
          
          // Redirect based on user role
          navigate(isAdmin ? "/admin" : "/dashboard");
        } else {
          throw new Error("Authentication failed");
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        toast({
          title: "Authentication Failed",
          description: error.message || "Failed to complete authentication.",
          variant: "destructive"
        });
        navigate("/login");
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Completing Authentication</h2>
        <p className="text-gray-500">Please wait while we log you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
