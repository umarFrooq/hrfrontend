import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { useChangePasswordMutation } from "@/store/api/usersApi";
import { toast } from "sonner";
import { CardDescription, CardHeader, CardTitle } from "../ui/card";

// Zod schema for password change validation
const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "Current password is required")
      .max(50, "Password is too long"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(50, "Password is too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password cannot be the same as current password",
    path: ["newPassword"],
  });

const ChangePasswordForm = ({ onSuccess }) => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  // Reset form when component unmounts or when onCancel is called
  React.useEffect(() => {
    return () => {
      reset();
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    reset,
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      await changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      }).unwrap();

      toast.success("Password changed successfully");
      reset();
      // Return to profile view after successful password change
      onSuccess?.();
    } catch (error) {
      // Handle password change errors
      if (error?.data?.message) {
        setError("root", {
          type: "manual",
          message: error.data.message,
        });
      } else if (error?.message) {
        setError("root", {
          type: "manual",
          message: error.message,
        });
      } else {
        setError("root", {
          type: "manual",
          message: "Failed to change password. Please try again.",
        });
      }
    }
  };

  const handlePasswordChange = (field, e) => {
    const value = e.target.value;
    if (value.length > 50) {
      setError(field, {
        type: "manual",
        message: "Password is too long",
      });
    } else {
      clearErrors(field);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password Field */}
        <div className="space-y-2">
          <Label htmlFor="oldPassword">Current Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="oldPassword"
              type={showOldPassword ? "text" : "password"}
              placeholder="Enter your current password"
              className={`pl-10 pr-10 h-12 focus:ring-primary focus:border-primary ${
                errors.oldPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              {...register("oldPassword")}
              onChange={(e) => {
                register("oldPassword").onChange(e);
                handlePasswordChange("oldPassword", e);
              }}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showOldPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.oldPassword && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.oldPassword.message}
            </p>
          )}
        </div>

        {/* New Password Field */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter your new password"
              className={`pl-10 pr-10 h-12 focus:ring-primary focus:border-primary ${
                errors.newPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              {...register("newPassword")}
              onChange={(e) => {
                register("newPassword").onChange(e);
                handlePasswordChange("newPassword", e);
              }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm New Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              className={`pl-10 pr-10 h-12 focus:ring-primary focus:border-primary ${
                errors.confirmPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              {...register("confirmPassword")}
              onChange={(e) => {
                register("confirmPassword").onChange(e);
                handlePasswordChange("confirmPassword", e);
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Root Error Message */}
        {errors.root && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.root.message}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="w-full h-12"
            disabled={isLoading || isSubmitting || !isValid || !isDirty}
          >
            {isLoading || isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : null}
            {isLoading || isSubmitting
              ? "Changing Password..."
              : "Change Password"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
