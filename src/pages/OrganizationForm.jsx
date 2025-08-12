import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Building2, CalendarIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useGetOrganizationByIdQuery,
  useUploadOrganizationLogoMutation,
} from "@/store/api/organizationsApi";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetAllUsersQuery } from "@/store/api/usersApi";
import { useDispatch, useSelector } from "react-redux";
import { roles } from "@/utils/constant";
import { getResponseData, getUpdatedData } from "@/utils/helpers";
import { addUserOrganization } from "@/store/slices/authSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/utils/constant";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, subDays } from "date-fns";
import { hasPermission } from "@/utils/permission";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod validation schema
const organizationFormSchema = (canAddAdmin, canAddClient) =>
  z.object({
    name: z
      .string()
      .min(1, "Organization name is required")
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name must be less than 100 characters"),
    address: z
      .string()
      .min(1, "Address is required")
      .min(5, "Address must be at least 5 characters")
      .max(200, "Address must be less than 200 characters"),
    city: z
      .string()
      .min(1, "City is required")
      .min(2, "City must be at least 2 characters")
      .max(50, "City must be less than 50 characters"),
    state: z
      .string()
      .min(1, "State is required")
      .min(2, "State must be at least 2 characters")
      .max(50, "State must be less than 50 characters"),
    country: z.string().min(1, "Country is required"),
    zipCode: z
      .string()
      .min(1, "Zip/Postal code is required")
      .min(3, "Zip/Postal code must be at least 3 characters")
      .max(10, "Zip/Postal code must be less than 10 characters")
      .regex(
        /^[A-Za-z0-9-]+$/,
        "Zip/Postal code can only contain letters, numbers, and hyphens"
      ),
    logo: z.union([z.instanceof(File), z.string().url()]).optional(),
    user:
      canAddAdmin || canAddClient
        ? z.string().min(1, "User selection is required")
        : z.string().optional(),
    leaves: z.object({
      casual: z.number().min(0, "Casual leaves must be 0 or greater"),
      sick: z.number().min(0, "Sick leaves must be 0 or greater"),
      annual: z.number().min(0, "Annual leaves must be 0 or greater"),
      maternity: z.number().min(0, "Maternity leaves must be 0 or greater"),
      paternity: z.number().min(0, "Paternity leaves must be 0 or greater"),
      other: z.number().min(0, "Other leaves must be 0 or greater"),
      total: z.number().min(0, "Total leaves must be 0 or greater"),
      expiryDate: z
        .date({
          required_error: "Expiry date is required",
        })
        .refine((date) => date !== undefined && date !== null, {
          message: "Expiry date is required",
        }),
      carryForward: z.array(z.string()).default([]),
    }),
  });

const initialFormData = {
  name: "",
  address: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  logo: "",
  user: "",
  leaves: {
    casual: 0,
    sick: 0,
    annual: 0,
    maternity: 0,
    paternity: 0,
    other: 0,
    total: 0,
    expiryDate: "",
    carryForward: [],
  },
};

const OrganizationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { data: orgData, isLoading: orgLoading } = useGetOrganizationByIdQuery(
    id,
    {
      skip: !id,
    }
  );
  const [createOrganization, { isLoading: createLoading }] =
    useCreateOrganizationMutation();
  const [updateOrganization, { isLoading: updateLoading }] =
    useUpdateOrganizationMutation();
  const [adminSearch, setAdminSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const debouncedAdminSearch = useDebounce(adminSearch, 400);
  const debouncedClientSearch = useDebounce(clientSearch, 400);
  const [uploadOrganizationLogo] = useUploadOrganizationLogoMutation();
  const fileInputRef = useRef();

  const currentUser = useSelector((state) => state.auth?.user);
  const permissions = useSelector((state) => state.auth?.permissions);

  const isSuperAdmin = currentUser?.role === roles.SUPER_ADMIN;
  const isManagement = hasPermission(
    permissions,
    "organizations",
    "create",
    "team"
  );
  const canAddAdmin = isSuperAdmin;
  const canAddClient = isManagement;

  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState(initialFormData);

  const { data: adminUsersData, isLoading: isLoadingAdmins } =
    useGetAllUsersQuery(
      {
        role: "admin",
        ...(debouncedAdminSearch && {
          name: "firstName",
          value: debouncedAdminSearch,
        }),
        limit: 20,
      },
      {
        skip: !canAddAdmin,
      }
    );

  const { data: clientUsersData, isLoading: isLoadingClients } =
    useGetAllUsersQuery(
      {
        role: "client",
        ...(debouncedClientSearch && {
          name: "firstName",
          value: debouncedClientSearch,
        }),
        limit: 20,
      },
      {
        skip: !canAddClient,
      }
    );

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm({
    resolver: zodResolver(organizationFormSchema(canAddAdmin, canAddClient)),
    mode: "onChange",
    defaultValues: initialData,
  });
  const watchedValues = watch();

  const adminOptions = (adminUsersData?.results || []).map((user) => ({
    value: user.id,
    label: `${user.firstName ?? ""} ${user.lastName ?? ""} (${user.email})`,
  }));

  const clientOptions = (clientUsersData?.results || []).map((user) => ({
    value: user.id,
    label: `${user.firstName ?? ""} ${user.lastName ?? ""} (${user.email})`,
  }));

  useEffect(() => {
    if (id && orgData) {
      const org = orgData;
      const leavesData = {
        casual: org?.leaves?.casual || 0,
        sick: org?.leaves?.sick || 0,
        annual: org?.leaves?.annual || 0,
        maternity: org?.leaves?.maternity || 0,
        paternity: org?.leaves?.paternity || 0,
        other: org?.leaves?.other || 0,
        total:
          (Number(org?.leaves?.casual) || 0) +
            (Number(org?.leaves?.sick) || 0) +
            (Number(org?.leaves?.annual) || 0) +
            (Number(org?.leaves?.other) || 0) ||
          org?.leaves?.other ||
          0,
        expiryDate: org?.leaves?.expiryDate
          ? new Date(org?.leaves?.expiryDate)
          : "",
        carryForward: org?.leaves?.carryForward || [],
      };
      const formData = {
        name: org?.name || "",
        address: org?.address || "",
        city: org?.city || "",
        state: org?.state || "",
        country: org?.country || "",
        zipCode: org?.zipCode || "",
        logo: org?.logo || "",
        leaves: leavesData,
        user:
          isSuperAdmin || org?.orgType !== "sub"
            ? org?.user?.id || ""
            : org?.clientId || "",
      };
      setInitialData(formData);
      reset(formData);
    }
  }, [id, orgData, reset]);

  // Check for changes
  useEffect(() => {
    if (id && !orgData) return;
    const subscription = watch((currentValues) => {
      const _changedData = getUpdatedData(initialData, currentValues);
      if (Object.keys(_changedData)?.length) setHasChanges(true);
      else setHasChanges(false);
    });
    return () => subscription.unsubscribe();
  }, [watch, initialData, id, orgData]);

  const isSubmitting = createLoading || updateLoading;

  const handleLeavesChange = React.useCallback(
    (field, value) => {
      setValue(`leaves.${field}`, value, { shouldValidate: true });
    },
    [setValue]
  );

  const handleCarryForwardChange = React.useCallback(
    (leaveType, checked) => {
      const currentCarryForward = watchedValues.leaves?.carryForward || [];
      let newCarryForward;

      if (checked) {
        // Add to carry forward array if not already present
        newCarryForward = currentCarryForward.includes(leaveType)
          ? currentCarryForward
          : [...currentCarryForward, leaveType];
      } else {
        // Remove from carry forward array
        newCarryForward = currentCarryForward.filter(
          (type) => type !== leaveType
        );
      }

      setValue("leaves.carryForward", newCarryForward, {
        shouldValidate: true,
      });
    },
    [setValue, watchedValues.leaves?.carryForward]
  );

  useEffect(() => {
    const { casual, sick, annual, maternity, paternity, other } =
      watchedValues.leaves || {};
    const totalLeaves =
      (Number(casual) || 0) +
      (Number(sick) || 0) +
      (Number(annual) || 0) +
      (Number(other) || 0);

    if (totalLeaves !== watchedValues.leaves?.total) {
      setValue("leaves.total", totalLeaves, { shouldValidate: true });
    }
  }, [
    watchedValues.leaves?.casual,
    watchedValues.leaves?.sick,
    watchedValues.leaves?.annual,
    watchedValues.leaves?.other,
    setValue,
  ]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0] || null;
    setValue("logo", file, { shouldValidate: true });
  };

  const handleLogoAreaClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onSubmit = async (data) => {
    try {
      const updatedData = getUpdatedData(initialData, data);
      const { logo, ...submitData } = updatedData;
      let orgId = id;
      let responseData = null;

      if (id) {
        if (Object.keys(submitData ?? {}).length) {
          if (submitData?.user) {
            if (isManagement) {
              const clientId = submitData.user;
              submitData.clientId = clientId;
            }
          }
          const _data = await updateOrganization({
            id,
            ...submitData,
          }).unwrap();
          responseData = getResponseData(_data);
          toast.success("Organization updated successfully!");
        }
      } else {
        if (isSuperAdmin) {
        } else if (isManagement) {
          const clientId = submitData.user;
          submitData.clientId = clientId;
          submitData.user =
            currentUser?.role === roles.ADMIN
              ? currentUser?.id
              : currentUser?.admin;
        }
        const _data = await createOrganization(submitData).unwrap();
        responseData = getResponseData(_data);
        orgId = responseData?.id || responseData?._id;
        toast.success("Organization created successfully!");
      }
      // Upload logo if selected
      if (logo && orgId) {
        const formDataObj = new FormData();
        formDataObj.append("logo", logo);
        const _data = await uploadOrganizationLogo({
          id: orgId,
          formData: formDataObj,
        }).unwrap();
        responseData = getResponseData(_data);
      }

      if (responseData?.id === currentUser?.organization?.id)
        dispatch(addUserOrganization(responseData));
      navigate("/organizations");
    } catch (error) {
      toast.error(
        error?.message || "Failed to save organization. Please try again."
      );
    }
  };

  const handleUserSelect = (value) => {
    setValue("user", value, { shouldValidate: true });
  };

  if (orgLoading && id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl mx-auto8">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-800 flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <span>{id ? "Edit Organization" : "Add Organization"}</span>
          {isSubmitting && (
            <div className="ml-auto flex items-center space-x-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>{id ? "Updating..." : "Creating..."}</span>
            </div>
          )}
        </CardTitle>
        <p className="text-gray-600 text-sm mt-2">
          {id
            ? "Update organization details and leave policies."
            : "Enter organization details and leave policies."}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-medium text-gray-900">
                Organization Information
              </h3>
              <p className="text-sm text-gray-500">
                Basic details about the organization
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Organization name"
                  {...register("name")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.name ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Address"
                  {...register("address")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.address ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="City"
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
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="State"
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
                <Label htmlFor="country">Country *</Label>
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
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip/Postal Code *</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="Zip Code"
                  {...register("zipCode")}
                  className={`h-11 border-gray-200 focus:border-blue-500 ${
                    errors.zipCode ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.zipCode.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4 mt-6">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-lg font-medium text-gray-900">
                Leave Policies
              </h3>
              <p className="text-sm text-gray-500">
                Set leave entitlements for this organization
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: "casual",
                  label: "Casual Leaves",
                  showCarryForward: true,
                },
                { key: "sick", label: "Sick Leaves", showCarryForward: true },
                {
                  key: "annual",
                  label: "Annual Leaves",
                  showCarryForward: true,
                },
                {
                  key: "maternity",
                  label: "Maternity Leaves",
                  showCarryForward: false,
                },
                {
                  key: "paternity",
                  label: "Paternity Leaves",
                  showCarryForward: false,
                },
                {
                  key: "other",
                  label: "Other Leaves",
                  showCarryForward: false,
                },
                {
                  key: "total",
                  label: "Total Leaves",
                  showCarryForward: false,
                },
              ].map(({ key, label, showCarryForward }) => (
                <div className="space-y-2" key={key}>
                  <div className="flex items-center h-6">
                    <Label htmlFor={key}>{label}</Label>
                    {showCarryForward && (
                      <div className="flex items-center space-x-2 border-l pl-2 ml-2">
                        <Checkbox
                          id={`carryForward-${key}`}
                          checked={
                            watchedValues.leaves?.carryForward?.includes(key) ||
                            false
                          }
                          onCheckedChange={(checked) =>
                            handleCarryForwardChange(key, checked)
                          }
                          disabled={isSubmitting}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`carryForward-${key}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Carry Forward
                        </Label>
                      </div>
                    )}
                    {!showCarryForward && <div className="h-4 w-4"></div>}
                  </div>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    value={watchedValues.leaves?.[key] || 0}
                    onChange={(e) =>
                      handleLeavesChange(key, Number(e.target.value))
                    }
                    disabled={key === "total" || isSubmitting}
                    className={`h-11 border-gray-200 focus:border-blue-500 ${
                      errors.leaves?.[key]
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                  />
                  {errors.leaves?.[key] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.leaves[key].message}
                    </p>
                  )}
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Leave Expiry At *</Label>
                <Controller
                  name="leaves.expiryDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal h-11 border-gray-200 focus:border-blue-500 ${
                            !field.value && "text-muted-foreground"
                          } ${
                            errors.leaves?.expiryDate ? "border-red-500" : ""
                          }`}
                          disabled={isSubmitting}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => field.onChange(date ?? "")}
                          disabled={(date) => date < subDays(new Date(), 1)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.leaves?.expiryDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.leaves.expiryDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          {(canAddAdmin || canAddClient) &&
            !(
              currentUser?.role === roles.ADMIN &&
              id &&
              orgData.orgType === "main"
            ) && (
              <div className="space-y-4 mt-6">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {canAddAdmin ? "Organization Admin" : "Organization Client"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {canAddAdmin
                      ? "Assign an admin to this organization"
                      : "Assign a client to this organization"}
                  </p>
                </div>
                <div className="space-y-2 w-full">
                  <Label htmlFor="user" className="block mb-1">
                    {canAddAdmin ? "Admin *" : "Client *"}
                  </Label>
                  <SearchableSelect
                    options={canAddAdmin ? adminOptions : clientOptions}
                    value={watchedValues.user || ""}
                    onSelect={handleUserSelect}
                    onSearchChange={
                      canAddAdmin ? setAdminSearch : setClientSearch
                    }
                    placeholder={canAddAdmin ? "Select Admin" : "Select Client"}
                    searchPlaceholder={
                      canAddAdmin ? "Search admins..." : "Search clients..."
                    }
                    notFoundText={
                      canAddAdmin ? "No admin found." : "No client found."
                    }
                    isLoading={canAddAdmin ? isLoadingAdmins : isLoadingClients}
                    className={`w-full ${errors.user ? "border-red-500" : ""}`}
                  />
                  {errors.user && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.user.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          {/* Logo upload field */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="logo">Organization Logo</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg w-40 h-40 cursor-pointer mx-auto bg-gray-50 hover:bg-gray-100 transition"
              onClick={handleLogoAreaClick}
            >
              {watchedValues.logo ? (
                <>
                  {watchedValues.logo.type &&
                  watchedValues.logo.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(watchedValues.logo)}
                      alt="Logo preview"
                      className="object-cover w-40 h-40 mb-2 rounded"
                    />
                  ) : (
                    <img
                      src={watchedValues.logo}
                      alt="Organization Logo"
                      className="object-cover w-40 h-40 mb-2 rounded"
                    />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <span className="text-gray-500 text-center text-sm">
                    Upload organization logo here
                  </span>
                </div>
              )}
              <Input
                id="logo"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={isSubmitting}
                className="hidden"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/organizations")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gap-2"
              disabled={isSubmitting || !hasChanges}
            >
              <Save className="h-4 w-4" />
              {id ? "Update Organization" : "Create Organization"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrganizationForm;
