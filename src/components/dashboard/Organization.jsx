import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  Building2,
  UserCheck,
  CalendarDays,
  ClipboardList,
  Plus,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import { DEPARTMENTS, requestTypes } from "@/utils/constant";
import { formatNumber } from "@/utils/helpers";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventIcon(eventType) {
  // Handle the actual payload format: "leave:requested", "request:created", etc.
  const baseType = eventType?.split(":")[0];
  switch (baseType) {
    case "leave":
      return <CalendarDays className="h-4 w-4" />;
    case "request":
      return <ClipboardList className="h-4 w-4" />;
    case "checkin":
      return <UserCheck className="h-4 w-4" />;
    case "user":
      return <Users className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "default";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}

function getStatusColor(status) {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

const departmentPerformance = (dashboardData) => {
  return dashboardData?.performance
    ?.filter((dept) => dept?.department) // Only show departments with valid department values
    ?.filter((dept) =>
      DEPARTMENTS.find((item) => item?.value === dept?.department)
    );
};

const departmentBreakdown = (dashboardData) => {
  return dashboardData?.leaves?.departmentBreakdown?.filter((dept) =>
    DEPARTMENTS.find((item) => item?.value === dept?._id)
  );
};

export default function OrganizationDashboard({ dashboardData }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Check if attendance data exists and has content
  const hasAttendanceData =
    dashboardData?.attendance?.dailyAttendance?.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Organization Dashboard
        </h1>
        <p className="text-muted-foreground">
          Comprehensive overview of all organizational activities, metrics, and
          performance indicators
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardData?.overview?.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {item?.eventType?.split(":")[0] + "s"}
              </CardTitle>
              {getEventIcon(item?.eventType)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item?.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {item?.uniqueUserCount} unique users
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last: {formatDate(item?.lastEventDate)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList
          className={`grid w-full grid-cols-${hasAttendanceData ? 4 : 3}`}
        >
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {hasAttendanceData && (
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          )}
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Department Performance
                </CardTitle>
                <CardDescription>
                  Activity breakdown across all departments
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto mb-3">
                <div className="space-y-4">
                  {departmentPerformance(dashboardData)?.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium capitalize">
                            {dept?.department
                              ? DEPARTMENTS.find(
                                  (item) => item?.value === dept?.department
                                )?.label
                              : "Unassigned"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {dept?.employeeCount}{" "}
                            {dept?.employeeCount > 1 ? "employees" : "employee"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{dept?.totalEvents}</div>
                          <div className="text-xs text-muted-foreground">
                            Total events
                          </div>
                        </div>
                      </div>
                      {index !==
                        Math.min(
                          departmentPerformance(dashboardData)?.length - 1
                        ) && (
                        <div className="border-b border-gray-200 w-full" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest organizational activities and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {dashboardData?.overview?.slice(0, 4).map((event, index) => {
                    const eventName =
                      event?.eventType?.split(":").join(" ") || "Event";
                    const capitalizedEventName = eventName
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ");

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 border rounded-lg"
                      >
                        <div className="text-blue-600">
                          {getEventIcon(event?.eventType)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {capitalizedEventName}
                          </div>
                          <div className="text-xs text-muted-foreground my-1">
                            {formatDateTime(event?.lastEventDate)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Detailed Department Performance
              </CardTitle>
              <CardDescription>
                Comprehensive metrics for each department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Department</TableHead>
                    <TableHead className="min-w-[150px] text-center">
                      Employees
                    </TableHead>

                    <TableHead className="min-w-[150px] text-center">
                      Check-ins
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center">
                      Leaves
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center">
                      Requests
                    </TableHead>
                    <TableHead className="min-w-[150px] text-center">
                      Total Events
                    </TableHead>
                    <TableHead className="min-w-[200px] text-center">
                      Avg Events Per Employee
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentPerformance(dashboardData)?.map((dept, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">
                        {dept?.department
                          ? DEPARTMENTS.find(
                              (item) => item?.value === dept?.department
                            )?.label
                          : "Unassigned"}
                      </TableCell>
                      <TableCell className="text-center">
                        {dept?.employeeCount}
                      </TableCell>

                      <TableCell className="text-center">
                        {dept?.checkins}
                      </TableCell>
                      <TableCell className="text-center">
                        {dept?.leaves}
                      </TableCell>
                      <TableCell className="text-center">
                        {dept?.requests}
                      </TableCell>
                      <TableCell className="text-center">
                        {dept?.totalEvents}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(dept?.avgEventsPerEmployee, 1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          {hasAttendanceData ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Daily Attendance Trend
                    </CardTitle>
                    <CardDescription>
                      Recent attendance records across all locations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.attendance?.dailyAttendance?.map(
                        (day, index) => (
                          <div key={index} className="space-y-2 py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {formatDate(day?._id)}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {day?.totalCheckins} check-ins
                                </Badge>
                                <Badge variant="secondary">
                                  {day?.totalUniqueEmployees}{" "}
                                  {day?.totalUniqueEmployees > 1
                                    ? "unique employees"
                                    : "unique employee"}
                                </Badge>
                              </div>
                            </div>
                            {index !==
                              dashboardData?.attendance?.dailyAttendance
                                ?.length -
                                1 && (
                              <div className="border-b border-gray-200 w-full" />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Attendance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Weekly Attendance Overview
                    </CardTitle>
                    <CardDescription>
                      Daily attendance breakdown for the current week
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {dashboardData?.attendance?.dailyAttendance?.map(
                        (day, index) => (
                          <div
                            key={index}
                            className="text-center p-4 border rounded-lg"
                          >
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              {new Date(day?._id).toLocaleDateString("en-US", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <div className="text-2xl font-bold mb-1">
                              {day?.totalUniqueEmployees}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {day?.totalCheckins} check-ins
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>
                    Overview of attendance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {dashboardData?.attendance?.dailyAttendance?.reduce(
                          (sum, day) => sum + (day?.totalCheckins || 0),
                          0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Check-ins
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {dashboardData?.attendance?.dailyAttendance?.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Days Tracked
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatNumber(
                          dashboardData?.attendance?.summary?.avgDailyAttendance
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Check-ins/Day
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  No Attendance Data
                </CardTitle>
                <CardDescription>
                  No attendance records available for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Attendance data will appear here once employees start checking
                  in.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leave Types</CardTitle>
                <CardDescription>Breakdown by leave category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.leaves?.leaveTypes?.map((leave, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium capitalize">
                          {leave?._id}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {leave?.totalDaysRequested} total days requested
                          </span>
                        </p>
                        <Badge variant="outline">
                          {leave?.totalRequests}{" "}
                          {leave?.totalRequests > 1 ? "requests" : "request"}
                        </Badge>
                      </div>
                      {index !==
                        dashboardData?.leaves?.leaveTypes?.length - 1 && (
                        <div className="border-b border-gray-200 w-full" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Leave Breakdown</CardTitle>
                <CardDescription>Leave requests by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {departmentBreakdown(dashboardData)?.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium capitalize">
                            {
                              DEPARTMENTS.find(
                                (item) => item?.value === dept?._id
                              )?.label
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {dept?.totalDays} total days
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {dept?.totalRequests}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            requests
                          </div>
                        </div>
                      </div>
                      {index !==
                        departmentBreakdown(dashboardData)?.length - 1 && (
                        <div className="border-b border-gray-200 w-full" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department Leave Details</CardTitle>
              <CardDescription>
                Detailed breakdown of leave requests by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Avg Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentBreakdown(dashboardData)?.map((dept, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">
                        {
                          DEPARTMENTS.find((item) => item?.value === dept?._id)
                            ?.label
                        }
                      </TableCell>
                      <TableCell>{dept?.totalRequests}</TableCell>
                      <TableCell>{dept?.totalDays}</TableCell>
                      <TableCell>
                        {formatNumber(dept?.avgDaysPerRequest, 2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leave Summary</CardTitle>
              <CardDescription>
                Overview of organizational leave metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {dashboardData?.leaves?.summary?.totalLeaveRequests}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Requests
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {dashboardData?.leaves?.summary?.totalLeaveDays}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {dashboardData?.leaves?.summary?.avgDaysPerRequest?.toFixed(
                      2
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Days/Request
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Types</CardTitle>
                <CardDescription>Breakdown by request category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.requests?.requestTypes
                    ?.filter((req) => req?._id)
                    ?.map((request, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {
                              requestTypes.find(
                                (item) => item?.value === request?._id
                              )?.label
                            }
                          </span>
                          <Badge variant="outline">
                            {request?.totalRequests} requests
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {request?.statusBreakdown?.map((status, idx) => (
                            <Badge
                              key={idx}
                              variant={getPriorityColor(status?.priority)}
                              size="sm"
                            >
                              {status?.priority || "normal"}: {status?.count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Requests awaiting action</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.requests?.pendingRequests?.map(
                    (pending, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium capitalize">
                            {pending?._id} Priority
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Oldest: {formatDateTime(pending?.oldestRequest)}
                          </div>
                        </div>
                        <Badge variant={getPriorityColor(pending?._id)}>
                          {pending?.count} pending
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>
                Detailed breakdown of organizational requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Total Requests</TableHead>
                    <TableHead>High Priority</TableHead>
                    <TableHead>Medium Priority</TableHead>
                    <TableHead>Low Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.requests?.requestTypes
                    ?.filter((req) => req?._id)
                    ?.map((request, index) => {
                      const highPriority =
                        request?.statusBreakdown?.find(
                          (s) => s?.priority === "high"
                        )?.count || 0;
                      const mediumPriority =
                        request?.statusBreakdown?.find(
                          (s) => s?.priority === "medium"
                        )?.count || 0;
                      const lowPriority =
                        request?.statusBreakdown?.find(
                          (s) => s?.priority === "low"
                        )?.count || 0;
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium capitalize">
                            {
                              requestTypes.find(
                                (item) => item?.value === request?._id
                              )?.label
                            }
                          </TableCell>
                          <TableCell>{request?.totalRequests}</TableCell>
                          <TableCell>{highPriority}</TableCell>
                          <TableCell>{mediumPriority}</TableCell>
                          <TableCell>{lowPriority}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
              <CardDescription>
                Overview of organizational request metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-around">
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold">
                    {dashboardData?.requests?.summary?.totalRequests}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Requests
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-red-500">
                    {dashboardData?.requests?.summary?.totalPending}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
