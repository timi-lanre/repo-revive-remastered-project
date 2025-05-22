import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { Info, Search, ChevronUp, Heart, Mail, Globe, Linkedin, AlertTriangle } from "lucide-react";
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
  email: string;
  websiteUrl: string;
  linkedinUrl: string;
}

interface FilterOptions {
  provinces: string[];
  cities: string[];
  firms: string[];
  branches: string[];
  teams: string[];
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

  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedFirm, setSelectedFirm] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedFavoritesList, setSelectedFavoritesList] = useState<string>("all");
  const [selectedReportList, setSelectedReportList] = useState<string>("all");

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    provinces: [],
    cities: [],
    firms: [],
    branches: [],
    teams: []
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const loadAdvisors = async (pageNumber: number, searchTerm: string = "") => {
    try {
      let query = supabase
        .from('advisors')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      if (selectedProvince !== "all") query = query.eq('province', selectedProvince);
      if (selectedCity !== "all") query = query.eq('city', selectedCity);
      if (selectedFirm !== "all") query = query.eq('firm', selectedFirm);
      if (selectedBranch !== "all") query = query.eq('branch', selectedBranch);
      if (selectedTeam !== "all") query = query.eq('team_name', selectedTeam);

      const columnMap: Record<string, string> = {
        firstName: 'first_name',
        lastName: 'last_name',
        teamName: 'team_name',
        title: 'title',
        firm: 'firm',
        branch: 'branch',
        city: 'city',
        province: 'province'
      };

      const dbColumn = columnMap[sortColumn] || sortColumn;
      if (sortDirection === 'asc') {
        query = query.order(dbColumn, { ascending: true, nullsLast: true });
      } else {
        query = query.order(dbColumn, { ascending: false, nullsFirst: true });
      }

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
        province: advisor.province || '',
        email: advisor.email || '',
        websiteUrl: advisor.website_url || '',
        linkedinUrl: advisor.linkedin_url || ''
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

  const loadFilterOptions = async () => {
    try {
      let query = supabase.from('advisors').select('province, city, firm, branch, team_name');

      if (selectedProvince !== "all") {
        query = query.eq('province', selectedProvince);
      }
      if (selectedCity !== "all") {
        query = query.eq('city', selectedCity);
      }
      if (selectedFirm !== "all") {
        query = query.eq('firm', selectedFirm);
      }
      if (selectedBranch !== "all") {
        query = query.eq('branch', selectedBranch);
      }

      const { data, error } = await query;

      if (error) throw error;

      const options: FilterOptions = {
        provinces: Array.from(new Set(data.map(d => d.province).filter(Boolean))).sort(),
        cities: Array.from(new Set(data.map(d => d.city).filter(Boolean))).sort(),
        firms: Array.from(new Set(data.map(d => d.firm).filter(Boolean))).sort(),
        branches: Array.from(new Set(data.map(d => d.branch).filter(Boolean))).sort(),
        teams: Array.from(new Set(data.map(d => d.team_name).filter(Boolean))).sort()
      };

      setFilterOptions(options);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, [selectedProvince, selectedCity, selectedFirm, selectedBranch]);

  const handleFilterChange = async (value: string, filterType: string) => {
    switch (filterType) {
      case 'province':
        setSelectedProvince(value);
        setSelectedCity('all');
        setSelectedFirm('all');
        setSelectedBranch('all');
        setSelectedTeam('all');
        break;
      case 'city':
        setSelectedCity(value);
        setSelectedFirm('all');
        setSelectedBranch('all');
        setSelectedTeam('all');
        break;
      case 'firm':
        setSelectedFirm(value);
        setSelectedBranch('all');
        setSelectedTeam('all');
        break;
      case 'branch':
        setSelectedBranch(value);
        setSelectedTeam('all');
        break;
      case 'team':
        setSelectedTeam(value);
        break;
    }
  };

  const applyFilters = async () => {
    setPage(0);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    await loadAdvisors(0, searchQuery);
  };

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

        const { data: newsData } = await supabase
          .from('news_updates')
          .select('content')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (newsData) {
          setLatestNews(newsData.content);
        }

        await loadAdvisors(0);
        await loadFilterOptions();
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

  const resetFilters = async () => {
    setSelectedProvince("all");
    setSelectedCity("all");
    setSelectedFirm("all");
    setSelectedBranch("all");
    setSelectedTeam("all");
    setSelectedFavoritesList("all");
    setSelectedReportList("all");
    setSearchQuery("");
    setSortColumn("firstName");
    setSortDirection("asc");
    setPage(0);
    
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    
    await loadAdvisors(0, "");
    await loadFilterOptions();
  };

  const handleSort = (column: string) => {
    if (column === 'actions') return;
    
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
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="w-full px-4 sm:px-8 md:px-12 py-6 bg-gradient-to-r from-[#E5D3BC] to-[#e9d9c6] border-b border-black/5 shadow-sm">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center justify-center sm:justify-start w-full sm:w-auto">
            <img
              src="/lovable-uploads/8af3a359-89c1-4bf8-a9ea-f2255c283985.png"
              alt="Advisor Connect"
              width={268}
              height={100}
              className="object-contain"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="relative text-[#1E293B] font-semibold text-base px-3 py-1 rounded-lg border border-black/10
                bg-white/20 text-black after:content-[''] after:absolute after:bottom-0 after:left-[10%] after:w-4/5 after:h-0.5 after:bg-black"
            >
              Home
            </Button>
            <Button
              variant="ghost"
              className="relative text-[#1E293B] font-semibold text-base px-3 py-1 rounded-lg border border-transparent
                hover:bg-white/20 hover:border-black/10 hover:text-black hover:-translate-y-0.5 transition-all duration-300"
              onClick={() => navigate("/about")}
            >
              About
            </Button>
            <Button
              variant="ghost"
              className="relative text-[#1E293B] font-semibold text-base px-3 py-1 rounded-lg border border-transparent
                hover:bg-white/20 hover:border-black/10 hover:text-black hover:-translate-y-0.5 transition-all duration-300"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-[#111827]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-gray-700">
            Last login: {lastLogin || "Loading..."}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1800px] mx-auto px-4 py-8">
        {latestNews && (
          <div className="mb-8 flex items-start gap-3 text-gray-600 bg-[#E5D3BC]/10 p-4 rounded-lg border border-[#E5D3BC]">
            <Info className="h-5 w-5 text-[#E5D3BC] mt-0.5" />
            <p>Latest News: {latestNews}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Select 
              value={selectedProvince} 
              onValueChange={(value) => handleFilterChange(value, 'province')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {filterOptions.provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedCity} 
              onValueChange={(value) => handleFilterChange(value, 'city')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {filterOptions.cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedFirm} 
              onValueChange={(value) => handleFilterChange(value, 'firm')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Firms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Firms</SelectItem>
                {filterOptions.firms.map((firm) => (
                  <SelectItem key={firm} value={firm}>
                    {firm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedBranch} 
              onValueChange={(value) => handleFilterChange(value, 'branch')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {filterOptions.branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedTeam} 
              onValueChange={(value) => handleFilterChange(value, 'team')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {filterOptions.teams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFavoritesList} onValueChange={setSelectedFavoritesList}>
              <SelectTrigger>
                <SelectValue placeholder="All Lists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lists</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button 
              className="bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]"
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>

        <div className="relative flex-1 max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div ref={tableContainerRef} className="w-full overflow-x-auto" style={{ height: 'calc(13 * 53px + 48px)' }}>
            <table className="w-full table-fixed border-collapse min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {[
                    { key: 'firstName', label: 'First Name', width: '120px' },
                    { key: 'lastName', label: 'Last Name', width: '120px' },
                    { key: 'teamName', label: 'Team Name', width: '180px' },
                    { key: 'title', label: 'Title', width: '180px' },
                    { key: 'firm', label: 'Firm', width: '140px' },
                    { key: 'branch', label: 'Branch', width: '180px' },
                    { key: 'city', label: 'City', width: '120px' },
                    { key: 'province', label: 'Province', width: '100px' },
                    { key: 'actions', label: 'Actions', width: '160px' }
                  ].map((column) => (
                    <th
                      key={column.key}
                      onClick={() => column.key !== 'actions' && handleSort(column.key)}
                      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 ${
                        column.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''
                      } ${column.key === 'actions' ? 'text-center sticky right-0 bg-gray-50' : ''}`}
                      style={{ width: column.width }}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.key !== 'actions' && sortColumn === column.key && (
                          <ChevronUp
                            className={`h-4 w-4 transition-transform ${
                              sortDirection === 'desc' ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {advisors.map((advisor) => (
                  <tr key={advisor.id} className="hover:bg-gray-50" style={{ height: '53px' }}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {advisor.firstName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {advisor.lastName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {advisor.teamName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {advisor.title}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {advisor.firm}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {advisor.branch}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {advisor.city}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      {advisor.province}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-[#E5D3BC]"
                          title="Add to Favorites"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        {advisor.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:text-[#E5D3BC]"
                            title="Send Email"
                            onClick={() => window.location.href = `mailto:${advisor.email}`}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {advisor.websiteUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:text-[#E5D3BC]"
                            title="Visit Website"
                            onClick={() => window.open(advisor.websiteUrl, '_blank')}
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        )}
                        {advisor.linkedinUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:text-[#E5D3BC]"
                            title="View LinkedIn Profile"
                            onClick={() => window.open(advisor.linkedinUrl, '_blank')}
                          >
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-red-500"
                          title="Report Issue"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-3 px-6 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Total Advisors: {totalAdvisors}
          </div>
          
          {hasMore && (
            <div ref={ref} className="py-4 text-center text-gray-500">
              Loading more advisors...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
