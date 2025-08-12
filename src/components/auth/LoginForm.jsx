import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { login } from "@/store/slices/authSlice";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

// Zod schema for form validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(20, "You have typed too long password. Password can't be this long."),
});

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await dispatch(
        login({ email: data.email, password: data.password })
      ).unwrap();
      navigate("/dashboard");
    } catch (error) {
      // Handle login errors
      if (error?.message) {
        setError("root", {
          type: "manual",
          message: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    if (value.length > 20) {
      setError("password", {
        type: "manual",
        message:
          "You have typed too long password. Password can't be this long.",
      });
    } else {
      clearErrors("password");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className={`pl-10 h-12 focus:ring-primary focus:border-primary ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={`pl-10 pr-10 h-12 focus:ring-primary focus:border-primary ${
                errors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              {...register("password")}
              onChange={(e) => {
                register("password").onChange(e);
                handlePasswordChange(e);
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
              {errors.password.message}
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

        {/* Forgot Password */}
        {/* <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div> */}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12"
          disabled={loading || isSubmitting || !isValid || !isDirty}
        >
          {loading || isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : null}
          {loading || isSubmitting ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </>
  );
};

export default LoginForm;
