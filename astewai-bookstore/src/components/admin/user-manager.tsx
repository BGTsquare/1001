'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, Profile } from '@/types';
import { 
  Users, 
  Shield, 
  Search, 
  MoreHorizontal, 
  Loader2,
  Calendar,
  Mail,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ExtendedUser extends Profile {
  email: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

export function UserManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const result = await response.json();
      return result.data as ExtendedUser[];
    }
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user role');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully!');
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user role');
    }
  });

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length,
    recentSignups: users.filter(u => {
      const createdAt = new Date(u.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt > thirtyDaysAgo;
    }).length
  };

  const getRoleBadge = (role: 'user' | 'admin') => {
    return (
      <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
        {role === 'admin' ? (
          <>
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </>
        ) : (
          <>
            <Users className="h-3 w-3 mr-1" />
            User
          </>
        )}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.admins}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.users}</p>
                <p className="text-xs text-muted-foreground">Regular Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.recentSignups}</p>
                <p className="text-xs text-muted-foreground">New (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={(value: 'all' | 'user' | 'admin') => setRoleFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users Only</SelectItem>
                <SelectItem value="admin">Admins Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onRoleUpdate={(role) =>
                    updateRoleMutation.mutate({ userId: user.id, role })
                  }
                  isUpdating={updateRoleMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface UserCardProps {
  user: ExtendedUser;
  onRoleUpdate: (role: 'user' | 'admin') => void;
  isUpdating: boolean;
}

function UserCard({ user, onRoleUpdate, isUpdating }: UserCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: 'user' | 'admin') => {
    return (
      <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
        {role === 'admin' ? (
          <>
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </>
        ) : (
          <>
            <Users className="h-3 w-3 mr-1" />
            User
          </>
        )}
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback>
            {getInitials(user.display_name, user.email)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">
              {user.display_name || 'No display name'}
            </h3>
            {getRoleBadge(user.role)}
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Joined {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {getInitials(user.display_name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-medium">
                        {user.display_name || 'No display name'}
                      </h3>
                      <p className="text-muted-foreground">{user.email}</p>
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">User ID</p>
                      <p className="text-muted-foreground font-mono text-xs">{user.id}</p>
                    </div>
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-muted-foreground">
                        {format(new Date(user.updated_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    {user.last_sign_in_at && (
                      <div>
                        <p className="font-medium">Last Sign In</p>
                        <p className="text-muted-foreground">
                          {format(new Date(user.last_sign_in_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Role Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Role Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Role</p>
                      <p className="text-sm text-muted-foreground">
                        {user.role === 'admin' ? 'Administrator - Full access to admin features' : 'User - Standard user access'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {user.role === 'user' ? (
                        <Button
                          onClick={() => onRoleUpdate('admin')}
                          disabled={isUpdating}
                          size="sm"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Promote to Admin
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onRoleUpdate('user')}
                          disabled={isUpdating}
                          variant="outline"
                          size="sm"
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Demote to User
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reading Preferences */}
              {user.reading_preferences && typeof user.reading_preferences === 'object' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reading Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Font Size</p>
                        <p className="text-muted-foreground">
                          {(user.reading_preferences as any).fontSize || 'Default'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Theme</p>
                        <p className="text-muted-foreground">
                          {(user.reading_preferences as any).theme || 'Default'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Font Family</p>
                        <p className="text-muted-foreground">
                          {(user.reading_preferences as any).fontFamily || 'Default'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}