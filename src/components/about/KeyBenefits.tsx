import React from 'react';
import { CheckCircle } from 'lucide-react';

const KeyBenefits = () => {
  const benefits = [
    "Centralized Access: 14,000+ contacts across 27 leading Canadian Private Wealth firms.",
    "Verified, Targeted Contacts: Reach key decision-makers with precise titles.",
    "Strategic Team Navigation: Efficient targeting via clear team names.",
    "In-Depth Team Research: Direct links to team websites.",
    "LinkedIn Integration: Direct access to 85%+ of Advisor LinkedIn profiles.",
    "Customizable Favorite Lists: Create and save favorite contact lists.",
    "Dynamic, Auto-Updating Reports: Generate and save reports.",
    "Consistent Accuracy & Time Savings: Regularly updated database with annual firm reviews.",
    "Reliable Email Addresses: All emails validated by a trusted third-party."
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="h-8 w-8 text-[#E5D3BC]" />
        <h2 className="text-2xl font-semibold text-gray-900">Key Benefits</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <CheckCircle className="h-5 w-5 text-[#E5D3BC] mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">{benefit}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyBenefits;