import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Info, Search, ChevronUp, Heart, Mail, Globe, Linkedin, AlertTriangle, X, ChevronDown } from "lucide-react";
import { authService } from "@/services/auth";
import { supabase } from "@/lib/supabase";
import debounce from "@/lib/debounce";

// ... (previous interfaces and type definitions remain the same)

const Dashboard = () => {
  // ... (previous state and functions remain the same until the Dialog component)

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ... (previous JSX remains the same until the Dialog) */}

      {/* Advisor Info Dialog */}
      <Dialog open={showAdvisorDialog} onOpenChange={setShowAdvisorDialog}>
        <DialogContent className="max-w-2xl bg-[#E5D3BC]/5">
          <DialogHeader className="bg-[#E5D3BC]/20 p-4 rounded-t-lg">
            <DialogTitle className="text-xl font-semibold">
              Advisor Information
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] overflow-auto pr-4">
            {selectedAdvisor && (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Name</h3>
                    <p className="text-lg">{`${selectedAdvisor.firstName} ${selectedAdvisor.lastName}`}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Title</h3>
                    <p className="text-lg">{selectedAdvisor.title}</p>
                  </div>
                </div>
                
                <Separator className="bg-[#E5D3BC]/20" />
                
                <div>
                  <h3 className="font-medium text-gray-500">Team</h3>
                  <p className="text-lg">{selectedAdvisor.teamName}</p>
                </div>
                
                <Separator className="bg-[#E5D3BC]/20" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Firm</h3>
                    <p className="text-lg">{selectedAdvisor.firm}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Branch</h3>
                    <p className="text-lg">{selectedAdvisor.branch}</p>
                  </div>
                </div>
                
                <Separator className="bg-[#E5D3BC]/20" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">City</h3>
                    <p className="text-lg">{selectedAdvisor.city}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-500">Province</h3>
                    <p className="text-lg">{selectedAdvisor.province}</p>
                  </div>
                </div>
                
                <Separator className="bg-[#E5D3BC]/20" />
                
                <div>
                  <h3 className="font-medium text-gray-500">Contact Information</h3>
                  <div className="mt-2 space-y-2">
                    {selectedAdvisor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#E5D3BC]" />
                        <a 
                          href={`mailto:${selectedAdvisor.email}`}
                          className="text-[#E5D3BC] hover:underline"
                        >
                          {selectedAdvisor.email}
                        </a>
                      </div>
                    )}
                    {selectedAdvisor.websiteUrl && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#E5D3BC]" />
                        <a 
                          href={selectedAdvisor.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E5D3BC] hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    {selectedAdvisor.linkedinUrl && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-[#E5D3BC]" />
                        <a 
                          href={selectedAdvisor.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E5D3BC] hover:underline"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;