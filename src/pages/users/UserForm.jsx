import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { useGetUserByIdQuery } from "@/store/api/usersApi";
import { roles } from "@/utils/constant";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { format } from "date-fns";
import UserFormFields from "./UserFormFields";
import UserDocumentSection from "./UserDocumentSection";

const getAvailableRoles = (currentUserRole) => {
  const allRoles = [
    roles.ADMIN,
    roles.HR,
    roles.MANAGER,
    roles.EMPLOYEE,
    roles.CLIENT,
  ];
  switch (currentUserRole) {
    case roles.SUPER_ADMIN:
      return allRoles.filter((r) => r !== roles.CLIENT && r !== roles.MANAGER);
    case roles.ADMIN:
      return allRoles.filter(
        (r) => r !== roles.ADMIN && r !== roles.CLIENT && r !== roles.MANAGER
      );
    case roles.HR:
      return allRoles.filter(
        (r) =>
          r !== roles.ADMIN &&
          r !== roles.HR &&
          r !== roles.CLIENT &&
          r !== roles.MANAGER
      );
    case roles.MANAGER:
      return allRoles.filter(
        (r) =>
          r !== roles.ADMIN &&
          r !== roles.HR &&
          r !== roles.MANAGER &&
          r !== roles.CLIENT
      );
    case roles.CLIENT:
      return allRoles.filter((r) => r === roles.EMPLOYEE);
    default:
      return [];
  }
};

const UserForm = () => {
  const { id } = useParams();
  const currentUserRole = useSelector((state) => state.auth?.user?.role);
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useGetUserByIdQuery(id, {
    skip: !id, // prevents query when adding new user
  });

  const [documents, setDocuments] = useState(user?.documents || []);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Failed to fetch user. Please try again.");
    }
  }, [isError, error]);

  useEffect(() => {
    if (user) {
      setFormData(user);
      setDocuments(user?.documents || []);
    }
  }, [user]);

  const canManageDocs =
    [
      roles.SUPER_ADMIN,
      roles.ADMIN,
      roles.HR,
      roles.MANAGER,
      roles.CLIENT,
    ].includes(currentUserRole) && !!id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-800 flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <span>User Details</span>
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Update user information, role assignments, and other details as
            needed.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <UserFormFields
            userData={formData}
            currentUserRole={currentUserRole}
            getAvailableRoles={getAvailableRoles}
          />
        </CardContent>
      </Card>
      {/* Document Management Section */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="pt-0">
          <UserDocumentSection
            userId={id}
            documents={documents}
            setDocuments={setDocuments}
            canManageDocs={canManageDocs}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserForm;
