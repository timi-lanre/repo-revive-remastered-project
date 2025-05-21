
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FormErrorAlertProps {
  error: string | null;
}

const FormErrorAlert: React.FC<FormErrorAlertProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <Alert className="bg-red-50 border-red-200">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">{error}</AlertDescription>
    </Alert>
  );
};

export default FormErrorAlert;
