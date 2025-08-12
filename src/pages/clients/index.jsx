import { Button } from "@/components/ui/button";
import {
  useDeleteUserMutation,
  useGetAllUsersQuery,
} from "@/store/api/usersApi";
import { Edit, Trash2, User, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getParsedUserRoles } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";
import { roles, scope } from "@/utils/constant";
import { toast } from "sonner";
import OrganizationDropdownFilter from "@/components/OrganizationDropdownFilter";
import { useSelector, useDispatch } from "react-redux";
import React, { useEffect } from "react";
import DataTableSearch from "@/components/DataTableSearch";
import DepartmentDropdownFilter from "@/components/DepartmentDropdownFilter";
import RoleDropdownFilter from "@/components/RoleDropdownFilter";
import { hasPermission } from "@/utils/permission";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useGetAllClientsQuery } from "@/store/api/clientsApi";
import { useDeleteClientMutation } from "@/store/api/clientsApi";
import { formatDate } from "date-fns";
import { clientsApi } from "@/store/api/clientsApi";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const recordsLimit = 20; // You can adjust this or make it configurable

function Clients() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const permissions = useSelector((state) => state.auth.permissions);
  const { queryParams, setQueryParams } = useQueryParams();

  // Get page from query params, default to 1 if not present
  const currentPage = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || recordsLimit;

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetAllClientsQuery({
      ...queryParams,
      page: currentPage,
      limit,
      sortBy: "-createdAt",
    });
  const [deleteClient, { isLoading: deleteLoading }] =
    useDeleteClientMutation();

  // Reset clients API state when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clientsApi.util.resetApiState());
    };
  }, [dispatch]);

  // Handle page change
  const handlePageChange = (page) => {
    setQueryParams({ ...queryParams, page: page.toString() });
  };

  // Calculate pagination info
  const totalPages = data?.totalPages || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteClient(userId).unwrap();
      toast.success("Client deleted successfully!");
      refetch();
    } catch (err) {
      toast.error(
        error?.data?.message ||
          "Failed to delete client. Please try again later."
      );
    }
  };

  const handleAddUser = () => {
    navigate("/clients/add");
  };

  const handleEditUser = (userId) => {
    navigate(`/clients/edit/${userId}`);
  };

  const canAddUser = hasPermission(permissions, "users", "create", [
    scope.ORGANIZATION,
    scope.TEAM,
  ]);
  const canEditUser = hasPermission(permissions, "users", "update", [
    scope.ORGANIZATION,
    scope.TEAM,
  ]);
  const canDeleteUser = hasPermission(permissions, "users", "delete", [
    scope.ORGANIZATION,
    scope.TEAM,
  ]);

  return (
    <div className="">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center space-x-3">
            <User className="h-8 w-8 text-primary" />
            <span>Clients</span>
          </h1>
          <p className="text-gray-600">Manage clients and their details</p>
        </div>

        {canAddUser && (
          <Button
            onClick={handleAddUser}
            className="flex items-center space-x-2"
            disabled={isLoading}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Client</span>
          </Button>
        )}
      </div>

      {/* Filters Row: Search left, filters right */}
      <div className="mb-6 flex w-full items-center justify-between gap-4">
        {/* User Search (left) */}
        <div className="flex-1 max-w-xs">
          <DataTableSearch
            placeholder="Search clients by name"
            searchKey="firstName"
          />
        </div>
        {/* Other filters (right) */}
        <OrganizationDropdownFilter
          searchKey="organization"
          placeholder="Select Organization"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="text-center p-6">
              <p className="text-red-600 font-medium">
                Failed to fetch clients.
              </p>
              <p className="text-gray-600 mb-4">
                {error?.data?.message ||
                  "An unexpected error occurred. Please try again."}
              </p>
              <Button onClick={refetch}>Retry</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>On-Board Date</TableHead>
                    <TableHead>Organization</TableHead>
                    {(canEditUser || canDeleteUser) && (
                      <TableHead>Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading || isFetching ? (
                    <ClientsTableSkeleton />
                  ) : (
                    data?.results?.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium min-w-[150px] max-w-[250px] truncate whitespace-nowrap overflow-hidden text-ellipsis">
                          {client.firstName ?? ""} {client?.lastName ?? ""}
                        </TableCell>
                        <TableCell className="min-w-[150px] max-w-[250px] truncate whitespace-nowrap overflow-hidden text-ellipsis">
                          {client?.email ?? "N/A"}
                        </TableCell>
                        <TableCell className="min-w-[150px] max-w-[250px] truncate whitespace-nowrap overflow-hidden text-ellipsis">
                          {client?.phone ?? "N/A"}
                        </TableCell>
                        <TableCell className="min-w-[150px] max-w-[250px] truncate whitespace-nowrap overflow-hidden text-ellipsis">
                          {client?.startDate
                            ? formatDate(client?.startDate, "MMM d, yyyy")
                            : ""}
                        </TableCell>
                        <TableCell className="min-w-[150px] max-w-[250px] truncate whitespace-nowrap overflow-hidden text-ellipsis">
                          {client?.organization?.name ?? "N/A"}
                        </TableCell>
                        {(canEditUser || canDeleteUser) && (
                          <TableCell>
                            {client?.role !== roles.SUPER_ADMIN && (
                              <div className="flex items-center space-x-2">
                                {canEditUser && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(client.id)}
                                    className="flex items-center space-x-1"
                                    disabled={isFetching}
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span>Edit</span>
                                  </Button>
                                )}
                                {canDeleteUser && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        disabled={isFetching}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Delete</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you sure you want to delete this
                                          client?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This
                                          will permanently delete the client "
                                          {client.firstName} {client?.lastName}"
                                          and remove all their data from the
                                          system.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteUser(client.id)
                                          }
                                          className="bg-red-600 hover:bg-red-700"
                                          disabled={deleteLoading}
                                        >
                                          {deleteLoading
                                            ? "Deleting..."
                                            : "Yes, Delete Client"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading &&
            !isError &&
            data?.results &&
            data?.results?.length > 0 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          hasPrevPage && handlePageChange(currentPage - 1)
                        }
                        className={
                          !hasPrevPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          hasNextPage && handlePageChange(currentPage + 1)
                        }
                        className={
                          !hasNextPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Clients;

const ClientsTableSkeleton = () => (
  <>
    {[...Array(10)].map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-16 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);
