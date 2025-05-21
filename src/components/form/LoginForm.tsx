
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { authService } from "@/services/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormErrorAlert from "./FormErrorAlert";

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  
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

  const handleDirectAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsLoading(true);
      
      // Check if credentials match admin user
      if (username === "admin" && password === "admin123") {
        // Store fake admin token and user info
        const adminUserInfo = {
          sub: "admin-user-id",
          email: "admin@example.com",
          name: "Admin User",
          "cognito:groups": ["Admin"]
        };
        
        localStorage.setItem("id_token", "fake-admin-id-token");
        localStorage.setItem("access_token", "fake-admin-access-token");
        localStorage.setItem("user_info", JSON.stringify(adminUserInfo));
        
        toast({
          title: "Login Successful",
          description: "You've been logged in as an admin."
        });
        
        // Redirect to admin page
        window.location.href = "/admin";
      } else {
        setError("Invalid admin credentials. Use admin/admin123");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      setError(error.message || "Failed to login as admin");
      setIsLoading(false);
    }
  };
  
  const handleRegisteredAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsLoading(true);
      
      // Login with registered admin credentials
      const result = await authService.loginWithEmailPassword(email, adminPassword);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "You've been logged in with your registered admin credentials."
        });
        
        // Redirect to admin page
        window.location.href = "/admin";
      } else {
        setError("Invalid credentials. Please check your email and password.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      setError(error.message || "Failed to login with registered credentials");
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="registered" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="registered">Registered Admin</TabsTrigger>
          <TabsTrigger value="direct">Direct Admin</TabsTrigger>
          <TabsTrigger value="cognito">Cognito Login</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registered">
          <form onSubmit={handleRegisteredAdminLogin} className="space-y-4">
            <FormErrorAlert error={error} />
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="•••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login with Admin Credentials"}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="direct">
          <form onSubmit={handleDirectAdminLogin} className="space-y-4">
            <FormErrorAlert error={error} />
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              {isLoading ? "Logging in..." : "Login as Admin"}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Use username: admin, password: admin123
              </p>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="cognito">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoginForm;
