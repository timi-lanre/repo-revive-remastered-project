
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserTable from "./UserTable";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: string;
  createdAt: string;
}

interface UserListTabProps {
  users: UserProfile[];
  handleResetPassword: (userId: string, email: string) => Promise<void>;
  createProfileForUser: (userId: string, email: string, firstName: string, lastName: string) => Promise<void>;
}

const UserListTab: React.FC<UserListTabProps> = ({ users, handleResetPassword, createProfileForUser }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users ({users.length})</CardTitle>
        <CardDescription>
          Manage all registered users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserTable 
          users={users} 
          handleResetPassword={handleResetPassword} 
          createProfileForUser={createProfileForUser}
        />
      </CardContent>
    </Card>
  );
};

export default UserListTab;
