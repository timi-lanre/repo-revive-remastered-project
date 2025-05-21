
import React from "react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  text: string;
  className?: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ 
  isLoading, 
  loadingText, 
  text, 
  className = "w-full bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]" 
}) => {
  return (
    <Button 
      type="submit" 
      className={className}
      disabled={isLoading}
    >
      {isLoading ? loadingText : text}
    </Button>
  );
};

export default SubmitButton;
