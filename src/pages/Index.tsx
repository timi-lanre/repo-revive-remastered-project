
import React from "react";
import { Link } from "react-router-dom";
import LandingHeader from "@/components/LandingHeader";
import FeatureCard from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Search, Users, CheckCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] w-full">
      {/* Hero Section */}
      <div
        className="w-full px-4 sm:px-8 md:px-12 py-12 flex flex-col box-border border-b border-black/5 shadow-sm"
        style={{ background: "linear-gradient(90deg, #E5D3BC 0%, #e9d9c6 100%)" }}
      >
        <LandingHeader />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
          <div className="mb-8 md:mb-0">
            <h1 className="font-bold text-[#111827] text-4xl sm:text-5xl md:text-5xl -tracking-tight leading-tight mb-4">
              Connect with Financial Advisors Across Canada
            </h1>
            <p className="text-[#374151] text-base sm:text-lg mb-8">
              Find, filter, and organize advisors from all major financial institutions. 
              Build your network and streamline your professional connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button
                  className="bg-[#E5D3BC] text-black rounded-xl px-8 py-6 font-semibold text-base shadow-sm
                    hover:bg-[#d6c3ac] hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  Get Started
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-black/10 text-[#1E293B] rounded-xl px-8 py-6 font-semibold text-base
                  hover:border-[#E5D3BC] hover:bg-[#E5D3BC]/5 hover:-translate-y-0.5 transition-all"
              >
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center items-center">
            <div className="rounded-xl overflow-hidden w-full shadow-md">
              <img
                src="https://images.unsplash.com/photo-1496307653780-42ee777d4833?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Modern office building representing financial institutions"
                className="w-full h-full object-cover aspect-video"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-bold text-2xl sm:text-3xl text-[#111827] mb-12">
            Powerful Tools for Financial Professionals
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Search}
              title="Advanced Search"
              description="Find advisors by name, firm, location, or specialty. Apply multiple filters to narrow your search."
            />
            
            <FeatureCard
              icon={Users}
              title="Favorites Lists"
              description="Create and manage custom lists of advisors. Organize contacts by project, specialty, or relationship."
            />
            
            <FeatureCard
              icon={CheckCircle}
              title="Detailed Reports"
              description="Generate custom reports of advisors across firms, branches, or teams. Save and export data."
            />
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div 
        className="py-16 relative overflow-hidden shadow-inner"
        style={{ background: "linear-gradient(90deg, #E5D3BC 0%, #e9d9c6 100%)" }}
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="font-bold text-2xl sm:text-3xl text-[#111827] mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-[#4B5563] mb-8 max-w-xl mx-auto">
            Access our comprehensive database of financial advisors and start building your professional network today.
          </p>
          <Link to="/login">
            <Button
              className="bg-white text-black rounded-xl px-8 py-6 font-semibold text-base shadow-sm
                hover:bg-[#f9fafb] hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <div className="py-8 bg-[#f8fafc] border-t border-black/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <p className="text-[#64748B] mt-2">
                Connecting financial professionals since 2025
              </p>
            </div>
            
            <div className="flex gap-8">
              <Link to="/about" className="text-[#64748B] cursor-pointer font-medium hover:text-black transition-colors">
                About
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-black/5 text-center">
            <p className="text-xs text-[#94a3b8]">
              © 2025 Advisor Connect. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
