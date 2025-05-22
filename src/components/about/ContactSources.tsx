import React from 'react';
import { Database, Globe, Users, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ContactSources = () => {
  const sources = [
    {
      title: "Official Websites",
      icon: Globe,
      items: ["Company Corporate Websites", "Advisor Websites"]
    },
    {
      title: "Professional Networking",
      icon: Users,
      items: ["LinkedIn Corporate Profiles", "LinkedIn Advisor Profiles"]
    },
    {
      title: "Regulatory Bodies & Associations",
      icon: Database,
      items: ["CIRO", "CSA", "CAASA", "PMAC"]
    },
    {
      title: "Industry Publications & News",
      icon: BookOpen,
      items: [
        "Advisor.ca",
        "Investment Executive",
        "Canadian Family Offices",
        "Investissement & Finance",
        "Various Newspaper Feeds"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-8 w-8 text-[#E5D3BC]" />
        <h2 className="text-2xl font-semibold text-gray-900">Contact Sources</h2>
      </div>

      <p className="text-gray-700 mb-6">
        Our database is built from rigorously verified sources:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map((source, index) => {
          const Icon = source.icon;
          return (
            <Card key={index} className="p-6 bg-gray-50 border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="h-6 w-6 text-[#E5D3BC]" />
                <h3 className="text-lg font-semibold text-gray-900">{source.title}</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                {source.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E5D3BC] rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ContactSources;