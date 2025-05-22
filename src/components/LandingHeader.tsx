import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LandingHeader = () => {
  return (
    <div className="flex justify-between items-center w-full mb-8 flex-col sm:flex-row">
      <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto mb-2 sm:mb-0">
        <Link to="/" className="transition-transform duration-200 hover:scale-102 cursor-pointer">
          <img
            src="/lovable-uploads/8af3a359-89c1-4bf8-a9ea-f2255c283985.png"
            alt="Advisor Connect"
            width={268}
            height={100}
            className="object-contain"
          />
        </Link>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
        <Button
          variant="ghost"
          className="relative text-[#1E293B] font-semibold text-base px-3 py-1 rounded-lg border border-transparent
            hover:bg-white/20 hover:border-black/10 hover:text-black hover:-translate-y-0.5 transition-all duration-300
            after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-black
            after:transition-all after:duration-300 hover:after:w-4/5 hover:after:left-[10%]"
          asChild
        >
          <Link to="/about">About</Link>
        </Button>
        <Link to="/login">
          <Button
            variant="ghost"
            className="relative text-[#1E293B] font-semibold text-base px-3 py-1 rounded-lg border border-transparent
              hover:bg-white/20 hover:border-black/10 hover:text-black hover:-translate-y-0.5 transition-all duration-300
              after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-0.5 after:bg-black
              after:transition-all after:duration-300 hover:after:w-4/5 hover:after:left-[10%]"
          >
            Login
          </Button>
        </Link>
      </div>
    </div>
  );
};