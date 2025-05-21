
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { authService } from "@/services/authService";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await authService.initiateLogin();
      // The user will be redirected to Cognito login page, so we don't need to do anything else here
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to start login process.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 mb-4">
          Click the button below to sign in with your credentials.
        </p>
      </div>
      
      <Button 
        onClick={handleLogin}
        className="w-full bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]"
        disabled={isLoading}
      >
        {isLoading ? "Redirecting to login..." : "Sign in with Cognito"}
      </Button>
    </div>
  );
};

export default LoginForm;
