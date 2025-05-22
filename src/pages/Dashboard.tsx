import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Info, 
  Search, 
  ChevronUp, 
  Heart, 
  Mail, 
  Globe, 
  Linkedin, 
  AlertTriangle, 
  X, 
  ChevronDown,
  Filter 
} from "lucide-react";
import { authService } from "@/services/auth";
import { supabase } from "@/lib/supabase";
import debounce from "@/lib/debounce";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface MultiSelectProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}

const ITEMS_PER_PAGE = 50;

// Enhanced multi-select dropdown component with click-outside handling
const MultiSelect: React.FC<MultiSelectProps> = ({ value, onChange, options, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside of the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
    // Keep dropdown open - don't close it
  };

  const handleRemove = (option: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onChange(value.filter(v => v !== option));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([...options]);
  };

  // Handle option click with improved event stopping
  const handleOptionClick = (e: React.MouseEvent, option: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggle(option);
    // Critical: do NOT call setIsOpen(false) here
  };

  const allSelected = options.length > 0 && value.length === options.length;
  const noneSelected = value.length === 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} 
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : allSelected ? (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              All Selected ({options.length})
            </Badge>
          ) : (
            value.slice(0, 2).map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={(e) => handleRemove(item, e)}
                />
              </Badge>
            ))
          )}
          {value.length > 2 && !allSelected && (
            <Badge variant="secondary" className="text-xs">
              +{value.length - 2} more
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {value.length > 0 && (
            <X
              className="h-4 w-4 cursor-pointer hover:text-destructive"
              onClick={(e) => handleClear(e)}
            />
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {options.length === 0 ? (
            <div className="py-2 px-3 text-sm text-muted-foreground">No options available</div>
          ) : (
            <>
              {/* Select All / Clear All controls */}
              <div className="border-b border-gray-200 mb-1 pb-1">
                <div className="flex items-center justify-between px-2 py-1 text-xs text-gray-600">
                  <button
                    className="hover:text-blue-600 cursor-pointer"
                    onClick={handleSelectAll}
                    onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                  >
                    Select All
                  </button>
                  <button
                    className="hover:text-red-600 cursor-pointer"
                    onClick={handleClear}
                    onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <ScrollArea className="max-h-52">
                {options.map((option) => (
                  <div
                    key={option}
                    className="flex items-center space-x-2 rounded-sm px-2 py-2 hover:bg-accent cursor-pointer"
                    onClick={(e) => handleOptionClick(e, option)}
                    onMouseDown={(e) => e.preventDefault()} // Prevent focus loss and dropdown close
                  >
                    <Checkbox
                      checked={value.includes(option)}
                      onCheckedChange={() => handleToggle(option)}
                      onClick={(e) => e.stopPropagation()} // Prevent double toggle
                    />
                    <span className="text-sm">{option}</span>
                  </div>
                ))}
              </ScrollArea>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ActiveFilters component to display and manage active filters
const ActiveFilters = ({ 
  activeProvinces, 
  activeCities, 
  activeFirms, 
  activeBranches, 
  activeTeams,
  onRemoveFilter
}) => {
  const hasFilters = activeProvinces.length > 0 || activeCities.length > 0 || 
                     activeFirms.length > 0 || activeBranches.length > 0 || 
                     activeTeams.length > 0;
                     
  if (!hasFilters) {
    return <div className="text-gray-500 italic text-sm">No active filters</div>;
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {activeProvinces.map(province => (
        <Badge key={`province-${province}`} variant="secondary" className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
          Province: {province}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter('province', province)} 
          />
        </Badge>
      ))}
      
      {activeCities.map(city => (
        <Badge key={`city-${city}`} variant="secondary" className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
          City: {city}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-red-500" 
            onClick={() => onRemoveFilter('city', city)} 
          />
        </Badge>
      ))}
      
      {activeFirms.map(firm => (
        <Badge key={`firm-${firm}`} variant="secondary" className="px-2 py-1 bg-green-50 text-green-800 border border-green-200 flex items-center gap-1">
          Firm: {firm}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-red-500" 
            onClick={() => onRemoveFilter('firm', firm)} 
          />
        </Badge>
      ))}
      
      {activeBranches.map(branch => (
        <Badge key={`branch-${branch}`} variant="secondary" className="px-2 py-1 bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
          Branch: {branch}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-red-500" 
            onClick={() => onRemoveFilter('branch', branch)} 
          />
        </Badge>
      ))}
      
      {activeTeams.map(team => (
        <Badge key={`team-${team}`} variant="secondary" className="px-2 py-1 bg-red-50 text-red-800 border border-red-200 flex items-center gap-1">
          Team: {team}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-red-500" 
            onClick={() => onRemoveFilter('team', team)} 
          />
        </Badge>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
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
  
  // Toggle for expanded filter view
  const [showFilters, setShowFilters] = useState(true);

  // Active filters (applied to data)
  const [activeProvinces, setActiveProvinces] = useState<string[]>([]);
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [activeFirms, setActiveFirms] = useState<string[]>([]);
  const [activeBranches, setActiveBranches] = useState<string[]>([]);
  const [activeTeams, setActiveTeams] = useState<string[]>([]);

  // Pending filters (not yet applied)
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedFirms, setSelectedFirms] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // All available filter options (unfiltered)
  const [allFilterOptions, setAllFilterOptions] = useState<FilterOptions>({
    provinces: [],
    cities: [],
    firms: [],
    branches: [],
    teams: []
  });

  // Filtered options based on current selections (for cascading)
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

  // Load all filter options on component mount
  const loadAllFilterOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('advisors')
        .select('province, city, firm, branch, team_name');

      if (error) throw error;

      const options: FilterOptions = {
        provinces: Array.from(new Set(data.map(d => d.province).filter(Boolean))).sort(),
        cities: Array.from(new Set(data.map(d => d.city).filter(Boolean))).sort(),
        firms: Array.from(new Set(data.map(d => d.firm).filter(Boolean))).sort(),
        branches: Array.from(new Set(data.map(d => d.branch).filter(Boolean))).sort(),
        teams: Array.from(new Set(data.map(d => d.team_name).filter(Boolean))).sort()
      };

      setAllFilterOptions(options);
      setFilterOptions(options);
    } catch (error) {
      console.error("Error loading all filter options:", error);
    }
  };

  // Update cascading filter options based on pending selections (not active ones)
  const updateCascadingFilters = async () => {
    try {
      let query = supabase.from('advisors').select('province, city, firm, branch, team_name');

      // Apply pending filters to determine what options should be available
      if (selectedProvinces.length > 0) {
        query = query.in('province', selectedProvinces);
      }
      if (selectedCities.length > 0) {
        query = query.in('city', selectedCities);
      }
      if (selectedFirms.length > 0) {
        query = query.in('firm', selectedFirms);
      }
      if (selectedBranches.length > 0) {
        query = query.in('branch', selectedBranches);
      }
      if (selectedTeams.length > 0) {
        query = query.in('team_name', selectedTeams);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Determine which filters have selections
      const hasAnyFilter = selectedProvinces.length > 0 || selectedCities.length > 0 || 
                          selectedFirms.length > 0 || selectedBranches.length > 0 || selectedTeams.length > 0;

      const newOptions: FilterOptions = {
        provinces: hasAnyFilter ? 
          Array.from(new Set([...selectedProvinces, ...data.map(d => d.province).filter(Boolean)])).sort() :
          allFilterOptions.provinces,
        
        cities: hasAnyFilter ?
          Array.from(new Set([...selectedCities, ...data.map(d => d.city).filter(Boolean)])).sort() :
          allFilterOptions.cities,
        
        firms: hasAnyFilter ?
          Array.from(new Set([...selectedFirms, ...data.map(d => d.firm).filter(Boolean)])).sort() :
          allFilterOptions.firms,
        
        branches: hasAnyFilter ?
          Array.from(new Set([...selectedBranches, ...data.map(d => d.branch).filter(Boolean)])).sort() :
          allFilterOptions.branches,
        
        teams: hasAnyFilter ?
          Array.from(new Set([...selectedTeams, ...data.map(d => d.team_name).filter(Boolean)])).sort() :
          allFilterOptions.teams
      };

      setFilterOptions(newOptions);

      // Remove selected values that are no longer available
      const validProvinces = selectedProvinces.filter(p => newOptions.provinces.includes(p));
      if (validProvinces.length !== selectedProvinces.length) {
        setSelectedProvinces(validProvinces);
      }
      
      const validCities = selectedCities.filter(c => newOptions.cities.includes(c));
      if (validCities.length !== selectedCities.length) {
        setSelectedCities(validCities);
      }
      
      const validFirms = selectedFirms.filter(f => newOptions.firms.includes(f));
      if (validFirms.length !== selectedFirms.length) {
        setSelectedFirms(validFirms);
      }
      
      const validBranches = selectedBranches.filter(b => newOptions.branches.includes(b));
      if (validBranches.length !== selectedBranches.length) {
        setSelectedBranches(validBranches);
      }
      
      const validTeams = selectedTeams.filter(t => newOptions.teams.includes(t));
      if (validTeams.length !== selectedTeams.length) {
        setSelectedTeams(validTeams);
      }

    } catch (error) {
      console.error("Error updating cascading filters:", error);
    }
  };

  const loadAdvisors = async (pageNumber: number, searchTerm: string = "", forceReload: boolean = false) => {
    if (loadingAdvisors && !forceReload) return;
    
    try {
      setLoadingAdvisors(true);
      
      let query = supabase
        .from('advisors')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`first_name.ilike.%${searchTerm.trim()}%,last_name.ilike.%${searchTerm.trim()}%`);
      }

      // Apply ACTIVE filters (not pending ones)
      if (activeProvinces.length > 0) query = query.in('province', activeProvinces);
      if (activeCities.length > 0) query = query.in('city', activeCities);
      if (activeFirms.length > 0) query = query.in('firm', activeFirms);
      if (activeBranches.length > 0) query = query.in('branch', activeBranches);
      if (activeTeams.length > 0) query = query.in('team_name', activeTeams);

      // Apply sorting
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

      const dbColumn = columnMap[sortColumn] || 'first_name';
      query = query.order(dbColumn, { 
        ascending: sortDirection === 'asc'
      });

      const { data, count, error } = await query
        .range(pageNumber * ITEMS_PER_PAGE, (pageNumber + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const formattedData = data.map(advisor => ({
        id: advisor.id,
        firstName: advisor.first_name || '',
        lastName: advisor.last_name || '',
        teamName: advisor.team_name || '',
        title: advisor.title || '',
        firm: advisor.firm || '',
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
    } finally {
      setLoadingAdvisors(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setPage(0);
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
      loadAdvisors(0, term, true);
    }, 300),
    [activeProvinces, activeCities, activeFirms, activeBranches, activeTeams, sortColumn, sortDirection]
  );

  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loadingAdvisors && advisors.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadAdvisors(nextPage, searchQuery);
    }
  }, [inView, hasMore, loadingAdvisors, advisors.length, page, searchQuery]);

  // Update cascading filters when pending selections change
  useEffect(() => {
    if (allFilterOptions.provinces.length > 0) {
      updateCascadingFilters();
    }
  }, [selectedProvinces, selectedCities, selectedFirms, selectedBranches, selectedTeams, allFilterOptions]);

  // Initial load
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

        await loadAllFilterOptions();
        await loadAdvisors(0, '', true);
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
    // Reset both pending and active filters
    setSelectedProvinces([]);
    setSelectedCities([]);
    setSelectedFirms([]);
    setSelectedBranches([]);
    setSelectedTeams([]);
    setActiveProvinces([]);
    setActiveCities([]);
    setActiveFirms([]);
    setActiveBranches([]);
    setActiveTeams([]);
    setSearchQuery("");
    setSortColumn("firstName");
    setSortDirection("asc");
    setPage(0);
    
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    
    // Reset filter options to show all
    setFilterOptions(allFilterOptions);
    
    // Reload with no filters
    await loadAdvisors(0, "", true);
  };

  const handleSort = (column: string) => {
    if (column === 'actions' || loadingAdvisors) return;
    
    let newSortDirection: "asc" | "desc" = "asc";
    let newSortColumn = column;
    
    if (sortColumn === column) {
      newSortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    // Update state synchronously
    setSortColumn(newSortColumn);
    setSortDirection(newSortDirection);
    setPage(0);
    
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    
    // Use the new values directly instead of state
    setTimeout(() => {
      loadAdvisorsWithSort(newSortColumn, newSortDirection);
    }, 0);
  };

  const loadAdvisorsWithSort = async (newSortColumn: string, newSortDirection: "asc" | "desc") => {
    try {
      setLoadingAdvisors(true);
      
      let query = supabase
        .from('advisors')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`first_name.ilike.%${searchQuery.trim()}%,last_name.ilike.%${searchQuery.trim()}%`);
      }

      // Apply ACTIVE filters
      if (activeProvinces.length > 0) query = query.in('province', activeProvinces);
      if (activeCities.length > 0) query = query.in('city', activeCities);
      if (activeFirms.length > 0) query = query.in('firm', activeFirms);
      if (activeBranches.length > 0) query = query.in('branch', activeBranches);
      if (activeTeams.length > 0) query = query.in('team_name', activeTeams);

      // Apply sorting with new values
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

      const dbColumn = columnMap[newSortColumn] || 'first_name';
      query = query.order(dbColumn, { 
        ascending: newSortDirection === 'asc'
      });

      const { data, count, error } = await query
        .range(0, ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const formattedData = data.map(advisor => ({
        id: advisor.id,
        firstName: advisor.first_name || '',
        lastName: advisor.last_name || '',
        teamName: advisor.team_name || '',
        title: advisor.title || '',
        firm: advisor.firm || '',
        branch: advisor.branch || '',
        city: advisor.city || '',
        province: advisor.province || '',
        email: advisor.email || '',
        websiteUrl: advisor.website_url || '',
        linkedinUrl: advisor.linkedin_url || ''
      }));

      setAdvisors(formattedData);
      setTotalAdvisors(count || 0);
      setHasMore((count || 0) > ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error loading advisors with sort:", error);
    } finally {
      setLoadingAdvisors(false);
    }
  };

  const applyFilters = async () => {
    // Move pending filters to active filters
    setActiveProvinces([...selectedProvinces]);
    setActiveCities([...selectedCities]);
    setActiveFirms([...selectedFirms]);
    setActiveBranches([...selectedBranches]);
    setActiveTeams([...selectedTeams]);
    
    setPage(0);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    
    // Load data with the new active filters
    setTimeout(() => {
      loadAdvisorsWithNewFilters(selectedProvinces, selectedCities, selectedFirms, selectedBranches, selectedTeams);
    }, 0);
  };

  const loadAdvisorsWithNewFilters = async (provinces: string[], cities: string[], firms: string[], branches: string[], teams: string[]) => {
    try {
      setLoadingAdvisors(true);
      
      let query = supabase
        .from('advisors')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`first_name.ilike.%${searchQuery.trim()}%,last_name.ilike.%${searchQuery.trim()}%`);
      }

      // Apply new filters
      if (provinces.length > 0) query = query.in('province', provinces);
      if (cities.length > 0) query = query.in('city', cities);
      if (firms.length > 0) query = query.in('firm', firms);
      if (branches.length > 0) query = query.in('branch', branches);
      if (teams.length > 0) query = query.in('team_name', teams);

      // Apply sorting
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

      const dbColumn = columnMap[sortColumn] || 'first_name';
      query = query.order(dbColumn, { 
        ascending: sortDirection === 'asc'
      });

      const { data, count, error } = await query
        .range(0, ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const formattedData = data.map(advisor => ({
        id: advisor.id,
        firstName: advisor.first_name || '',
        lastName: advisor.last_name || '',
        teamName: advisor.team_name || '',
        title: advisor.title || '',
        firm: advisor.firm || '',
        branch: advisor.branch || '',
        city: advisor.city || '',
        province: advisor.province || '',
        email: advisor.email || '',
        websiteUrl: advisor.website_url || '',
        linkedinUrl: advisor.linkedin_url || ''
      }));

      setAdvisors(formattedData);
      setTotalAdvisors(count || 0);
      setHasMore((count || 0) > ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error loading advisors with new filters:", error);
    } finally {
      setLoadingAdvisors(false);
    }
  };

  const getActiveFilterCount = () => {
    return activeProvinces.length + activeCities.length + activeFirms.length + 
           activeBranches.length + activeTeams.length;
  };

  const hasUnappliedChanges = () => {
    return JSON.stringify([activeProvinces, activeCities, activeFirms, activeBranches, activeTeams]) !==
           JSON.stringify([selectedProvinces, selectedCities, selectedFirms, selectedBranches, selectedTeams]);
  };

  // Handle filter removal directly from displayed badges
  const handleRemoveFilter = (filterType: string, value: string) => {
    switch(filterType) {
      case 'province':
        setActiveProvinces(prev => prev.filter(p => p !== value));
        setSelectedProvinces(prev => prev.filter(p => p !== value));
        break;
      case 'city':
        setActiveCities(prev => prev.filter(c => c !== value));
        setSelectedCities(prev => prev.filter(c => c !== value));
        break;
      case 'firm':
        setActiveFirms(prev => prev.filter(f => f !== value));
        setSelectedFirms(prev => prev.filter(f => f !== value));
        break;
      case 'branch':
        setActiveBranches(prev => prev.filter(b => b !== value));
        setSelectedBranches(prev => prev.filter(b => b !== value));
        break;
      case 'team':
        setActiveTeams(prev => prev.filter(t => t !== value));
        setSelectedTeams(prev => prev.filter(t => t !== value));
        break;
    }
    
    // Reload data with the updated filters
    setPage(0);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    
    setTimeout(() => {
      let updatedProvinces = [...activeProvinces];
      let updatedCities = [...activeCities];
      let updatedFirms = [...activeFirms];
      let updatedBranches = [...activeBranches];
      let updatedTeams = [...activeTeams];
      
      if (filterType === 'province') updatedProvinces = updatedProvinces.filter(p => p !== value);
      if (filterType === 'city') updatedCities = updatedCities.filter(c => c !== value);
      if (filterType === 'firm') updatedFirms = updatedFirms.filter(f => f !== value);
      if (filterType === 'branch') updatedBranches = updatedBranches.filter(b => b !== value);
      if (filterType === 'team') updatedTeams = updatedTeams.filter(t => t !== value);
      
      loadAdvisorsWithNewFilters(
        updatedProvinces,
        updatedCities,
        updatedFirms,
        updatedBranches,
        updatedTeams
      );
    }, 0);
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
      {/* Header */}
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
      </div>

      {/* Welcome Section - Moved outside header */}
      <div className="w-full max-w-[1800px] mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#111827]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-gray-700">
            Last login: {lastLogin || "Loading..."}
          </p>
        </div>

        {/* Latest News */}
        {latestNews && (
          <div className="mb-6 flex items-start gap-3 text-gray-600 bg-[#E5D3BC]/10 p-4 rounded-lg border border-[#E5D3BC]">
            <Info className="h-5 w-5 text-[#E5D3BC] mt-0.5" />
            <p>Latest News: {latestNews}</p>
          </div>
        )}

        {/* Enhanced Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                Filter Advisors
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                className="ml-2 h-7 px-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Active Filters: {getActiveFilterCount()}</span>
              {hasUnappliedChanges() && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Changes Pending
                </Badge>
              )}
            </div>
          </div>

          {/* Selected filters display - Always visible */}
          <div className="mb-4 p-3 border border-gray-200 bg-gray-50 rounded-lg min-h-12">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Active Filters</h3>
              {getActiveFilterCount() > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={resetFilters}
                >
                  Clear All
                </Button>
              )}
            </div>
            <ActiveFilters
              activeProvinces={activeProvinces}
              activeCities={activeCities}
              activeFirms={activeFirms}
              activeBranches={activeBranches}
              activeTeams={activeTeams}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>

          {/* Filter controls - Can be hidden */}
          {showFilters && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provinces</label>
                  <MultiSelect
                    value={selectedProvinces}
                    onChange={setSelectedProvinces}
                    options={filterOptions.provinces}
                    placeholder="Select provinces..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cities</label>
                  <MultiSelect
                    value={selectedCities}
                    onChange={setSelectedCities}
                    options={filterOptions.cities}
                    placeholder="Select cities..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firms</label>
                  <MultiSelect
                    value={selectedFirms}
                    onChange={setSelectedFirms}
                    options={filterOptions.firms}
                    placeholder="Select firms..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
                  <MultiSelect
                    value={selectedBranches}
                    onChange={setSelectedBranches}
                    options={filterOptions.branches}
                    placeholder="Select branches..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teams</label>
                  <MultiSelect
                    value={selectedTeams}
                    onChange={setSelectedTeams}
                    options={filterOptions.teams}
                    placeholder="Select teams..."
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
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
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                  >
                    Reset All
                  </Button>
                  <Button 
                    className={`${hasUnappliedChanges() ? 'bg-[#E5D3BC] text-black hover:bg-[#d6c3ac]' : 'bg-gray-300 text-gray-600'}`}
                    onClick={applyFilters}
                    disabled={loadingAdvisors || !hasUnappliedChanges()}
                  >
                    {loadingAdvisors ? 'Loading...' : 'Apply Filters'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Mode Selection */}
        <div className="mb-4">
          <ToggleGroup type="single" defaultValue="table" className="justify-start">
            <ToggleGroupItem value="table" className="text-xs">Table View</ToggleGroupItem>
            <ToggleGroupItem value="card" className="text-xs">Card View</ToggleGroupItem>
            <ToggleGroupItem value="map" className="text-xs">Map View</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div ref={tableContainerRef} className="w-full overflow-x-auto" style={{ height: 'calc(15 * 70px + 48px)' }}>
            <table className="w-full table-fixed border-collapse min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {[
                    { key: 'firstName', label: 'First Name', width: '8%' },
                    { key: 'lastName', label: 'Last Name', width: '8%' },
                    { key: 'teamName', label: 'Team Name', width: '14%' },
                    { key: 'title', label: 'Title', width: '18%' },
                    { key: 'firm', label: 'Firm', width: '12%' },
                    { key: 'branch', label: 'Branch', width: '12%' },
                    { key: 'city', label: 'City', width: '8%' },
                    { key: 'province', label: 'Province', width: '6%' },
                    { key: 'actions', label: 'Actions', width: '14%' }
                  ].map((column) => (
                    <th
                      key={column.key}
                      onClick={() => column.key !== 'actions' && handleSort(column.key)}
                      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 ${
                        column.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''
                      } ${column.key === 'actions' ? 'text-center' : ''} ${loadingAdvisors ? 'pointer-events-none opacity-50' : ''}`}
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
                  <tr key={advisor.id} className="hover:bg-gray-50" style={{ height: '70px' }}>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate whitespace-normal">
                      {advisor.firstName}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate whitespace-normal">
                      {advisor.lastName}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate whitespace-normal">
                      {advisor.teamName}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate whitespace-normal">
                      {advisor.title}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate whitespace-normal">
                      {advisor.firm}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate whitespace-normal">
                      {advisor.branch}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate whitespace-normal">
                      {advisor.city}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 truncate whitespace-normal">
                      {advisor.province}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500 text-center">
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
            {loadingAdvisors && <span className="ml-2">(Loading...)</span>}
          </div>
          
          {hasMore && !loadingAdvisors && (
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
