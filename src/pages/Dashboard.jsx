import { useGetDashboardAnalyticsQuery } from "@/store/api/analyticsApi";
import { useSelector } from "react-redux";
import { roles } from "@/utils/constant";
import { Loader2 } from "lucide-react";
import OrganizationDashboard from "@/components/dashboard/Organization";
import EmployeeDashboard from "@/components/dashboard/Employee";

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role ?? "";
  const { data: dashboardData, isLoading } = useGetDashboardAnalyticsQuery(
    null,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {[roles.SUPER_ADMIN, roles.ADMIN, roles.CLIENT].includes(userRole) ? (
        <OrganizationDashboard dashboardData={dashboardData} />
      ) : (
        <EmployeeDashboard dashboardData={dashboardData} />
      )}
    </div>
  );
};

export default Dashboard;
