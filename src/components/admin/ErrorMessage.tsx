
import React from "react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      <p className="font-medium">Error loading users: {message}</p>
      <p className="text-sm mt-1">
        {message.includes('expired') ? 
          'Your session has expired. Please try logging in again.' :
          'Try using the refresh button or reload the page.'
        }
      </p>
    </div>
  );
};

export default ErrorMessage;
