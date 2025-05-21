import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/form/LoginForm";
import SignupForm from "@/components/form/SignupForm";
import { motion } from "framer-motion";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#E5D3BC]/20 to-white/90 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-black/5 backdrop-blur-sm bg-white/80">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Link to="/">
                  <img
                    src="/lovable-uploads/8af3a359-89c1-4bf8-a9ea-f2255c283985.png"
                    alt="Advisor Connect"
                    width={200}
                    height={80}
                    className="object-contain transition-opacity hover:opacity-90"
                  />
                </Link>
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#1a1a1a] to-[#4a4a4a]">
              Welcome to Advisor Connect
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Sign in to access your dashboard or create a new account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/5">
                <TabsTrigger 
                  value="login"
                  className="data-[state=active]:bg-[#E5D3BC] data-[state=active]:text-black"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-[#E5D3BC] data-[state=active]:text-black"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginForm />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="signup">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SignupForm />
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 opacity-80">
            <div className="text-sm text-center text-gray-500">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-center text-sm text-gray-500"
      >
        Need help? <a href="mailto:support@advisorconnect.com" className="text-blue-600 hover:underline">Contact Support</a>
      </motion.div>
    </div>
  );
};

export default Login;