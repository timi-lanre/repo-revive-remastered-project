
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserPlus } from "lucide-react";
import CreateUserForm from "./CreateUserForm";
import UserListTab from "./UserListTab";
import ErrorMessage from "./ErrorMessage";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: string;
  createdAt: string;
}

interface AdminTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  handleTabChange: (value: string) => void;
  allUsers: UserProfile[];
  loadingError: string | null;
  handleResetPassword: (userId: string, email: string) => Promise<void>;
  createProfileForUser: (userId: string, email: string, firstName: string, lastName: string) => Promise<void>;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ 
  activeTab, 
  setActiveTab, 
  handleTabChange, 
  allUsers, 
  loadingError,
  handleResetPassword,
  createProfileForUser
}) => {
  return (
    <Tabs defaultValue="create" className="space-y-4" value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="create">
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </TabsTrigger>
        <TabsTrigger value="all">
          All Users
          <Badge variant="secondary" className="ml-2">
            {allUsers.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {loadingError && <ErrorMessage message={loadingError} />}

      <TabsContent value="create">
        <CreateUserForm />
      </TabsContent>

      <TabsContent value="all">
        <UserListTab 
          users={allUsers} 
          handleResetPassword={handleResetPassword} 
          createProfileForUser={createProfileForUser}
        />
      </TabsContent>
    </Tabs>
  );
};

export default AdminTabs;
