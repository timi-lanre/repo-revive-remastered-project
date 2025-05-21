
import React from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <Card className="rounded-2xl border border-black/5 overflow-hidden h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="p-6">
        <div className="w-14 h-14 rounded-full bg-[#E5D3BC]/30 flex items-center justify-center mb-3">
          <Icon className="text-[#d6c3ac] w-7 h-7" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </Card>
  );
};

export default FeatureCard;
