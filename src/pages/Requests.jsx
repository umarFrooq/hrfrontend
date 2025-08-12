import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useQueryParams } from "@/hooks/useQueryParams";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Button } from "@/components/ui/button";
import {
  useGetAllRequestsQuery,
  useDeleteRequestMutation,
} from "@/store/api/requestsApi";
import RequestForm from "@/components/requests/RequestForm";
import UpdateRequestDialog from "@/components/requests/UpdateRequestDialog";
import RequestViewDialog from "@/components/requests/RequestViewDialog";
import { useSelector } from "react-redux";
import { hasPermission } from "@/utils/permission";
import { roles, scope, requestTypes } from "@/utils/constant";
import { toast } from "sonner";

const recordsLimit = 20; // You can adjust this or make it configurable

const Requests = () => {
  const { queryParams, setQueryParams } = useQueryParams();
  const permissions = useSelector((state) => state.auth.permissions);
  const user = useSelector((state) => state.auth.user);
  const currentUser = useSelector((state) => state.auth?.user);

  // Check if user has "own" permission for requests
  const isEmployee =
    user?.role === roles.EMPLOYEE || user?.role === roles.CLIENT;

  // Get page from query params, default to 1 if not present
  const currentPage = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || recordsLimit;

  // Fetch requests from API
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = useGetAllRequestsQuery(
    {
      page: currentPage,
      limit,
      sortBy: "-createdAt",
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  // Delete request mutation
  const [deleteRequest, { isLoading: deleteLoading }] =
    useDeleteRequestMutation();

  // Check if user has organization or team permissions for requests
  const canUpdateRequest = hasPermission(permissions, "requests", "update", [
    scope.ORGANIZATION,
    scope.TEAM,
  ]);

  // Check if user has delete permission for requests
  const canDeleteRequest = hasPermission(permissions, "requests", "delete", [
    scope.ANY,
  ]);

  const requests = requestsData?.results || [];
  const totalResults = requestsData?.totalResults || 0;
  const totalPages = requestsData?.totalPages || 0;

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatRequestType = (type) => {
    if (type === "wfh") {
      return "WFH";
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handlePageChange = (page) => {
    setQueryParams({ page: page.toString() });
  };

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

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

  const handleDeleteRequest = async (requestId) => {
    try {
      await deleteRequest(requestId).unwrap();
      toast.success("Request deleted successfully!");
      refetch();
    } catch (err) {
      toast.error(
        err?.message || "Failed to delete request. Please try again later."
      );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Requests</h1>
          <p className="text-slate-500 mt-1">
            Submit and track your work requests
          </p>
        </div>
        <RequestForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Track the status of your submitted requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-slate-600">Loading requests...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Error loading requests. Please try again.
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              No requests found.
            </div>
          ) : (
            <>
              <div className="rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      {!isEmployee && <TableHead>Requested By</TableHead>}
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.requestId}
                        </TableCell>
                        <TableCell className="font-medium">
                          {request.title}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {
                                requestTypes.find(
                                  (type) => type?.value === request?.type
                                )?.label
                              }
                            </div>
                            {/* {request.subType && (
                              <div className="text-sm text-slate-500 capitalize">
                                {request.subType}
                              </div>
                            )} */}
                          </div>
                        </TableCell>
                        {!isEmployee && (
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {request.requestedBy?.firstName}{" "}
                                {request.requestedBy?.lastName}
                              </div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          {getPriorityBadge(request.priority)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(request.approvalFlow?.status)}
                            <span className="text-sm font-medium capitalize">
                              {request.approvalFlow?.status || "pending"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <RequestViewDialog request={request} />
                            {canUpdateRequest &&
                              currentUser?.id !== request?.requestedBy?.id && (
                                <UpdateRequestDialog
                                  request={request}
                                  canUpdate={canUpdateRequest}
                                />
                              )}
                            {(canDeleteRequest ||
                              request.requestedBy?.id === user?.id) &&
                              request.approvalFlow?.status === "pending" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      disabled={deleteLoading}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Delete</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you sure you want to delete this
                                        request?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete the request "
                                        {request.title}" and remove all its data
                                        from the system.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteRequest(request.id)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={deleteLoading}
                                      >
                                        {deleteLoading
                                          ? "Deleting..."
                                          : "Yes, Delete Request"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalResults > 0 && (
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Requests;
