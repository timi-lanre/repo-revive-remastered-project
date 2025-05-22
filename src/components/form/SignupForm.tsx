
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SignupForm = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Registration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Registration Unavailable</AlertTitle>
          <AlertDescription>
            Self-registration is currently disabled. Please contact your administrator to create an account.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            If you already have an account, you can sign in below.
          </p>
          <Button asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
