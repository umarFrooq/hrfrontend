import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  User,
  Clock,
  FileText,
  Shield,
  Users,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { getParsedUserRoles } from "@/utils/helpers";

const UserViewDialog = ({ user, children }) => {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "PPP");
    } catch {
      return null;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return null;
    return timeString;
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  const getStatusColor = (isActive) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getRoleColor = (role) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      hr: "bg-green-100 text-green-800",
      manager: "bg-orange-100 text-orange-800",
      employee: "bg-gray-100 text-gray-800",
      client: "bg-indigo-100 text-indigo-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  // Check if user is client or admin
  const isClientOrAdmin = user.role === "client" || user.role === "admin";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Eye className="h-3 w-3" />
            <span>View</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            User Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Header Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 flex-shrink-0">
                  <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex items-center">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {user.firstName} {user.lastName}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {getParsedUserRoles(user.role)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.employeeId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Employee ID
                    </label>
                    <p className="text-gray-900 font-medium">
                      {user.employeeId}
                    </p>
                  </div>
                )}
                {formatDate(user.dateOfBirth) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </label>
                    <p className="text-gray-900">
                      {formatDate(user.dateOfBirth)}
                    </p>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}
                {user.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Bio
                    </label>
                    <p className="text-gray-900">{user.bio}</p>
                  </div>
                )}
                {user.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>Address</span>
                    </label>
                    <p className="text-gray-900">
                      {user.address.city}, {user.address.state},{" "}
                      {user.address.country}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Information - Only show if not client or admin */}
            {!isClientOrAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-green-600" />
                    <span>Work Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.jobTitle && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Job Title
                      </label>
                      <p className="text-gray-900 font-medium">
                        {user.jobTitle}
                      </p>
                    </div>
                  )}
                  {user.department && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Department
                      </label>
                      <p className="text-gray-900">{user.department}</p>
                    </div>
                  )}
                  {formatDate(user.startDate) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Start Date
                      </label>
                      <p className="text-gray-900">
                        {formatDate(user.startDate)}
                      </p>
                    </div>
                  )}
                  {user.reportsTo && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Reports To
                      </label>
                      <p className="text-gray-900">{user.reportsTo.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Organization Information */}
            {user.organizationData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <span>Organization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.organizationData.name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Organization Name
                      </label>
                      <p className="text-gray-900 font-medium">
                        {user.organizationData.name}
                      </p>
                    </div>
                  )}
                  {user.organizationData.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Address
                      </label>
                      <p className="text-gray-900">
                        {user.organizationData.address}
                      </p>
                    </div>
                  )}
                  {user.organizationData.city &&
                    user.organizationData.state &&
                    user.organizationData.country && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Location
                        </label>
                        <p className="text-gray-900">
                          {user.organizationData.city},{" "}
                          {user.organizationData.state},{" "}
                          {user.organizationData.country}
                        </p>
                      </div>
                    )}
                  {user.organizationData.logo && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Logo
                      </label>
                      <img
                        src={user.organizationData.logo}
                        alt="Organization Logo"
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Leave Information - Only show if not client or admin */}
            {!isClientOrAdmin && user.leaves && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-red-600" />
                    <span>Leave Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Casual</p>
                      <p className="text-xl font-bold text-blue-600">
                        {user.leaves.casual}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Sick</p>
                      <p className="text-xl font-bold text-green-600">
                        {user.leaves.sick}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Annual</p>
                      <p className="text-xl font-bold text-purple-600">
                        {user.leaves.annual}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Other</p>
                      <p className="text-xl font-bold text-orange-600">
                        {user.leaves.other}
                      </p>
                    </div>
                  </div>
                  {formatDate(user.leaves.expiryDate) && (
                    <div className="mt-4 pt-4 border-t">
                      <label className="text-sm font-medium text-gray-500">
                        Expiry Date
                      </label>
                      <p className="text-gray-900">
                        {formatDate(user.leaves.expiryDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* System Information */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-gray-600" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {formatDate(user.createdAt) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Created
                    </label>
                    <p className="text-gray-900">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                )}
                {formatDate(user.updatedAt) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </label>
                    <p className="text-gray-900">
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                )}
                {user.organizationType && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Organization Type
                    </label>
                    <p className="text-gray-900 capitalize">
                      {user.organizationType}
                    </p>
                  </div>
                )}
                {user.id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      User ID
                    </label>
                    <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserViewDialog;
