import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getParsedUserRoles, getUpdatedData } from "@/utils/helpers";
import {
  DEPARTMENTS,
  roles,
  countries,
  RELIGIONS,
  BLOOD_GROUPS,
} from "@/utils/constant";
import {
  useCreateUserMutation,
  useGetAllUsersQuery,
  useUpdateUserMutation,
  useUploadProfileImageMutation,
} from "@/store/api/usersApi";
import { useGetAllOrganizationsQuery } from "@/store/api/organizationsApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Save, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// Base Zod validation schema
const createUserFormSchema = (
  isUpdate = false,
  isClient = false,
  isSuperAdmin = false
) =>
  z.object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(15, "First name must be less than 15 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(15, "Last name must be less than 15 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z.string().refine(
      (val) => {
        if (!isUpdate) {
          return val.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val);
        }
        if (val === "") return true;
        return val.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val);
      },
      {
        message:
          "Password must be at least 8 characters with upper, lower, and number",
      }
    ),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
    dateOfBirth: isSuperAdmin
      ? z
          .date({
            required_error: "Date of birth is required",
          })
          .optional()
          .nullable()
      : z.date({
          required_error: "Date of birth is required",
        }),
    employeeId: isSuperAdmin
      ? z.string().optional().nullable()
      : z
          .string()
          .min(1, "Employee ID is required")
          .min(2, "Employee ID must be at least 2 characters")
          .max(10, "Employee ID must be less than 10 characters"),
    bio: z.string().optional(),
    organization:
      isSuperAdmin || isClient
        ? z.string().optional().nullable()
        : z.string().min(1, "Organization is required"),
    department: isSuperAdmin
      ? z.string().optional().nullable()
      : z.string().min(1, "Department is required"),
    jobTitle: isSuperAdmin
      ? z.string().optional().nullable()
      : z
          .string()
          .min(1, "Job title is required")
          .max(30, "Job title must be less than 30 characters"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    role: z.string().min(1, "User role is required"),
    reportsTo: z.string().optional(),
    fatherName: z.string().optional(),
    cnic: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{5}-\d{7}-\d{1}$/.test(val), {
        message: "Invalid CNIC format. Expected format: XXXXX-XXXXXXX-X",
      }),
    profileImage: z
      .any()
      .optional()
      .refine(
        (files) =>
          !files ||
          files.length === 0 ||
          (files instanceof FileList && files[0].size <= MAX_FILE_SIZE),
        `Max file size is 5MB.`
      )
      .refine(
        (files) =>
          !files ||
          files.length === 0 ||
          (files instanceof FileList &&
            ACCEPTED_IMAGE_TYPES.includes(files[0].type)),
        ".jpg, .jpeg, .png and .webp files are accepted."
      ),
    religion: z.string().optional(),
    bloodGroup: z.string().optional(),
    maritalStatus: z.string().optional(),
    anyDisease: z.string().optional(),
    takingMedicines: z.boolean().optional(),
    qualification: z.string().optional(),
    experience: z.string().optional(),
  });

const initialFormDataState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  dateOfBirth: undefined,
  employeeId: "",
  bio: "",
  organization: "",
  department: "",
  jobTitle: "",
  startDate: undefined,
  role: "",
  reportsTo: "",
  fatherName: "",
  cnic: "",
  profileImage: undefined,
  religion: "",
  bloodGroup: "",
  maritalStatus: "",
  anyDisease: "",
  takingMedicines: false,
  qualification: "",
  experience: "",
};

const UserFormFields = ({ userData, currentUserRole, getAvailableRoles }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [createUser, { isLoading: createLoading }] = useCreateUserMutation();
  const [updateUser, { isLoading: updateLoading }] = useUpdateUserMutation();
  const [uploadProfileImage, { isLoading: isUploadingImage }] =
    useUploadProfileImageMutation();
  const [userSearch, setUserSearch] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const isSubmitting = createLoading || updateLoading || isUploadingImage;
  const { data: allUsers, isFetching: usersLoading } = useGetAllUsersQuery({
    limit: 20,
    ...(userSearch && { name: "firstName", value: userSearch }),
  });
  const { data: organizations, isLoading: organizationsLoading } =
    useGetAllOrganizationsQuery({
      limit: 20,
      ...(organizationSearch && { name: "name", value: organizationSearch }),
    });
  const isSuperAdmin = currentUserRole === roles.SUPER_ADMIN;

  const [initialFormData, setInitialFormData] = useState(initialFormDataState);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
    control,
  } = useForm({
    resolver: zodResolver(
      createUserFormSchema(
        !!id,
        currentUserRole === roles.CLIENT,
        currentUserRole === roles.SUPER_ADMIN
      )
    ),
    mode: "onChange",
    defaultValues: initialFormDataState,
  });

  const watchedValues = watch();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userData) {
      const _userData = {
        firstName: userData?.firstName || "",
        lastName: userData?.lastName || "",
        email: userData?.email || "",
        password: "",
        city: userData?.address?.city || "",
        state: userData?.address?.state || "",
        country: userData?.address?.country || "",
        phone: userData?.phone || "",
        dateOfBirth: userData?.dateOfBirth
          ? new Date(userData?.dateOfBirth)
          : undefined,
        employeeId: userData?.employeeId || "",
        bio: userData?.bio || "",
        organization: userData?.organization?.id || "",
        department: userData?.department || "",
        jobTitle: userData?.jobTitle || "",
        startDate: userData?.startDate
          ? new Date(userData?.startDate)
          : undefined,
        role: userData?.role || "",
        reportsTo: userData?.reportsTo?.id || "",
        fatherName: userData?.fatherName || "",
        cnic: userData?.cnic || "",
        religion: userData?.religion || "",
        bloodGroup: userData?.bloodGroup || "",
        maritalStatus: userData?.maritalStatus || "",
        anyDisease: userData?.anyDisease || "",
        takingMedicines: userData?.takingMedicines || false,
        qualification: userData?.qualification || "",
        experience: userData?.experience || "",
      };
      setInitialFormData(_userData);
      reset(_userData);
    }
  }, [userData, reset]);

  // Check for changes
  useEffect(() => {
    if (id && !userData) return;
    const subscription = watch((currentValues) => {
      const _changedData = getUpdatedData(initialFormData, currentValues);
      if (Object.keys(_changedData)?.length) setHasChanges(true);
      else setHasChanges(false);
    });
    return () => subscription.unsubscribe();
  }, [watch, initialFormData, id, userData]);

  const supervisorOptions =
    (allUsers?.results ?? [])?.filter(
      (user) =>
        user.id !== id &&
        [roles.HR, roles.MANAGER, roles.CLIENT].includes(user.role)
    ) || [];

  const onSubmit = async (data) => {
    const { profileImage, ...userData } = data;

    const payload = { ...userData };
    if (userData.city || userData.state || userData.country) {
      payload.address = {
        city: userData.city,
        state: userData.state,
        country: userData.country,
      };
    }
    delete payload.city;
    delete payload.state;
    delete payload.country;

    try {
      let userResult;
      if (id) {
        // Update user data first
        userResult = await updateUser({ id, ...payload }).unwrap();
        toast.success("User data updated successfully!");
      } else {
        // Create user first
        userResult = await createUser(payload).unwrap();
        toast.success("User created successfully!");
      }

      // Then, upload profile image if it exists
      if (profileImage && profileImage.length > 0) {
        const imageFormData = new FormData();
        imageFormData.append("profileImage", profileImage[0]);

        // Use existing id, or the id from the create response
        const userId = id || userResult?.user?.id;

        if (userId) {
          await uploadProfileImage({ id: userId, formData: imageFormData }).unwrap();
          toast.success("Profile image uploaded successfully!");
        }
      }

      navigate("/users");
    } catch (error) {
      toast.error(
        error?.data?.message || "An error occurred during the process."
      );
    }
  };

  const handleRoleChange = (value) => {
    setValue("role", value, { shouldValidate: true });
    if (value === roles.ADMIN) {
      setValue("reportsTo", "", { shouldValidate: true });
    }
  };

  // Custom validation for reportsTo field
  const validateReportsTo = (value) => {
    const currentRole = watchedValues.role;
    if (currentRole === roles.ADMIN) {
      return true; // Optional for admin
    }
    return (
      (value && value.trim() !== "") ||
      "Reports to is required when role is not Admin"
    );
  };

  return (
    <div>
      {/* Personal Information Section */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Personal Information
            </h3>
            <p className="text-sm text-gray-500">
              Basic user details and contact information
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
                  errors.firstName ? "border-red-500 focus:border-red-500" : ""
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
                      errors.phone ? "border-red-500 focus:border-red-500" : ""
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
                htmlFor="dateOfBirth"
                className="text-sm font-medium text-gray-700"
              >
                Date of Birth {!isSuperAdmin && "*"}
              </Label>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal h-11 border-gray-200 focus:border-blue-500 ${
                          errors.dateOfBirth
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
              {errors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="employeeId"
                className="text-sm font-medium text-gray-700"
              >
                Employee ID {!isSuperAdmin && "*"}
              </Label>
              <Input
                id="employeeId"
                type="text"
                placeholder="Enter employee ID"
                {...register("employeeId")}
                className={`h-11 border-gray-200 focus:border-blue-500 ${
                  errors.employeeId ? "border-red-500 focus:border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.employeeId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.employeeId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="fatherName"
                className="text-sm font-medium text-gray-700"
              >
                Father's Name
              </Label>
              <Input
                id="fatherName"
                type="text"
                placeholder="Enter father's name"
                {...register("fatherName")}
                className="h-11 border-gray-200 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="cnic"
                className="text-sm font-medium text-gray-700"
              >
                CNIC
              </Label>
              <Input
                id="cnic"
                type="text"
                placeholder="Enter CNIC"
                {...register("cnic")}
                className={`h-11 border-gray-200 focus:border-blue-500 ${
                  errors.cnic ? "border-red-500 focus:border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.cnic && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.cnic.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="religion"
                className="text-sm font-medium text-gray-700"
              >
                Religion
              </Label>
              <Controller
                name="religion"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select Religion" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELIGIONS.map((religion) => (
                        <SelectItem key={religion.value} value={religion.value}>
                          {religion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="bloodGroup"
                className="text-sm font-medium text-gray-700"
              >
                Blood Group
              </Label>
              <Controller
                name="bloodGroup"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select Blood Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((group) => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="maritalStatus"
                className="text-sm font-medium text-gray-700"
              >
                Marital Status
              </Label>
              <Controller
                name="maritalStatus"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select Marital Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="anyDisease"
                className="text-sm font-medium text-gray-700"
              >
                Any Disease
              </Label>
              <Input
                id="anyDisease"
                type="text"
                placeholder="Enter any disease"
                {...register("anyDisease")}
                className="h-11 border-gray-200 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="qualification"
                className="text-sm font-medium text-gray-700"
              >
                Qualification
              </Label>
              <Input
                id="qualification"
                type="text"
                placeholder="Enter qualification"
                {...register("qualification")}
                className="h-11 border-gray-200 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="experience"
                className="text-sm font-medium text-gray-700"
              >
                Experience
              </Label>
              <Input
                id="experience"
                type="text"
                placeholder="Enter experience"
                {...register("experience")}
                className="h-11 border-gray-200 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="profileImage"
                className="text-sm font-medium text-gray-700"
              >
                {id ? "Upload New Profile Image" : "Profile Image"}
              </Label>
              <Input
                id="profileImage"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                {...register("profileImage")}
                className="h-11 border-gray-200 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isSubmitting}
              />
              {errors.profileImage && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.profileImage.message}
                </p>
              )}
              {id && userData?.profileImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Current Image:</p>
                  <img
                    src={userData.profileImage}
                    alt="Current Profile"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Controller
                name="takingMedicines"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="takingMedicines"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="takingMedicines">Taking any medicines?</Label>
            </div>
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
                id ? "Leave blank to keep current password" : "Enter a password"
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
            <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
              Bio
            </Label>
            <textarea
              id="bio"
              rows={3}
              placeholder="Enter a brief bio"
              {...register("bio")}
              className="flex w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Organization Information Section */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Organization Information
            </h3>
            <p className="text-sm text-gray-500">
              Company and department details
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUserRole !== roles.CLIENT && (
              <div className="space-y-2">
                <Label
                  htmlFor="organization"
                  className="text-sm font-medium text-gray-700"
                >
                  Organization {!isSuperAdmin && "*"}
                </Label>
                <SearchableSelect
                  options={
                    organizations?.results.length
                      ? organizations?.results?.map((org) => ({
                          label: `${org.name} (${
                            org?.orgType?.charAt(0)?.toUpperCase() +
                            org?.orgType?.slice(1)
                          })`,
                          value: org?.id,
                        }))
                      : []
                  }
                  value={watchedValues.organization || ""}
                  onSelect={(value) =>
                    setValue("organization", value, { shouldValidate: true })
                  }
                  disabled={isSubmitting}
                  placeholder="Select Organization"
                  onSearchChange={setOrganizationSearch}
                  isLoading={organizationsLoading}
                />
                {errors.organization && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.organization.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="department"
                className="text-sm font-medium text-gray-700"
              >
                Department {!isSuperAdmin && "*"}
              </Label>
              <Select
                value={watchedValues.department || ""}
                onValueChange={(value) =>
                  setValue("department", value, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent
                  className={`bg-white border border-gray-200 shadow-lg ${
                    errors.department ? "border-red-500" : ""
                  }`}
                >
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem
                      key={dept.value}
                      value={dept.value}
                      className="hover:bg-gray-50"
                    >
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.department.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="jobTitle"
                className="text-sm font-medium text-gray-700"
              >
                Job Title {!isSuperAdmin && "*"}
              </Label>
              <Input
                id="jobTitle"
                type="text"
                placeholder="Enter job title"
                {...register("jobTitle")}
                className={`h-11 border-gray-200 focus:border-blue-500 ${
                  errors.jobTitle ? "border-red-500 focus:border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
              {errors.jobTitle && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.jobTitle.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="startDate"
                className="text-sm font-medium text-gray-700"
              >
                Start Date *
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
        </div>

        {/* Role & Permissions Section */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Role & Permissions
            </h3>
            <p className="text-sm text-gray-500">
              Define user role and reporting structure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-sm font-medium text-gray-700"
              >
                User Role *
              </Label>
              <Select
                value={watchedValues.role || ""}
                onValueChange={handleRoleChange}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  className={`h-11 border-gray-200 ${
                    errors.role ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {getAvailableRoles(currentUserRole).map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                      className="hover:bg-gray-50"
                    >
                      {getParsedUserRoles(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="reportsTo"
                className="text-sm font-medium text-gray-700"
              >
                Reports To {watchedValues.role !== roles.ADMIN && "*"}
              </Label>
              <Controller
                name="reportsTo"
                control={control}
                rules={{
                  validate: validateReportsTo,
                }}
                render={({ field }) => (
                  <SearchableSelect
                    options={supervisorOptions?.map((user) => ({
                      label: `${user.firstName} ${
                        user.lastName
                      } (${getParsedUserRoles(user.role)})`,
                      value: user.id,
                    }))}
                    value={field.value || ""}
                    onSelect={(value) => {
                      field.onChange(value);
                      setValue("reportsTo", value, { shouldValidate: true });
                    }}
                    disabled={
                      isSubmitting || watchedValues.role === roles.ADMIN
                    }
                    placeholder="Select supervisor"
                    onSearchChange={setUserSearch}
                    isLoading={usersLoading}
                  />
                )}
              />
              {errors.reportsTo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.reportsTo.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watchedValues.role === roles.ADMIN
                  ? "Admins don't report to anyone"
                  : "Select who this user reports to"}
              </p>
            </div>
          </div>
        </div>

        {/* Work Details Section */}
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-lg font-medium text-gray-900">Work Details</h3>
            <p className="text-sm text-gray-500">
              Work type, schedule, and compensation information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="emergencyContact"
                className="text-sm font-medium text-gray-700"
              >
                Emergency Contact Number
              </Label>
              <PhoneInput
                placeholder="Enter emergency contact number"
                className="h-11 border-gray-200 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="workType"
                className="text-sm font-medium text-gray-700"
              >
                Work Type
              </Label>
              <Select disabled={isSubmitting}>
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="hybrid" className="hover:bg-gray-50">
                    Hybrid
                  </SelectItem>
                  <SelectItem value="in-office" className="hover:bg-gray-50">
                    In-Office
                  </SelectItem>
                  <SelectItem value="remote" className="hover:bg-gray-50">
                    Remote
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="shiftStartTime"
                className="text-sm font-medium text-gray-700"
              >
                Shift Start Time
              </Label>
              <Input
                id="shiftStartTime"
                type="time"
                className="h-11 border-gray-200 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="shiftEndTime"
                className="text-sm font-medium text-gray-700"
              >
                Shift End Time
              </Label>
              <Input
                id="shiftEndTime"
                type="time"
                className="h-11 border-gray-200 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="salary"
                className="text-sm font-medium text-gray-700"
              >
                Salary
              </Label>
              <Input
                id="salary"
                type="number"
                placeholder="Enter salary amount"
                className="h-11 border-gray-200 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="timezone"
                className="text-sm font-medium text-gray-700"
              >
                Timezone
              </Label>
              <Select disabled={isSubmitting}>
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="UTC" className="hover:bg-gray-50">
                    UTC (Coordinated Universal Time)
                  </SelectItem>
                  <SelectItem value="EST" className="hover:bg-gray-50">
                    EST (Eastern Standard Time)
                  </SelectItem>
                  <SelectItem value="CST" className="hover:bg-gray-50">
                    CST (Central Standard Time)
                  </SelectItem>
                  <SelectItem value="MST" className="hover:bg-gray-50">
                    MST (Mountain Standard Time)
                  </SelectItem>
                  <SelectItem value="PST" className="hover:bg-gray-50">
                    PST (Pacific Standard Time)
                  </SelectItem>
                  <SelectItem value="GMT" className="hover:bg-gray-50">
                    GMT (Greenwich Mean Time)
                  </SelectItem>
                  <SelectItem value="IST" className="hover:bg-gray-50">
                    IST (Indian Standard Time)
                  </SelectItem>
                  <SelectItem value="JST" className="hover:bg-gray-50">
                    JST (Japan Standard Time)
                  </SelectItem>
                  <SelectItem value="AEST" className="hover:bg-gray-50">
                    AEST (Australian Eastern Standard Time)
                  </SelectItem>
                  <SelectItem value="CET" className="hover:bg-gray-50">
                    CET (Central European Time)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <Link to="/users">
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
                <span>{id ? "Update User" : "Add User"}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserFormFields;
