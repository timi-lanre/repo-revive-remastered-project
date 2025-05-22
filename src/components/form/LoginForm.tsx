import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { authService } from "@/services/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormErrorAlert from "./FormErrorAlert";
import { checkSupabaseConnection } from "@/lib/supabase";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Check connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        setError("Unable to connect to the authentication service. Please check your internet connection.");
      }
    };
    checkConnection();
  }, []);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Check connection before attempting login
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error("Unable to connect to the authentication service. Please check your internet connection.");
      }

      const result = await authService.loginWithEmailPassword(email, password);
      
      if (result.success) {
        try {
          const isAdmin = await authService.isAdmin();
          window.location.href = isAdmin ? "/admin" : "/dashboard";
        } catch (roleError: any) {
          console.error("Error checking admin status:", roleError);
          setError(roleError.message || "Failed to verify user role. Please try again or contact support.");
          setIsLoading(false);
        }
      } else {
        setError("Invalid credentials. Please check your email and password.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "An unexpected error occurred. Please try again later.";
      
      if (error.message.includes('Network error') || error.message.includes('Failed to fetch') || error instanceof TypeError) {
        errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error.message.includes('Invalid credentials')) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes('Too many requests')) {
        errorMessage = "Too many login attempts. Please try again later.";
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleLogin} className="space-y-4">
        <FormErrorAlert error={error} />
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="•••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <Button 
          type="submit"
          className="w-full bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;