import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="w-full px-4 sm:px-8 md:px-12 py-6 bg-gradient-to-r from-[#E5D3BC] to-[#e9d9c6] border-b border-black/5 shadow-sm">
        <div className="flex justify-between items-center w-full mb-8">
          <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto">
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
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="relative text-[#1E293B] font-semibold text-base px-3 py-1 rounded-lg border border-transparent
                hover:bg-white/20 hover:border-black/10 hover:text-black hover:-translate-y-0.5 transition-all duration-300"
              asChild
            >
              <Link to="/">Home</Link>
            </Button>
            <Button
              variant="ghost"
              className="relative text-[#1E293B] font-semibold text-base px-3 py-1 rounded-lg border border-black/10
                bg-white/20 text-black after:content-[''] after:absolute after:bottom-0 after:left-[10%] after:w-4/5 after:h-0.5 after:bg-black"
            >
              About
            </Button>
            <Button
              variant="ghost"
              className="relative text-[#1E293B] font-semibold text-base px-3 py-1 rounded-lg border border-transparent
                hover:bg-white/20 hover:border-black/10 hover:text-black hover:-translate-y-0.5 transition-all duration-300"
              asChild
            >
              <Link to="/login">Account</Link>
            </Button>
          </div>
        </div>

        {/* Page Title Section */}
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold text-[#111827] mb-4">About Advisor Connect</h1>
          <p className="text-[#374151] text-lg border-l-4 border-[#E5D3BC] pl-4 py-2 bg-white/10 rounded-r-lg">
            Your comprehensive platform for connecting with wealth advisors across Canada
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} to="/about">About</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbItem>
            <BreadcrumbItem>
              <span className="text-muted-foreground">Overview</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 data-[state=active]:border-[#E5D3BC] rounded-none"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="benefits"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 data-[state=active]:border-[#E5D3BC] rounded-none"
              >
                Key Benefits
              </TabsTrigger>
              <TabsTrigger 
                value="sources"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 data-[state=active]:border-[#E5D3BC] rounded-none"
              >
                Contact Sources
              </TabsTrigger>
              <TabsTrigger 
                value="firms"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 data-[state=active]:border-[#E5D3BC] rounded-none"
              >
                Firms Included
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  Advisor Connect is a revolutionary, all-in-one platform that transforms how professionals identify and connect with Wealth Advisors across Canada's Private Wealth Management industry. This unique database delivers unparalleled access to over 14,000 meticulously curated contacts from 27 leading firms—both bank-owned and independent firms.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Built by a seasoned industry veteran, Advisor Connect was designed with a deep understanding of the power of a robust CRM. More than just a contact list, it provides accurate, streamlined access to key decision-makers—all within a single, powerful platform. The result? Enhanced opportunity identification, stronger business relationships, and seamless client servicing.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Covering over 95% of the Canadian Private Wealth market, Advisor Connect is the most comprehensive and accurate database resource available in Canada. Whether you're building strategic partnerships, expanding your client base, optimizing social media campaigns, or conducting in-depth market research, Advisor Connect delivers the data, time savings, and competitive edge you need to succeed.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="benefits">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Coming Soon</h3>
                <p className="text-gray-700">Key benefits information will be available shortly.</p>
              </div>
            </TabsContent>

            <TabsContent value="sources">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Coming Soon</h3>
                <p className="text-gray-700">Contact sources information will be available shortly.</p>
              </div>
            </TabsContent>

            <TabsContent value="firms">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Coming Soon</h3>
                <p className="text-gray-700">Firms included information will be available shortly.</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pt-8 border-t">
          Advisor Connect | Confidential
        </div>
      </div>
    </div>
  );
};

export default About;