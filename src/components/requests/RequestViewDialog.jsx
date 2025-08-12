import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Building,
  FileText,
  Download,
  ExternalLink,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { requestTypes } from "@/utils/constant";

const RequestViewDialog = ({ request }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

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

  const getRequestTypeLabel = (type) => {
    const requestType = requestTypes.find((rt) => rt.value === type);
    return requestType ? requestType.label : type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderWFHDetails = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            WFH Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Check-in Date
              </label>
              <p className="text-sm text-slate-800">
                {formatDateOnly(request.checkinDate)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Priority
              </label>
              <div className="mt-1">{getPriorityBadge(request.priority)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDocumentDetails = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Priority
              </label>
              <div className="mt-1">{getPriorityBadge(request.priority)}</div>
            </div>
            {request.documents && request.documents.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Attached Documents
                </label>
                <div className="mt-2 space-y-2">
                  {request.documents.map((doc, index) => (
                    <div
                      key={doc.id || index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{doc.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url, "_blank")}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResetPasswordDetails = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Password Reset Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Priority
              </label>
              <div className="mt-1">{getPriorityBadge(request.priority)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRequestTypeDetails = () => {
    switch (request.type) {
      case "wfh":
        return renderWFHDetails();
      case "document":
        return renderDocumentDetails();
      case "resetPassword":
        return renderResetPasswordDetails();
      default:
        return null;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="flex items-center gap-2"
      >
        <Eye className="h-4 w-4" />
        View
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          !open && handleClose();
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Request Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this{" "}
              {getRequestTypeLabel(request.type)} request
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Request ID
                    </label>
                    <p className="text-sm font-mono text-slate-800">
                      {request.requestId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Type
                    </label>
                    <p className="text-sm text-slate-800">
                      {getRequestTypeLabel(request.type)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Title
                    </label>
                    <p className="text-sm text-slate-800">{request.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Status
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(request.approvalFlow?.status)}
                      <span className="text-sm font-medium capitalize">
                        {request.approvalFlow?.status || "pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Description
                  </label>
                  <p className="text-sm text-slate-800 mt-1">
                    {request.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Request Type Specific Details */}
            {renderRequestTypeDetails()}

            {/* Requester Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Requester Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Name
                    </label>
                    <p className="text-sm text-slate-800">
                      {request.requestedBy?.firstName}{" "}
                      {request.requestedBy?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Department
                    </label>
                    <p className="text-sm text-slate-800 capitalize">
                      {request.requestedBy?.department
                        ?.replace(/([A-Z])/g, " $1")
                        .trim()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Job Title
                    </label>
                    <p className="text-sm text-slate-800">
                      {request.requestedBy?.jobTitle}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Organization
                    </label>
                    <p className="text-sm text-slate-800">
                      {request.organization?.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Information */}
            {request.approvalFlow && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Approval Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Approver
                      </label>
                      <p className="text-sm text-slate-800">
                        {request.approvalFlow.approver?.firstName}{" "}
                        {request.approvalFlow.approver?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Role
                      </label>
                      <p className="text-sm text-slate-800 capitalize">
                        {request.approvalFlow.approver?.role}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Action Date
                      </label>
                      <p className="text-sm text-slate-800">
                        {formatDate(request.approvalFlow.actionDate)}
                      </p>
                    </div>
                    {request.approvalFlow.comments && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-slate-600">
                          Comments
                        </label>
                        <p className="text-sm text-slate-800 mt-1">
                          {request.approvalFlow.comments}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timestamps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Created At
                    </label>
                    <p className="text-sm text-slate-800">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Updated At
                    </label>
                    <p className="text-sm text-slate-800">
                      {formatDate(request.updatedAt)}
                    </p>
                  </div>
                  {request.completedAt && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">
                        Completed At
                      </label>
                      <p className="text-sm text-slate-800">
                        {formatDate(request.completedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestViewDialog;
