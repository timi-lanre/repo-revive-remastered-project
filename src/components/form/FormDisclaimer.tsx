
import React from "react";

interface FormDisclaimerProps {
  text: string;
}

const FormDisclaimer: React.FC<FormDisclaimerProps> = ({ text }) => {
  return (
    <div className="text-sm text-center text-gray-500">
      {text}
    </div>
  );
};

export default FormDisclaimer;
