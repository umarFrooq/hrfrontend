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
const wfhApproveSchema = z.object({
  comments: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 250, {
      message: "Comments must not exceed 250 characters",
    }),
});

const WfhApproveForm = ({ request, handleClose }) => {
  const [requestAction, { isLoading }] = useRequestActionMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    resolver: zodResolver(wfhApproveSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
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
      toast.success("Request approved");
      reset();
      handleClose();
    } catch (error) {
      toast.error(
        `Failed to approve request: ${error?.data?.message || error.message}`
      );
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="wfh-comments">Comments (optional)</Label>
          <Textarea
            id="wfh-comments"
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

        <DialogFooter>
          <Button type="submit" disabled={isLoading} variant="default">
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
};

export default WfhApproveForm;
