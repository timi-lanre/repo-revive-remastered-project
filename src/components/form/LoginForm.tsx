
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import PasswordInput from "./PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const navigate = useNavigate();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log("Login data:", data);
    
    // This is where you would integrate with AWS Cognito
    // For example: Auth.signIn(data.email, data.password)
    //   .then(user => {
    //     if (user.challengeName === 'CUSTOM_CHALLENGE') {
    //       toast({
    //         title: "Account Pending Approval",
    //         description: "Your account is still pending admin approval.",
    //       });
    //     } else {
    //       toast({
    //         title: "Login Successful",
    //         description: "Redirecting to dashboard...",
    //       });
    //       setTimeout(() => { navigate("/dashboard"); }, 1500);
    //     }
    //   })
    //   .catch(err => {
    //     if (err.code === 'UserNotConfirmedException') {
    //       toast({
    //         title: "Account Pending Approval",
    //         description: "Your account is still pending admin approval.",
    //       });
    //     } else {
    //       toast({
    //         title: "Login Failed",
    //         description: err.message,
    //         variant: "destructive"
    //       });
    //     }
    //   });
    
    // Until AWS Cognito integration is complete, just simulate success
    toast({
      title: "Login Successful",
      description: "Redirecting to dashboard...",
    });
    
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            If your account is pending approval, you won't be able to log in until an administrator approves your registration.
          </AlertDescription>
        </Alert>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="you@example.com" 
                  type="email" 
                  {...field} 
                  className="focus:border-[#E5D3BC] focus:ring-[#E5D3BC]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <PasswordInput
              field={field}
              label="Password"
              showForgotPassword={true}
            />
          )}
        />
        
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  Remember me
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]">
          Sign in
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
