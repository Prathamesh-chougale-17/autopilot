"use client";

import { useState, useEffect } from "react";
import { client } from "@/lib/orpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { UserActions } from "./user-actions";
import { Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  banned: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
  createdAt?: Date | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch users via oRPC
      const data = await client.admin.getUsers({});
      setUsers(data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserUpdate = () => {
    fetchUsers();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users, roles, and permissions
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={fetchUsers}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No users found. Users will appear here once they sign up.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || "N/A"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "admin" || user.role === "super-admin"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {user.role || "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-green-500 border-green-500"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions user={user} onUpdate={handleUserUpdate} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
