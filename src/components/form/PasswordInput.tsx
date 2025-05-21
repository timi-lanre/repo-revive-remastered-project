
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

interface PasswordInputProps {
  field: any;
  label: string;
  placeholder?: string;
  showForgotPassword?: boolean;
}

const PasswordInput = ({
  field, 
  label, 
  placeholder = "••••••••", 
  showForgotPassword = false
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <FormItem>
      <div className="flex items-center justify-between">
        <FormLabel>{label}</FormLabel>
        {showForgotPassword && (
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </Link>
        )}
      </div>
      <FormControl>
        <div className="relative">
          <Input 
            type={showPassword ? "text" : "password"} 
            placeholder={placeholder} 
            {...field} 
            className="pr-10 focus:border-[#E5D3BC] focus:ring-[#E5D3BC]"
          />
          <button 
            type="button" 
            className="absolute right-3 top-2.5 text-gray-500"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default PasswordInput;
