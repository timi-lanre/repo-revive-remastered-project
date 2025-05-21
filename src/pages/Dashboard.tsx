
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Search, CheckCircle } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/placeholder.svg" // Replace with your actual logo
              alt="Advisor Connect"
              width={150}
              height={60}
              className="object-contain"
            />
            <nav className="ml-8 hidden md:flex">
              <Button variant="ghost">Home</Button>
              <Button variant="ghost">Advisors</Button>
              <Button variant="ghost">Favorites</Button>
              <Button variant="ghost">Reports</Button>
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">Settings</Button>
            <Button>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Advisors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,228</div>
              <p className="text-xs text-muted-foreground">+12 from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">36</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+4 from last week</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <div className="flex-1">Added 3 advisors to favorites list "Toronto Specialists"</div>
                  <div className="text-sm text-gray-500">Today</div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  <div className="flex-1">Generated "Quebec Region Q2" report</div>
                  <div className="text-sm text-gray-500">Yesterday</div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                  <div className="flex-1">Updated search filters for "Retirement Specialists"</div>
                  <div className="text-sm text-gray-500">2 days ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-auto py-6 flex flex-col items-center justify-center bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]">
              <Search className="mb-2 h-5 w-5" />
              <span>Search Advisors</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center">
              <Users className="mb-2 h-5 w-5" />
              <span>Manage Favorites</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center">
              <CheckCircle className="mb-2 h-5 w-5" />
              <span>Create Report</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center">
              <CheckCircle className="mb-2 h-5 w-5" />
              <span>Export Data</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
