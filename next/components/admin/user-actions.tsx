"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreHorizontal,
  Shield,
  Ban,
  Unlock,
  Trash2,
  User,
} from "lucide-react";
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

interface UserActionsProps {
  user: User;
  onUpdate: () => void;
}

export function UserActions({ user, onUpdate }: UserActionsProps) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role || "user");
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async () => {
    setLoading(true);
    try {
      // Type assertion needed because Better Auth types don't include custom adminRoles
      await authClient.admin.setRole({
        userId: user.id,
        role: selectedRole as "user" | "admin",
      });
      toast.success(`Role updated to ${selectedRole}`);
      setRoleDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update role");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    setLoading(true);
    try {
      await authClient.admin.banUser({
        userId: user.id,
        banReason: banReason || "Violated terms of service",
      });
      toast.success(`User ${user.name || user.email} has been banned`);
      setBanDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to ban user");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    setLoading(true);
    try {
      await authClient.admin.unbanUser({
        userId: user.id,
      });
      toast.success(`User ${user.name || user.email} has been unbanned`);
      onUpdate();
    } catch (error) {
      toast.error("Failed to unban user");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setLoading(true);
    try {
      await authClient.admin.removeUser({
        userId: user.id,
      });
      toast.success(`User ${user.name || user.email} has been deleted`);
      setDeleteDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
          {user.banned ? (
            <DropdownMenuItem onClick={handleUnbanUser} disabled={loading}>
              <Unlock className="mr-2 h-4 w-4" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
              <Ban className="mr-2 h-4 w-4" />
              Ban User
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {user.name || user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={loading}>
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              This will prevent {user.name || user.email} from accessing the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={loading}
            >
              {loading ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {user.name || user.email}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
