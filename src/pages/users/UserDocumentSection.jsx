import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useUploadUserDocumentMutation,
  useDeleteUserDocumentMutation,
} from "@/store/api/usersApi";

const UserDocumentSection = ({
  userId,
  documents = [],
  setDocuments,
  canManageDocs = false,
}) => {
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [uploadUserDocument, { isLoading: isUploading }] =
    useUploadUserDocumentMutation();
  const [deleteUserDocument, { isLoading: isDeleting }] =
    useDeleteUserDocumentMutation();

  const normalizeFileName = (name) => {
    return name.toLowerCase().trim();
  };

  const handleOpenDocDialog = () => {
    setDocName("");
    setDocFile(null);
    setIsDocDialogOpen(true);
  };

  const handleUploadDocument = async () => {
    if (!docName || !docFile) return;

    // Check for duplicate document names (case-insensitive)
    const normalizedNewName = normalizeFileName(docName);
    const isDuplicate = documents.some(
      (doc) => normalizeFileName(doc.name) === normalizedNewName
    );

    if (isDuplicate) {
      toast.error(
        "A document with this name already exists. Please choose a different name."
      );
      return;
    }

    const formData = new FormData();
    formData.append(`customNames[0]`, docName);
    formData.append("files", docFile);

    try {
      const data = await uploadUserDocument({ id: userId, formData }).unwrap();
      toast.success("Document uploaded successfully");
      setIsDocDialogOpen(false);
      setDocName("");
      setDocFile(null);
      setDocuments(() => data?.documents ?? []);
    } catch (err) {
      toast.error("Failed to upload document.");
    }
  };

  const checkDuplicateName = (name) => {
    if (!name.trim()) return false;
    const normalizedName = normalizeFileName(name);
    return documents.some(
      (doc) => normalizeFileName(doc.name) === normalizedName
    );
  };

  const isDuplicateName = checkDuplicateName(docName);

  const handleDeleteDocument = async (docUrl, index) => {
    const formData = new FormData();
    formData.append(`removeFiles[${index}]`, docUrl);
    try {
      const data = await deleteUserDocument({ id: userId, formData }).unwrap();
      toast.success("Document deleted successfully!");
      setDocuments(() => data?.documents ?? []);
    } catch (err) {
      toast.error("Failed to delete document.");
    }
  };

  if (!canManageDocs) {
    return null;
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">User Documents</h3>
        <Button
          type="button"
          onClick={handleOpenDocDialog}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Upload className="h-4 w-4" /> Add Document
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        {documents && documents.length > 0 ? (
          documents.map((doc, idx) => (
            <div
              key={doc.url || idx}
              className="relative border rounded p-3 bg-gray-50 min-w-[180px] max-w-xs flex flex-col items-center"
            >
              <button
                type="button"
                className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                onClick={() => handleDeleteDocument(doc.url, idx)}
                disabled={isDeleting}
                aria-label="Delete document"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="truncate w-full text-center font-medium mb-2">
                {doc.name}
              </div>
              <a
                href={doc.url}
                target="_blank"
                download={doc.name || "document"}
                className="text-blue-600 hover:text-blue-700 underline text-xs break-all"
              >
                Download
              </a>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-sm">No documents uploaded.</div>
        )}
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="docName">Document Name</Label>
              <Input
                id="docName"
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Enter document name"
                className={
                  isDuplicateName ? "border-red-500 focus:border-red-500" : ""
                }
                required
              />
              {isDuplicateName && (
                <p className="text-red-500 text-xs mt-1">
                  A document with this name already exists. Please choose a
                  different name.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="docFile">Select File</Label>
              <Input
                id="docFile"
                type="file"
                onChange={(e) => setDocFile(e.target.files[0])}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDocDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUploadDocument}
              disabled={isUploading || !docName || !docFile || isDuplicateName}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDocumentSection;
