import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logout } from "@/store/slices/authSlice";
import { toast } from "sonner";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

const UserProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    // You might want to redirect to login page here
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
  };

  const handleCancelChangePassword = () => {
    setShowChangePassword(false);
  };

  const handleViewPublicProfile = () => {
    setShowChangePassword(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 mt-1">View your information</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="font-bold text-xl">
                  {user?.first_name} {user?.last_name}
                </h2>
                <p className="text-slate-500 text-sm">
                  {user?.role || "Employee"}
                </p>
                <div className="mt-6 w-full space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleViewPublicProfile}
                  >
                    View Public Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleChangePassword}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    Log Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          {showChangePassword ? (
            <Card>
              <CardContent className="pt-6">
                <ChangePasswordForm onSuccess={handleViewPublicProfile} />
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-4 max-w-[600px] mb-6">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="timeline" disabled>
                  Timeline & Reporting
                </TabsTrigger>
                <TabsTrigger value="payroll" disabled>
                  Payroll
                </TabsTrigger>
                <TabsTrigger value="documents" disabled>
                  Documents
                </TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Your personal details (Read Only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            value={user?.firstName || ""}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            value={user?.lastName || ""}
                            disabled
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            value={user?.email || ""}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={user?.phone || ""}
                            disabled
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={user?.address?.city || ""}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={user?.address?.state || ""}
                            disabled
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={user?.address?.country || ""}
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline & Reporting</CardTitle>
                    <CardDescription>
                      This feature is not available yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500">
                      Timeline and reporting functionality will be available
                      soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="payroll" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payroll</CardTitle>
                    <CardDescription>
                      This feature is not available yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500">
                      Payroll functionality will be available soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      This feature is not available yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500">
                      Documents functionality will be available soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
