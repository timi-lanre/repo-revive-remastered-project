import React from 'react';
import { Box, Typography } from '@/components/ui/box';
import { Info } from 'lucide-react';

const Overview = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Info className="h-8 w-8 text-[#E5D3BC]" />
        <h2 className="text-2xl font-semibold text-gray-900">Overview</h2>
      </div>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 leading-relaxed">
          Advisor Connect is a revolutionary, all-in-one platform that transforms how professionals
          identify and connect with Wealth Advisors across Canada's Private Wealth Management industry.
          This unique database delivers unparalleled access to over 14,000 meticulously curated contacts
          from 27 leading firms—both bank-owned and independent firms.
        </p>
        
        <p className="text-gray-700 leading-relaxed mt-4">
          Built by a seasoned industry veteran, Advisor Connect was designed with a deep understanding
          of the power of a robust CRM. More than just a contact list, it provides accurate, streamlined
          access to key decision-makers—all within a single, powerful platform. The result? Enhanced
          opportunity identification, stronger business relationships, and seamless client servicing.
        </p>
        
        <p className="text-gray-700 leading-relaxed mt-4">
          Covering over 95% of the Canadian Private Wealth market, Advisor Connect is the most comprehensive
          and accurate database resource available in Canada. Whether you're building strategic partnerships,
          expanding your client base, optimizing social media campaigns, or conducting in-depth market research,
          Advisor Connect delivers the data, time savings, and competitive edge you need to succeed.
        </p>
      </div>
    </div>
  );
};

export default Overview;