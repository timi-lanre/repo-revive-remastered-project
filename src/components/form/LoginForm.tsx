import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { authService } from "@/services/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormErrorAlert from "./FormErrorAlert";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsLoading(true);
      
      const result = await authService.loginWithEmailPassword(email, password);
      
      if (result.success) {
        try {
          const isAdmin = await authService.isAdmin();
          window.location.href = isAdmin ? "/admin" : "/dashboard";
        } catch (roleError: any) {
          console.error("Error checking admin status:", roleError);
          if (roleError.message.includes('Network error')) {
            setError("Unable to verify user role due to network issues. Please check your connection and try again.");
          } else if (roleError.message.includes('No user found')) {
            setError("User profile not found. Please contact support.");
          } else {
            setError("Failed to verify user role. Please try again or contact support.");
          }
          setIsLoading(false);
          return;
        }
      } else {
        setError("Invalid credentials. Please check your email and password.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message.includes('Network error')) {
        setError("Unable to connect to the server. Please check your internet connection.");
      } else {
        setError(error.message || "Failed to login. Please try again later.");
      }
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
            type="text"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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