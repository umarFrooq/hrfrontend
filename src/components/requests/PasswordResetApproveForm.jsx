import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { useRequestActionMutation } from "@/store/api/requestsApi";
import { useChangeUserPasswordMutation } from "@/store/api/usersApi";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// Zod schema for form validation
const passwordResetSchema = z.object({
  comments: z
    .string()
    .optional()
    .refine((val) => !val || val.length <= 250, {
      message: "Comments must not exceed 250 characters",
    }),
  newPassword: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one capital letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .max(20, "Password must not exceed 20 characters"),
});

const PasswordResetApproveForm = ({ request, handleClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [requestAction, { isLoading: isRequestActionLoading }] =
    useRequestActionMutation();
  const [changeUserPassword, { isLoading: isChangingPassword }] =
    useChangeUserPasswordMutation();
  const isLoading = isRequestActionLoading || isChangingPassword;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(passwordResetSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("newPassword");

  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
  };

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
      await changeUserPassword({
        userId: request.requestedBy?.id,
        newPassword: data.newPassword.trim(),
      });
      toast.success(
        "Password reset approved and new password set successfully"
      );
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
          <Label htmlFor="password-comments">Comments (optional)</Label>
          <Textarea
            id="password-comments"
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

        <div className="grid gap-2">
          <Label htmlFor="newPassword">New Password *</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              {...register("newPassword")}
              disabled={isLoading}
              className={`pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={handlePasswordToggle}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            This password will be set for the user who requested the reset.
          </p>

          {/* Password requirements indicator */}
          {watchedPassword && (
            <div className="text-xs space-y-1">
              <p className="font-medium text-gray-700">
                Password requirements:
              </p>
              <div className="space-y-1">
                <div
                  className={`flex items-center gap-1 ${
                    watchedPassword.length >= 8
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <span>✓</span>
                  <span>At least 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    /[A-Z]/.test(watchedPassword)
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <span>✓</span>
                  <span>One capital letter</span>
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    /[a-z]/.test(watchedPassword)
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <span>✓</span>
                  <span>One lowercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    /[0-9]/.test(watchedPassword)
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <span>✓</span>
                  <span>One number</span>
                </div>
              </div>
            </div>
          )}
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

export default PasswordResetApproveForm;
