import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import {
  useRequestActionMutation,
  useUploadRequestDocumentsMutation,
} from "@/store/api/requestsApi";
import { toast } from "sonner";
import { Upload } from "lucide-react";

// Zod schema for form validation
const documentApproveSchema = z.object({
  comments: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 250, {
      message: "Comments must not exceed 250 characters",
    }),
  documents: z
    .array(
      z.object({
        file: z.instanceof(File, { message: "File is required" }),
        customName: z
          .string()
          .optional()
          .refine((val) => !val || (val.length >= 3 && val.length <= 50), {
            message:
              "Custom name must be between 3 and 50 characters if provided",
          }),
      })
    )
    .min(1, "At least one document is required")
    .refine((documents) => documents.every((doc) => doc.file), {
      message: "All documents must have a file selected",
    }),
});

const DocumentApproveForm = ({ request, handleClose }) => {
  const [requestAction, { isLoading: isRequestActionLoading }] =
    useRequestActionMutation();
  const [uploadDocuments, { isLoading: isUploadingDocuments }] =
    useUploadRequestDocumentsMutation();

  const isLoading = isRequestActionLoading || isUploadingDocuments;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(documentApproveSchema),
    mode: "onChange",
    defaultValues: {
      comments: "",
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents",
  });

  const watchedDocuments = watch("documents");

  const handleFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      // Set the file
      setValue(`documents.${index}.file`, file);

      // Trigger validation for this field
      trigger(`documents.${index}`);
    }
  };

  const addDocumentItem = () => {
    append({ file: null, customName: "" });
  };

  const removeDocumentItem = (index) => {
    remove(index);
  };

  const onSubmit = async (data) => {
    // Validate that all documents have files
    const validDocuments = data.documents.filter((doc) => doc.file);

    if (validDocuments.length === 0) {
      return; // Let the form validation handle the error display
    }

    const approvalFlow = {
      status: "approved",
    };
    if (data.comments?.trim()) {
      approvalFlow.comments = data.comments.trim();
    }
    try {
      await requestAction({
        id: request.id,
        approvalFlow,
      });
      const promises = [];
      validDocuments.forEach((item) => {
        if (item.file) {
          const formData = new FormData();
          formData.append(`files`, item.file);
          if (item.customName?.trim()) {
            formData.append(`customNames[]`, item.customName.trim());
          } else {
            formData.append(`customNames[]`, item.file.name);
          }
          promises.push(
            uploadDocuments({
              id: request.id,
              formData,
            })
          );
        }
      });
      // Then upload the documents
      await Promise.all(promises);
      toast.success("Documents approved and uploaded successfully");
      reset();
      handleClose();
    } catch (error) {
      toast.error(
        `Failed to approve documents: ${error?.data?.message || error.message}`
      );
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="document-comments">Comments (optional)</Label>
          <Textarea
            id="document-comments"
            placeholder="Add any comments about this approval..."
            {...register("comments")}
            rows={3}
            disabled={isLoading}
            className={errors.comments ? "border-red-500" : ""}
          />
          {errors.comments && (
            <p className="text-sm text-red-500">{errors.comments.message}</p>
          )}
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Documents *</Label>
            <p className="text-xs text-muted-foreground">
              Add documents one by one with custom names
            </p>

            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Document {index + 1}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDocumentItem(index)}
                    disabled={isLoading}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid gap-2">
                  <div>
                    <Label htmlFor={`file-${index}`}>Select File *</Label>
                    <Input
                      id={`file-${index}`}
                      type="file"
                      onChange={(e) => handleFileChange(index, e)}
                      disabled={isLoading}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      className={
                        errors.documents?.[index]?.file ? "border-red-500" : ""
                      }
                    />
                    {watchedDocuments[index]?.file && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {watchedDocuments[index].file.name}
                      </p>
                    )}
                    {errors.documents?.[index]?.file && (
                      <p className="text-sm text-red-500">
                        {errors.documents[index].file.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`name-${index}`}>
                      Custom Name (optional)
                    </Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="Enter document name (optional)"
                      {...register(`documents.${index}.customName`)}
                      disabled={isLoading}
                      className={
                        errors.documents?.[index]?.customName
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors.documents?.[index]?.customName && (
                      <p className="text-sm text-red-500">
                        {errors.documents[index].customName.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No documents added yet. Click "Add Document" to get started.
              </div>
            )}

            {errors.documents && !Array.isArray(errors.documents) && (
              <p className="text-sm text-red-500">{errors.documents.message}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDocumentItem}
              disabled={isLoading}
              className="w-fit"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            variant="default"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
};

export default DocumentApproveForm;
