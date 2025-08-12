import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { leavesType } from "@/utils/constant";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { useAddLeaveMutation } from "@/store/api/leavesApi";
import { toast } from "sonner";
import { add } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { normalizeDateTime } from "@/utils/helpers";

const leaveTypeOptions = Object.values(leavesType ?? {});

// Zod validation schema
const leaveFormSchema = z
  .object({
    startDate: z
      .date({
        required_error: "From date is required",
      })
      .refine(
        (date) => {
          const today = startOfDay(new Date());
          return !isBefore(date, today);
        },
        {
          message: "From date cannot be in the past",
        }
      ),
    endDate: z
      .date({
        required_error: "To date is required",
      })
      .refine(
        (date) => {
          const today = startOfDay(new Date());
          return !isBefore(date, today);
        },
        {
          message: "To date cannot be in the past",
        }
      ),
    leaveType: z
      .string({
        required_error: "Leave type is required",
      })
      .min(1, "Leave type is required"),
    reason: z
      .string({
        required_error: "Reason is required",
      })
      .min(5, "Reason must be at least 5 words")
      .refine(
        (value) => {
          const wordCount = value
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
          return wordCount >= 5;
        },
        {
          message: "Reason must be at least 5 words",
        }
      )
      .refine(
        (value) => {
          const wordCount = value
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
          return wordCount <= 150;
        },
        {
          message: "Reason must be at most 150 words",
        }
      ),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return !isBefore(data.endDate, data.startDate);
      }
      return true;
    },
    {
      message: "To date must be after or equal to from date",
      path: ["endDate"],
    }
  );

const initialFormData = {
  startDate: undefined,
  endDate: undefined,
  leaveType: "",
  reason: "",
};

const AddLeave = () => {
  const [open, setOpen] = useState(false);
  const [addLeave, { isLoading }] = useAddLeaveMutation();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    setValue,
    watch,
    reset,
    control,
    clearErrors,
  } = useForm({
    resolver: zodResolver(leaveFormSchema),
    mode: "onChange",
    defaultValues: initialFormData,
  });

  const watchedValues = watch();
  const [hasChanges, setHasChanges] = useState(false);

  // Check for changes
  useEffect(() => {
    const subscription = watch((currentValues) => {
      const hasFormChanges = Object.keys(currentValues).some(
        (key) => currentValues[key] !== initialFormData[key]
      );
      setHasChanges(hasFormChanges);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Clear end date when start date changes
  useEffect(() => {
    if (watchedValues.startDate) {
      setValue("endDate", undefined);
      clearErrors("endDate");
    }
  }, [watchedValues.startDate, setValue, clearErrors]);

  const handleFormSubmit = async (data) => {
    try {
      const submitData = {
        startDate: normalizeDateTime(data.startDate),
        endDate: normalizeDateTime(
          add(data.endDate, { hours: 23, minutes: 59 })
        ),
        leaveType: data.leaveType,
        reason: data.reason,
      };
      await addLeave(submitData).unwrap();
      toast.success("Leave submitted successfully!");
      setOpen(false);
      reset(initialFormData);
      setHasChanges(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to submit leave.");
    }
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset(initialFormData);
      setHasChanges(false);
    }
  };

  const getWordCount = (text) => {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">Add Leave</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Leave Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              From Date *
            </label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                        errors.startDate &&
                          "border-red-500 focus:border-red-500"
                      )}
                      disabled={isLoading}
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
            {errors.startDate && (
              <p className="text-red-500 text-xs mt-1">
                {errors.startDate.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To Date *</label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                        errors.endDate && "border-red-500 focus:border-red-500"
                      )}
                      disabled={isLoading || !watchedValues.startDate}
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
                        isBefore(date, startOfDay(new Date())) ||
                        (watchedValues.startDate &&
                          isBefore(date, watchedValues.startDate))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.endDate && (
              <p className="text-red-500 text-xs mt-1">
                {errors.endDate.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Leave Type *
            </label>
            <Controller
              name="leaveType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger
                    className={cn(
                      errors.leaveType && "border-red-500 focus:border-red-500"
                    )}
                  >
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.leaveType && (
              <p className="text-red-500 text-xs mt-1">
                {errors.leaveType.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason *</label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter reason (minimum 5 words, maximum 100 words)"
                    value={field.value}
                    onChange={field.onChange}
                    className={cn(
                      "min-h-[100px]",
                      errors.reason && "border-red-500 focus:border-red-500"
                    )}
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Word count: {getWordCount(field.value)}/150</span>
                  </div>
                </div>
              )}
            />
            {errors.reason && (
              <p className="text-red-500 text-xs mt-1">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading || !isValid || !hasChanges}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeave;
