import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, CheckCircle, XCircle } from "lucide-react";
import { requestTypes } from "@/utils/constant";
import RejectionForm from "./RejectionForm";
import WfhApproveForm from "./WFHApproveForm";
import DocumentApproveForm from "./DocumentApproveForm";
import PasswordResetApproveForm from "./PasswordResetApproveForm";
import { useSelector } from "react-redux";
import { toast } from "sonner";

// Document Approval Form Component

const UpdateRequestDialog = ({ request, canUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const currentUser = useSelector((state) => state.auth?.user);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedAction(null);
  };

  const handleActionSelect = (action) => {
    setSelectedAction(() => action);
  };

  const getRequestTypeLabel = (type) => {
    const requestType = requestTypes.find((rt) => rt.value === type);
    return requestType ? requestType.label : type;
  };

  // Only render if user has permission and request is pending
  if (
    !canUpdate ||
    request.approvalFlow?.status !== "pending" ||
    currentUser?.id === request.requestedBy?.id
  ) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="flex items-center gap-2"
      >
        <Edit className="h-4 w-4" />
        Update
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          !open && handleClose();
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Request</DialogTitle>
            <DialogDescription>
              {selectedAction
                ? `${
                    selectedAction === "approve" ? "Approve" : "Reject"
                  } the ${getRequestTypeLabel(request.type)} request`
                : `Select an action for the ${getRequestTypeLabel(
                    request.type
                  )} request`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={selectedAction === "approve" ? "default" : "outline"}
                onClick={() => handleActionSelect("approve")}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant={
                  selectedAction === "reject" ? "destructive" : "outline"
                }
                onClick={() => handleActionSelect("reject")}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
          {!selectedAction ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose()}>
                Close
              </Button>
            </DialogFooter>
          ) : null}
          {selectedAction === "reject" && (
            <RejectionForm request={request} handleClose={handleClose} />
          )}
          {selectedAction === "approve" && request.type === "wfh" && (
            <WfhApproveForm request={request} handleClose={handleClose} />
          )}
          {selectedAction === "approve" && request.type === "document" && (
            <DocumentApproveForm request={request} handleClose={handleClose} />
          )}
          {selectedAction === "approve" && request.type === "resetPassword" && (
            <PasswordResetApproveForm
              request={request}
              handleClose={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateRequestDialog;
