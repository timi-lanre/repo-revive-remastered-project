
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
        // Redirect to admin page
        window.location.href = "/admin";
      } else {
        setError("Invalid credentials. Please check your email and password.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to login");
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 mb-4">
          Sign in with your admin credentials
        </p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <FormErrorAlert error={error} />
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="text"
            placeholder="admin@example.com"
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
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Default admin: admin@example.com / adminpassword
          </p>
          <p className="text-xs text-gray-500">
            Alternative: admin / admin123
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
