import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Bell, Info, Search, ChevronUp } from "lucide-react";
import { authService } from "@/services/auth";
import { supabase } from "@/lib/supabase";
import debounce from "@/lib/debounce";

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

const ITEMS_PER_PAGE = 50;

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [latestNews, setLatestNews] = useState("");
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [totalAdvisors, setTotalAdvisors] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState("firstName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filters
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedFirm, setSelectedFirm] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  // Infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
  });

  const loadAdvisors = async (pageNumber: number, searchTerm: string = "") => {
    try {
      let query = supabase
        .from('advisors')
        .select('*', { count: 'exact' });

      // Apply search if provided
      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      // Apply filters
      if (selectedProvince !== "all") query = query.eq('province', selectedProvince);
      if (selectedCity !== "all") query = query.eq('city', selectedCity);
      if (selectedFirm !== "all") query = query.eq('firm', selectedFirm);
      if (selectedBranch !== "all") query = query.eq('branch', selectedBranch);
      if (selectedTeam !== "all") query = query.eq('team_name', selectedTeam);

      // Map frontend column names to database column names for sorting
      const columnMap: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
      };

      // Add sorting using the correct column names
      const dbColumn = columnMap[sortColumn] || sortColumn;
      query = query.order(dbColumn, { ascending: sortDirection === 'asc' });

      // Add pagination
      const { data, count, error } = await query
        .range(pageNumber * ITEMS_PER_PAGE, (pageNumber + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const formattedData = data.map(advisor => ({
        id: advisor.id,
        firstName: advisor.first_name,
        lastName: advisor.last_name,
        teamName: advisor.team_name || '',
        title: advisor.title || '',
        firm: advisor.firm,
        branch: advisor.branch || '',
        city: advisor.city || '',
        province: advisor.province || ''
      }));

      if (pageNumber === 0) {
        setAdvisors(formattedData);
      } else {
        setAdvisors(prev => [...prev, ...formattedData]);
      }

      setTotalAdvisors(count || 0);
      setHasMore((count || 0) > (pageNumber + 1) * ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error loading advisors:", error);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setPage(0);
      loadAdvisors(0, term);
    }, 300),
    [selectedProvince, selectedCity, selectedFirm, selectedBranch, selectedTeam]
  );

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage(prev => prev + 1);
      loadAdvisors(page + 1, searchQuery);
    }
  }, [inView, hasMore]);

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
          .maybeSingle();

        if (newsData) {
          setLatestNews(newsData.content);
        }

        // Load initial advisors
        await loadAdvisors(0);
      } catch (error) {
        console.error("Error in dashboard:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchQuery(term);
    debouncedSearch(term);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const resetFilters = () => {
    setSelectedProvince("all");
    setSelectedCity("all");
    setSelectedFirm("all");
    setSelectedBranch("all");
    setSelectedTeam("all");
    setPage(0);
    loadAdvisors(0, searchQuery);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setPage(0);
    loadAdvisors(0, searchQuery);
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
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
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="mb-8 flex items-start gap-3 text-gray-600 bg-[#E5D3BC]/10 p-4 rounded-lg border border-[#E5D3BC]">
          <Bell className="h-5 w-5 text-[#E5D3BC] mt-0.5" />
          <p>
            Latest News: {latestNews || "No updates available"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                <SelectItem value="AB">Alberta</SelectItem>
                <SelectItem value="BC">British Columbia</SelectItem>
                <SelectItem value="MB">Manitoba</SelectItem>
                <SelectItem value="NB">New Brunswick</SelectItem>
                <SelectItem value="NL">Newfoundland</SelectItem>
                <SelectItem value="NS">Nova Scotia</SelectItem>
                <SelectItem value="ON">Ontario</SelectItem>
                <SelectItem value="PE">Prince Edward Island</SelectItem>
                <SelectItem value="QC">Quebec</SelectItem>
                <SelectItem value="SK">Saskatchewan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {/* Add city options dynamically based on province */}
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
          </div>
        </div>

        {/* Advisors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('firstName')}
                  >
                    <div className="flex items-center gap-1">
                      First Name
                      {sortColumn === 'firstName' && (
                        <ChevronUp className={`h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('lastName')}
                  >
                    <div className="flex items-center gap-1">
                      Last Name
                      {sortColumn === 'lastName' && (
                        <ChevronUp className={`h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
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
                  <tr key={advisor.id} className="hover:bg-gray-50">
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
          
          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={ref} className="py-4 text-center text-gray-500">
              Loading more advisors...
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;