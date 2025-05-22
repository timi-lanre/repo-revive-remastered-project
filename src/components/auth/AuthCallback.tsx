import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session) {
          throw new Error("No session found");
        }

        // Get user profile to check role and status
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, status')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        if (!profile) {
          throw new Error("User profile not found");
        }

        if (profile.status !== 'APPROVED') {
          throw new Error("Your account is pending approval");
        }

        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
        });

        // Redirect based on user role
        navigate(profile.role === 'admin' ? "/admin" : "/dashboard", { replace: true });
      } catch (error: any) {
        console.error("Auth callback error:", error);
        
        let errorMessage = "Authentication failed. Please try again.";
        if (error.message.includes('pending approval')) {
          errorMessage = "Your account is pending approval. Please wait for admin confirmation.";
        }
        
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive"
        });
        
        // Clear any existing session
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;