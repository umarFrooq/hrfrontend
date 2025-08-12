import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { useRequestActionMutation } from "@/store/api/requestsApi";
import { toast } from "sonner";

// Zod schema for form validation
const rejectionSchema = z.object({
  comments: z
    .string()
    .min(1, "Please provide a reason for rejection")
    .min(5, "Comments must be at least 5 characters long")
    .max(250, "Comments must not exceed 250 characters"),
});

// Rejection Form Component
const RejectionForm = ({ request, handleClose }) => {
  const [requestAction, { isLoading }] = useRequestActionMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    resolver: zodResolver(rejectionSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      await requestAction({
        id: request.id,
        approvalFlow: {
          status: "rejected",
          comments: data.comments.trim(),
        },
      });
      toast.success("Request rejected");
      reset();
      handleClose();
    } catch (error) {
      toast.error(
        `Failed to reject request: ${error?.data?.message || error.message}`
      );
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rejection-comments">Reason for rejection *</Label>
          <Textarea
            id="rejection-comments"
            placeholder="Please provide a reason for rejecting this request..."
            {...register("comments")}
            rows={3}
            disabled={isLoading}
            className={errors.comments ? "border-red-500" : ""}
          />
          {errors.comments && (
            <p className="text-sm text-red-500">{errors.comments.message}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            variant="destructive"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
};

export default RejectionForm;
