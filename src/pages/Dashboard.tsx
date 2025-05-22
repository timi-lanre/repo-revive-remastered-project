import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Bell, Info } from "lucide-react";
import { authService } from "@/services/auth";
import { supabase } from "@/lib/supabase";

interface Advisor {
  id: string;
  firstName: string;
  lastName: string;
  teamName: string;
  title: string;
  firm: string;
  branch: string;
  city: string;
  province: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [latestNews, setLatestNews] = useState("");
  const [advisors, setAdvisors] = useState<Advisor[]>([]);

  // Filters
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedFirm, setSelectedFirm] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedFavoritesList, setSelectedFavoritesList] = useState<string>("");
  const [selectedReportList, setSelectedReportList] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        if (!authenticated) {
          navigate("/login");
          return;
        }

        const user = await authService.getCurrentUser();
        if (user) {
          setUserName(user.first_name || "");
          // Get last login time from session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.last_sign_in_at) {
            setLastLogin(new Date(session.user.last_sign_in_at).toLocaleString());
          }
        }

        // Get latest news
        const { data: newsData } = await supabase
          .from('news_updates')
          .select('content')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (newsData) {
          setLatestNews(newsData.content);
        }

        // Load advisors
        const { data: advisorsData } = await supabase
          .from('advisors')
          .select('*')
          .limit(50);

        if (advisorsData) {
          setAdvisors(advisorsData.map(advisor => ({
            id: advisor.id,
            firstName: advisor.first_name,
            lastName: advisor.last_name,
            teamName: advisor.team_name || '',
            title: advisor.title || '',
            firm: advisor.firm,
            branch: advisor.branch || '',
            city: advisor.city || '',
            province: advisor.province || ''
          })));
        }

      } catch (error) {
        console.error("Error in dashboard:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const resetFilters = () => {
    setSelectedProvince("");
    setSelectedCity("");
    setSelectedFirm("");
    setSelectedBranch("");
    setSelectedTeam("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="/lovable-uploads/8af3a359-89c1-4bf8-a9ea-f2255c283985.png"
                alt="Advisor Connect"
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-gray-500">
            Last login: {lastLogin || "Loading..."}
          </p>
        </div>

        {/* Latest News */}
        <Card className="p-4 mb-8 bg-[#E5D3BC]/10 border-[#E5D3BC]">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-[#E5D3BC] mt-0.5" />
            <div>
              <h2 className="font-medium text-gray-900">Latest News</h2>
              <p className="text-gray-600 mt-1">{latestNews || "No updates available"}</p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-[#E5D3BC]" />
              Filters
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <Button className="bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]">
                Apply Filters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {/* Add province options */}
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {/* Add city options */}
              </SelectContent>
            </Select>

            <Select value={selectedFirm} onValueChange={setSelectedFirm}>
              <SelectTrigger>
                <SelectValue placeholder="Firm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Firms</SelectItem>
                {/* Add firm options */}
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {/* Add branch options */}
              </SelectContent>
            </Select>

            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {/* Add team options */}
              </SelectContent>
            </Select>

            <Select value={selectedFavoritesList} onValueChange={setSelectedFavoritesList}>
              <SelectTrigger>
                <SelectValue placeholder="Favorites List" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lists</SelectItem>
                {/* Add favorites list options */}
              </SelectContent>
            </Select>

            <Select value={selectedReportList} onValueChange={setSelectedReportList}>
              <SelectTrigger>
                <SelectValue placeholder="Report List" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                {/* Add report list options */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advisors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Firm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Province
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {advisors.map((advisor) => (
                  <tr key={advisor.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advisor.firstName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advisor.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advisor.teamName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advisor.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advisor.firm}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advisor.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advisor.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {advisor.province}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;