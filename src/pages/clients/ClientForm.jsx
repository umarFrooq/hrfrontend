import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserCheck, Save, X, Upload, CalendarIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "@/store/api/usersApi";
import { roles, countries } from "@/utils/constant";
import {
  getErrorMessage,
  getParsedUserRoles,
  getUpdatedData,
} from "@/utils/helpers";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { format } from "date-fns";
import { DEPARTMENTS } from "@/utils/constant";
import { useCreateClientMutation } from "@/store/api/clientsApi";
import { useUpdateClientMutation } from "@/store/api/clientsApi";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";
import { PhoneInput } from "@/components/ui/phone-input";

// Zod validation schema
const clientFormSchema = (isUpdate = false, isSuperAdmin = false) =>
  z.object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: isUpdate
      ? z
          .string()
          .min(8, "Password must be at least 8 characters")
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
          )
          .optional()
          .or(z.literal(""))
      : z
          .string()
          .min(1, "Password is required")
          .min(8, "Password must be at least 8 characters")
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
          ),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
    bio: z
      .string()
      .min(1, "Bio is required")
      .max(500, "Bio must be less than 500 characters"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    admin: isSuperAdmin
      ? z.string().min(1, "Admin selection is required")
      : z.string().optional(),
  });

const initialFormDataState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  bio: "",
  startDate: undefined,
  city: "",
  state: "",
  country: "",
  admin: "",
};

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [adminSearch, setAdminSearch] = useState("");
  const currentUserOrganization = useSelector(
    (state) => state.auth?.user?.organization
  );
  const currentUserRole = useSelector((state) => state.auth?.user?.role);

  const [initialFormData, setInitialFormData] = useState(initialFormDataState);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    setValue,
    watch,
    reset,
    control,
  } = useForm({
    resolver: zodResolver(
      clientFormSchema(!!id, currentUserRole === roles.SUPER_ADMIN)
    ),
    mode: "onChange",
    defaultValues: initialFormDataState,
  });

  const watchedValues = watch();
  const [hasChanges, setHasChanges] = useState(false);

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useGetUserByIdQuery(id, {
    skip: !id, // prevents query when adding new user
  });
  const { data: adminOptions, isLoading: isLoadingAdmins } =
    useGetAllUsersQuery({
      role: roles.ADMIN,
      ...(adminSearch && { name: "name", value: adminSearch }),
    });
  const [createClient, { isLoading: createLoading }] =
    useCreateClientMutation();
  const [updateClient, { isLoading: updateLoading }] =
    useUpdateClientMutation();

  const isSubmitting = createLoading || updateLoading;

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Failed to fetch user. Please try again.");
    }
  }, [isError, error]);

  useEffect(() => {
    if (user) {
      const _userData = {
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        password: "",
        phone: user?.phone || "",
        bio: user?.bio || "",
        startDate: user?.startDate ? new Date(user?.startDate) : undefined,
        city: user?.address?.city || "",
        state: user?.address?.state || "",
        country: user?.address?.country || "",
        admin: user?.admin || "",
      };
      setInitialFormData(_userData);
      reset(_userData);
    }
  }, [user, reset]);

  // Check for changes
  useEffect(() => {
    if (id && !user) return;
    const subscription = watch((currentValues) => {
      const _changedData = getUpdatedData(initialFormData, currentValues);
      if (Object.keys(_changedData)?.length) setHasChanges(true);
      else setHasChanges(false);
    });
    return () => subscription.unsubscribe();
  }, [watch, initialFormData, id, user]);

  const onSubmit = async (data) => {
    const _updatedData = getUpdatedData(initialFormData, data);
    const { city, state, country, ...updatedData } = _updatedData;
    if (city || state || country) {
      updatedData.address = {};
      if (city) updatedData.address.city = city;
      if (state) updatedData.address.state = state;
      if (country) updatedData.address.country = country;
    }

    if (updatedData.phone) {
      updatedData.phone = updatedData.phone.replace(/\s/g, "");
    }
    try {
      if (id) {
        await updateClient({ id, ...updatedData }).unwrap();
        toast.success("Client updated successfully!");
        navigate("/clients");
      } else {
        if (currentUserRole === roles.CLIENT && currentUserOrganization?.id)
          updatedData.organization = currentUserOrganization?.id;

        await createClient(updatedData).unwrap();
        toast.success("Client created successfully!");
        navigate("/clients");
      }
    } catch (error) {
      toast.error(
        error?.data?.message || "Failed to update client. Please try again."
      );
    }
  };

  const handleAdminSelect = (value) => {
    setValue("admin", value, { shouldValidate: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-800 flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <span>Client Details</span>
          {isSubmitting && (
            <div className="ml-auto flex items-center space-x-2 text-sm text-green-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span>Updating client...</span>
            </div>
          )}
        </CardTitle>
        <p className="text-gray-600 text-sm mt-2">
          Update client information, role assignments, and other details as
          needed.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-medium text-gray-900">
                Personal Information
              </h3>
              <p className="text-sm text-gray-500">
                Basic client details and contact information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700"
                >
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  {...register("firstName")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.firstName
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700"
                >
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  {...register("lastName")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.lastName ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  {...register("email")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.email ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password {!id && "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={
                    id
                      ? "Leave blank to keep current password"
                      : "Enter a password"
                  }
                  {...register("password")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.password ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Phone Number *
                </Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      placeholder="Enter a phone number"
                      value={field.value}
                      onChange={field.onChange}
                      className={`h-11 border-gray-200 focus:border-blue-500 ${
                        errors.phone
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="startDate"
                  className="text-sm font-medium text-gray-700"
                >
                  On-Board Date *
                </Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal h-11 border-gray-200 focus:border-blue-500 ${
                            errors.startDate
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          } ${!field.value && "text-muted-foreground"}`}
                          disabled={isSubmitting}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disableFutureDates={true}
                          disabled={isSubmitting}
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
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="bio"
                className="text-sm font-medium text-gray-700"
              >
                Bio *
              </Label>
              <textarea
                id="bio"
                rows={3}
                placeholder="Enter a brief bio"
                {...register("bio")}
                className={`flex w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                  errors.bio ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.bio && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.bio.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className="text-sm font-medium text-gray-700"
                >
                  City *
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Enter city"
                  {...register("city")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.city ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="state"
                  className="text-sm font-medium text-gray-700"
                >
                  State *
                </Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="Enter state"
                  {...register("state")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.state ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.state.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="country"
                  className="text-sm font-medium text-gray-700"
                >
                  Country *
                </Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        className={`h-11 border-gray-200 focus:border-blue-500 ${
                          errors.country
                            ? "border-red-500 focus:border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(countries).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {value
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.country.message}
                  </p>
                )}
              </div>
            </div>

            {currentUserRole === roles.SUPER_ADMIN && (
              <div className="space-y-2 w-full">
                <Label htmlFor="admin" className="block mb-1">
                  Admin *
                </Label>
                <SearchableSelect
                  options={
                    adminOptions?.results?.length > 0
                      ? adminOptions?.results?.map((admin) => ({
                          label: `${admin.firstName} ${admin.lastName}`,
                          value: admin.id,
                        }))
                      : []
                  }
                  value={watchedValues.admin || ""}
                  onSelect={handleAdminSelect}
                  onSearchChange={setAdminSearch}
                  placeholder="Select Admin"
                  searchPlaceholder="Search admins..."
                  notFoundText="No admin found."
                  isLoading={isLoadingAdmins}
                  className={`w-full ${errors.admin ? "border-red-500" : ""}`}
                />
                {errors.admin && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.admin.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link to="/clients">
              <Button
                variant="outline"
                type="button"
                className="w-32"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 w-32 flex items-center space-x-2"
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{id ? "Updating..." : "Adding..."}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{id ? "Update Client" : "Add Client"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientForm;
