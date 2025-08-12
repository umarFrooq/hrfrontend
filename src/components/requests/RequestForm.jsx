import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Send, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCreateRequestMutation } from "@/store/api/requestsApi";
import { roles } from "@/utils/constant";
import { useSelector } from "react-redux";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { normalizeDateTime } from "@/utils/helpers";
import { add } from "date-fns";

// Zod validation schema
const requestFormSchema = z
  .object({
    type: z
      .string({
        required_error: "Request type is required",
      })
      .min(1, "Request type is required"),
    title: z
      .string({
        required_error: "Title is required",
      })
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be at most 100 characters"),
    description: z
      .string({
        required_error: "Description is required",
      })
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description must be at most 500 characters"),
    priority: z
      .string({
        required_error: "Priority is required",
      })
      .min(1, "Priority is required"),
    checkinDate: z.date().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "wfh") {
        return data.checkinDate;
      }
      return true;
    },
    {
      message: "Date is required for WFH requests",
      path: ["checkinDate "],
    }
  );

const initialFormData = {
  type: "",
  title: "",
  description: "",
  priority: "medium",
  checkinDate: undefined,
};

const RequestForm = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [createRequest, { isLoading: isCreating }] = useCreateRequestMutation();
  const user = useSelector((state) => state.auth.user);

  // React Hook Form setup
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
    resolver: zodResolver(requestFormSchema),
    mode: "onChange",
    defaultValues: initialFormData,
  });

  const watchedValues = watch();

  const requestTypes = [
    { value: "document", label: "Document Request" },
    { value: "resetPassword", label: "Password Request" },
    { value: "wfh", label: "Work From Home Request" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const handleFormSubmit = async (data) => {
    try {
      const submitData = {
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        ...(data.type === "wfh" && {
          checkinDate: normalizeDateTime(data.checkinDate),
        }),
      };
      await createRequest(submitData).unwrap();
      setIsFormOpen(false);
      reset(initialFormData);
    } catch (error) {
      console.error("Failed to create request:", error);
    }
  };

  const handleOpenChange = (newOpen) => {
    setIsFormOpen(newOpen);
    if (!newOpen) {
      reset(initialFormData);
    }
  };

  if (![roles.EMPLOYEE, roles.MANAGER, roles.HR].includes(user?.role)) {
    return null;
  }

  return (
    <div>
      {console.log(errors)}
      <Button onClick={() => setIsFormOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Request
      </Button>
      <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit New Request</DialogTitle>
            <DialogDescription>
              Need help with something? Submit a request below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-type">Request Type *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={cn(
                        errors.type && "border-red-500 focus:border-red-500"
                      )}
                    >
                      <SelectValue placeholder="Select request type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {requestTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Brief description of your request"
                    value={field.value}
                    onChange={field.onChange}
                    className={cn(
                      errors.title && "border-red-500 focus:border-red-500"
                    )}
                  />
                )}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className={cn(
                        errors.priority && "border-red-500 focus:border-red-500"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {watchedValues.type === "wfh" && (
              <div>
                <Label className="block text-sm font-medium mb-1">Date *</Label>
                <Controller
                  name="checkinDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            errors.checkinDate &&
                              "border-red-500 focus:border-red-500"
                          )}
                          disabled={isCreating}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            isBefore(date, startOfDay(new Date()))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.checkinDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.checkinDate.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    placeholder="Provide detailed information about your request..."
                    rows={4}
                    value={field.value}
                    onChange={field.onChange}
                    className={cn(
                      errors.description &&
                        "border-red-500 focus:border-red-500"
                    )}
                  />
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !isValid}>
                <Send className="h-4 w-4 mr-2" />
                {isCreating ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestForm;
