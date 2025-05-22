import React from 'react';
import { Building2 } from 'lucide-react';

const IncludedFirms = () => {
  const firms = [
    "Acumen Capital Partners",
    "Aligned Capital Partners",
    "Assante Wealth Management",
    "Bellwether Investment Management",
    "BMO Nesbitt Burns",
    "CG Wealth Management",
    "CIBC Wood Gundy",
    "Desjardins Securities",
    "Edward Jones",
    "Harbour Front Wealth Management",
    "Hayward Capital Markets",
    "IA Private Wealth",
    "IG Securities",
    "IG Private Wealth",
    "Leede Financial",
    "Mandeville Private Client",
    "Manulife Wealth",
    "National Bank Financial",
    "Odlum Brown",
    "Q Wealth",
    "Raymond James Wealth Management",
    "RBC Dominion Securities",
    "Research Capital Corporate",
    "Richardson Wealth",
    "ScotiaMcLeod",
    "TD",
    "Ventum Financial",
    "Wellington-Altus Financial"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="h-8 w-8 text-[#E5D3BC]" />
        <h2 className="text-2xl font-semibold text-gray-900">Included Firms</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {firms.map((firm, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center hover:bg-gray-100 transition-all hover:-translate-y-0.5"
          >
            <span className="text-gray-700">{firm}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncludedFirms;