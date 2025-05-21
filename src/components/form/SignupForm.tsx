
import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { authService } from "@/services/auth";
import SignupFormFields, { SignupFormValues } from "./SignupFormFields";
import FormErrorAlert from "./FormErrorAlert";
import SubmitButton from "./SubmitButton";
import FormDisclaimer from "./FormDisclaimer";
import { supabase } from "@/lib/supabase";

const signupSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const SignupForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setSignupError(null);
    
    try {
      // First check if the email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', data.email)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking existing user:", checkError);
      }
      
      // Also check in auth.users through our function to be thorough
      const { data: { users }, error: authCheckError } = await supabase.auth.admin.listUsers({
        filter: `email eq ${data.email}`,
      });
      
      if (authCheckError) {
        console.error("Error checking auth users:", authCheckError);
      }
      
      if (existingUser || (users && users.length > 0)) {
        throw new Error("User already registered");
      }
      
      // Proceed with signup if email doesn't exist
      await authService.signUp(data.email, data.password, data.firstName, data.lastName);
      
      toast({
        title: "Account Request Submitted",
        description: "Your account has been created and is pending admin approval.",
      });
      
      // Reset the form after successful signup
      form.reset();
      
    } catch (error: any) {
      const errorMessage = error.message === "User already registered" 
        ? "An account with this email already exists. Please try logging in instead."
        : error.message || "There was an error creating your account. Please try again.";
      
      setSignupError(errorMessage);
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormErrorAlert error={signupError} />
        
        <SignupFormFields form={form} isLoading={isLoading} />
        
        <SubmitButton 
          isLoading={isLoading} 
          loadingText="Creating Account..." 
          text="Create Account" 
        />

        <FormDisclaimer text="After signing up, your account will be reviewed by an administrator before activation." />
      </form>
    </Form>
  );
};

export default SignupForm;
