import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetLeavesQuery,
  useUpdateLeaveStatusMutation,
  useDeleteLeaveMutation,
} from "@/store/api/leavesApi";
import { leaveStatus, roles, scope } from "@/utils/constant";
import { hasPermission } from "@/utils/permission";
import { useSelector } from "react-redux";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { getDepartmentLabel } from "@/utils/helpers";
import { AlertTriangle, Calendar, Edit, Trash2, Eye } from "lucide-react";
import AddLeave from "@/components/leaves/AddLeave";
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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Zod validation schema for update leave status
const updateLeaveStatusSchema = z
  .object({
    status: z
      .string({
        required_error: "Status is required",
      })
      .min(1, "Status is required"),
    reason: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value) return true; // Optional field
          const wordCount = value
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
          return wordCount >= 5;
        },
        {
          message: "Reason must be at least 5 words",
        }
      )
      .refine(
        (value) => {
          if (!value) return true; // Optional field
          const wordCount = value
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
          return wordCount <= 250;
        },
        {
          message: "Reason must be at most 250 words",
        }
      ),
  })
  .refine(
    (data) => {
      if (data.status === leaveStatus.REJECTED) {
        return data.reason && data.reason.trim().length > 0;
      }
      return true;
    },
    {
      message: "Reason is required when rejecting a leave",
      path: ["reason"],
    }
  );

const statusColor = {
  [leaveStatus.PENDING]: "default",
  [leaveStatus.APPROVED]: "secondary",
  [leaveStatus.REJECTED]: "destructive",
};

const recordsLimit = 20; // You can adjust this or make it configurable

function LeaveManagement() {
  const { queryParams, setQueryParams } = useQueryParams();

  // Get page from query params, default to 1 if not present
  const currentPage = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || recordsLimit;

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetLeavesQuery({
      ...queryParams,
      page: currentPage,
      limit,
      sortBy: "-createdAt",
    });
  const permissions = useSelector((state) => state.auth.permissions);
  const currentUser = useSelector((state) => state.auth?.user);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedLeaveForReason, setSelectedLeaveForReason] = useState(null);
  const [updateLeaveStatus, { isLoading: updateLoading }] =
    useUpdateLeaveStatusMutation();
  const [deleteLeave, { isLoading: deleteLoading }] = useDeleteLeaveMutation();
  const role = useSelector((state) => state.auth?.user?.role);

  // React Hook Form for update status
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
    control,
    clearErrors,
  } = useForm({
    resolver: zodResolver(updateLeaveStatusSchema),
    mode: "onChange",
    defaultValues: {
      status: "",
      reason: "",
    },
  });

  const watchedValues = watch();
  const [hasChanges, setHasChanges] = useState(false);

  // Check for changes
  useEffect(() => {
    const subscription = watch((currentValues) => {
      const hasFormChanges = Object.keys(currentValues).some(
        (key) => currentValues[key] !== "" && currentValues[key] !== undefined
      );
      setHasChanges(hasFormChanges);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Handle page change
  const handlePageChange = (page) => {
    setQueryParams({ ...queryParams, page: page.toString() });
  };

  // Calculate pagination info
  const totalPages = data?.totalPages || 1;
  const totalResults = data?.total || 0;
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

  const getWordCount = (text) => {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const handleOpenDialog = (leave) => {
    if (leave) {
      setSelectedLeave(leave);
      reset({
        status: "",
        reason: "",
      });
      setHasChanges(false);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      reset({
        status: "",
        reason: "",
      });
      setHasChanges(false);
    }
  };

  const handleUpdateStatus = async (formData) => {
    try {
      const data = {};
      data.status = formData.status;
      if (formData.reason) data.reply = formData.reason;
      await updateLeaveStatus({ id: selectedLeave.id, ...data }).unwrap();
      toast.success("Leave status updated!");
      setIsOpen(false);
      reset({
        status: "",
        reason: "",
      });
      setSelectedLeave(null);
      setHasChanges(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLeave(id);
      toast.success("Leave has been deleted");
      refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleOpenReasonDialog = (leave) => {
    setSelectedLeaveForReason(leave);
    setReasonDialogOpen(true);
  };

  // Component to render truncated reason text
  const ReasonCell = ({ reason }) => {
    if (!reason)
      return <span className="text-gray-400">No reason provided</span>;

    return (
      <div
        className="line-clamp-2 text-sm text-gray-700"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          lineHeight: "1.5rem",
          maxHeight: "3rem",
        }}
      >
        {reason}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-primary" />
            <span>Leaves</span>
          </h1>
          {role === roles.EMPLOYEE ? null : (
            <p className="text-gray-600">
              Manage leave requests and update their status
            </p>
          )}
        </div>

        {!(
          role === roles.SUPER_ADMIN ||
          role === roles.ADMIN ||
          role == roles.CLIENT
        ) && <AddLeave />}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="text-center p-6">
              <p className="text-red-600 font-medium">
                Failed to fetch leaves.
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Total Days</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading || isFetching ? (
                    <LeaveTableSkeleton />
                  ) : (
                    data?.results?.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="min-w-[140px]">
                          {leave.user?.firstName} {leave.user?.lastName}
                        </TableCell>
                        <TableCell>{leave.user?.email}</TableCell>
                        <TableCell className="min-w-[175px]">
                          {getDepartmentLabel(leave.user?.department)}
                        </TableCell>
                        <TableCell className="min-w-[110px] capitalize">
                          {leave.leaveType}
                        </TableCell>
                        <TableCell className="min-w-[110px]">
                          {leave.startDate
                            ? format(new Date(leave.startDate), "dd MMM yyyy")
                            : ""}
                        </TableCell>
                        <TableCell className="min-w-[110px]">
                          {leave.endDate
                            ? format(new Date(leave.endDate), "dd MMM yyyy")
                            : ""}
                        </TableCell>
                        <TableCell className="text-center min-w-[100px]">
                          {leave.totalDays}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusColor[leave.status] || "secondary"}
                            className="capitalize"
                          >
                            {leave.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[200px] max-w-[300px]">
                          <ReasonCell
                            reason={
                              leave.status === leaveStatus.REJECTED
                                ? leave.reply
                                : leave.reason
                            }
                          />
                        </TableCell>
                        {(hasPermission(permissions, "leaves", "update", [
                          scope.ORGANIZATION,
                          scope.TEAM,
                        ]) ||
                          hasPermission(
                            permissions,
                            "leaves",
                            "delete",
                            [scope.OWN] && leave.status === leaveStatus.PENDING
                          )) && (
                          <TableCell className="flex items-center justify-end space-x-2">
                            {hasPermission(permissions, "leaves", "update", [
                              scope.ORGANIZATION,
                              scope.TEAM,
                            ]) &&
                              leave?.status === leaveStatus.PENDING &&
                              currentUser?.id !== leave?.user?.id && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenDialog(leave)}
                                  disabled={isFetching}
                                  className="flex items-center space-x-1"
                                  variant="outline"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Update</span>
                                </Button>
                              )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReasonDialog(leave)}
                              disabled={isFetching}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="h-3 w-3 text-black" />
                              <span>View</span>
                            </Button>
                            {hasPermission(permissions, "leaves", "delete") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(leave?.id)}
                                disabled={deleteLoading || updateLoading}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </Button>
                            )}
                            {role !== roles.SUPER_ADMIN &&
                              hasPermission(permissions, "leaves", "delete", [
                                scope.OWN,
                              ]) &&
                              leave?.status === leaveStatus.PENDING && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(leave?.id)}
                                  disabled={deleteLoading || updateLoading}
                                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </Button>
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

      {/* Reason Detail Dialog */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Leave Request Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the leave request
            </DialogDescription>
          </DialogHeader>

          {selectedLeaveForReason && (
            <div className="space-y-6">
              {/* Employee Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Employee Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Name
                    </Label>
                    <p className="text-sm text-gray-900">
                      {selectedLeaveForReason.user?.firstName}{" "}
                      {selectedLeaveForReason.user?.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Email
                    </Label>
                    <p className="text-sm text-gray-900">
                      {selectedLeaveForReason.user?.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Department
                    </Label>
                    <p className="text-sm text-gray-900">
                      {getDepartmentLabel(
                        selectedLeaveForReason.user?.department
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mr-2">
                      Status
                    </Label>
                    <Badge
                      variant={
                        statusColor[selectedLeaveForReason.status] ||
                        "secondary"
                      }
                      className="capitalize"
                    >
                      {selectedLeaveForReason.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Leave Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Leave Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Leave Type
                    </Label>
                    <p className="text-sm text-gray-900 capitalize">
                      {selectedLeaveForReason.leaveType}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Total Days
                    </Label>
                    <p className="text-sm text-gray-900">
                      {selectedLeaveForReason.totalDays}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Start Date
                    </Label>
                    <p className="text-sm text-gray-900">
                      {selectedLeaveForReason.startDate
                        ? format(
                            new Date(selectedLeaveForReason.startDate),
                            "dd MMM yyyy"
                          )
                        : ""}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      End Date
                    </Label>
                    <p className="text-sm text-gray-900">
                      {selectedLeaveForReason.endDate
                        ? format(
                            new Date(selectedLeaveForReason.endDate),
                            "dd MMM yyyy"
                          )
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason Section */}
              {selectedLeaveForReason.reason && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Reason for{" "}
                    {selectedLeaveForReason.status === leaveStatus.REJECTED
                      ? "Rejection"
                      : "Leave"}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedLeaveForReason.status === leaveStatus.REJECTED
                        ? selectedLeaveForReason.reply
                        : selectedLeaveForReason.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Additional Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Created At
                    </Label>
                    <p className="text-sm text-gray-900">
                      {selectedLeaveForReason.createdAt
                        ? format(
                            new Date(selectedLeaveForReason.createdAt),
                            "dd MMM yyyy 'at' h:mm a"
                          )
                        : ""}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Updated At
                    </Label>
                    <p className="text-sm text-gray-900">
                      {selectedLeaveForReason.updatedAt
                        ? format(
                            new Date(selectedLeaveForReason.updatedAt),
                            "dd MMM yyyy 'at' h:mm a"
                          )
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isOpen} onOpenChange={() => handleOpenDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <AlertDialogTitle>Update Leave Status</AlertDialogTitle>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </AlertDialogTitle>
          </AlertDialogHeader>
          <form
            onSubmit={handleSubmit(handleUpdateStatus)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-sm font-medium text-gray-700"
              >
                Status *
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value !== leaveStatus.REJECTED) {
                        setValue("reason", "");
                        clearErrors("reason");
                      }
                    }}
                    value={field.value}
                    disabled={updateLoading}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-11 border-gray-200 capitalize",
                        errors.status && "border-red-500 focus:border-red-500"
                      )}
                    >
                      <SelectValue placeholder="Select Leave Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {Object.values(leaveStatus ?? {}).map((value) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="hover:bg-gray-50 capitalize"
                          disabled={
                            value === field.value ||
                            value === leaveStatus.PENDING
                          }
                        >
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.status.message}
                </p>
              )}
            </div>

            {watchedValues.status === leaveStatus.REJECTED && (
              <div className="space-y-2">
                <Label
                  htmlFor="reason"
                  className="text-sm font-medium text-gray-700"
                >
                  Reason *
                </Label>
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Enter reason for rejection (minimum 15 words, maximum 250 words)"
                        value={field.value}
                        onChange={field.onChange}
                        className={cn(
                          "min-h-[100px]",
                          errors.reason && "border-red-500 focus:border-red-500"
                        )}
                        disabled={updateLoading}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Word count: {getWordCount(field.value)}/250</span>
                      </div>
                    </div>
                  )}
                />
                {errors.reason && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.reason.message}
                  </p>
                )}
              </div>
            )}
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleOpenDialog()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit(handleUpdateStatus)}
              disabled={updateLoading || !isValid || !hasChanges}
            >
              {updateLoading ? "Updating..." : "Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default LeaveManagement;

const LeaveTableSkeleton = () => (
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
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48" />
        </TableCell>
      </TableRow>
    ))}
  </>
);
