import { isEqual } from "lodash";
import { allowedModulesByRole, DEPARTMENTS, roles } from "./constant";
import { format } from "date-fns-tz";

export const getResponseData = (response) => {
  const data = response?.data?.data || response?.data || response;
  return data;
};

export const getErrorMessage = (error) => {
  const message =
    error?.response?.data?.userMessage ||
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred";
  return message;
};

export const getParsedUserRoles = (role) => {
  switch (role) {
    case roles.SUPER_ADMIN:
      return "Super Admin";
    case roles.ADMIN:
      return "Admin";
    case roles.HR:
      return "HR";
    case roles.MANAGER:
      return "Manager";
    case roles.EMPLOYEE:
      return "Employee";
    case roles.CLIENT:
      return "Client";
    default:
      return "Unknown Role";
  }
};

export const hasModuleAccess = (userRole, module) => {
  return allowedModulesByRole[userRole]?.includes(module) || false;
};

export const getUpdatedData = (original, updated) => {
  const changes = {};
  for (const key in updated) {
    if (!isEqual(updated[key], original[key])) {
      changes[key] = updated[key];
    }
  }
  return changes;
};

export const getDepartmentLabel = (value) => {
  const department = DEPARTMENTS.find((dept) => dept.value === value);
  return department?.label;
};

/**
 * Normalize a local date/time string to UTC ISO format.
 * @param {string} localDateTime - A local date-time string (e.g. '2025-08-04T00:00:00')
 * @param {string} [timeZone='Asia/Karachi'] - Optional timezone string (defaults to PKT)
 * @returns {string} ISO string in UTC
 */
export const normalizeDateTime = (localDateTime, timeZone = "Asia/Karachi") => {
  const date = new Date(localDateTime);
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone });
};

/**
 * Format a number with dynamic decimal places.
 * If all digits after decimal are zeros, returns the integer part only.
 * Otherwise, returns the number with specified decimal places.
 * Also removes trailing zeros from decimal numbers.
 * @param {number} number - The number to format
 * @param {number} decimalPlaces - Number of decimal places to show (default: 2)
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, decimalPlaces = 2) => {
  // Handle null, undefined, or non-numeric values
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  // Convert to number if it's a string
  const num = typeof number === "string" ? parseFloat(number) : number;

  // If the number is an integer, return it as is
  if (Number.isInteger(num)) {
    return num.toString();
  }

  // Format with specified decimal places
  const formatted = num.toFixed(decimalPlaces);

  // Check if all digits after decimal are zeros
  const decimalPart = formatted.split(".")[1];
  if (decimalPart && decimalPart.split("").every((digit) => digit === "0")) {
    // Return only the integer part
    return Math.floor(num).toString();
  }

  // Remove trailing zeros from decimal part
  const [integerPart, decimalPartAfterFormat] = formatted.split(".");
  if (decimalPartAfterFormat) {
    // Remove trailing zeros from decimal part
    const trimmedDecimal = decimalPartAfterFormat.replace(/0+$/, "");

    // If all decimals were zeros, return integer part only
    if (trimmedDecimal === "") {
      return integerPart;
    }

    // Return with trimmed decimal part
    return `${integerPart}.${trimmedDecimal}`;
  }

  return formatted;
};
