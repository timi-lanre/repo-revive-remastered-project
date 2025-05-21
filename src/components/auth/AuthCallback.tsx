
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
        
        // Process the callback with the current URL
        await authService.handleCallback(window.location.href);
        
        // Check if user is admin to redirect appropriately
        const isAdmin = await authService.isAdmin();
        
        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
        });
        
        // Redirect based on user role
        navigate(isAdmin ? "/admin" : "/dashboard");
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
