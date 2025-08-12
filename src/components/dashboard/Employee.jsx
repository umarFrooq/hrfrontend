"use client";

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
  UserCheck,
  CalendarDays,
  ClipboardList,
  Plus,
  Clock,
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
  switch (eventType) {
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

export default function EmployeeDashboard({ dashboardData }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          Personal overview of your activities, requests, and leave status
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
              {getEventIcon(item?.eventType?.split(":")[0])}
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaves">My Leaves</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pending Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Items
                </CardTitle>
                <CardDescription>
                  Items awaiting approval or action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Pending Requests</div>
                    <div className="text-sm text-muted-foreground">
                      {dashboardData?.requests?.summary?.totalPending}{" "}
                      {dashboardData?.requests?.summary?.totalPending > 1
                        ? "requests"
                        : "request"}
                      still pending
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {dashboardData?.requests?.summary?.totalPending}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {dashboardData?.requests?.pendingRequests
                    ?.slice(0, 4)
                    ?.map((pending, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <span className="capitalize">
                          {pending?._id} Priority
                        </span>
                        <Badge
                          variant={getPriorityColor(pending?._id)}
                          size="sm"
                        >
                          {pending?.count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest actions and updates
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
                          {getEventIcon(event?.eventType?.split(":")[0])}
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

          {/* Personal Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData?.requests?.summary?.totalRequests}
                </div>
                <p className="text-sm text-muted-foreground">
                  {dashboardData?.requests?.summary?.totalPending} pending
                  approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leave Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {dashboardData?.leaves?.summary?.totalLeaveDays}
                </div>
                <p className="text-sm text-muted-foreground">
                  Used {dashboardData?.leaves?.summary?.totalLeaveRequests}{" "}
                  {dashboardData?.leaves?.summary?.totalLeaveRequests > 1
                    ? "days"
                    : "day"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {dashboardData?.leaves?.departmentBreakdown[0]?._id ||
                    "Sales"}
                </div>
                <p className="text-sm text-muted-foreground">
                  Your current department
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>My Leave Balance</CardTitle>
                <CardDescription>Available leave days by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.leaves?.leaveTypes?.map((leave, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium capitalize">
                          {leave._id}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {leave.totalDaysRequested}
                            {leave.totalDaysRequested > 1
                              ? " total days"
                              : ""}{" "}
                            requested
                          </span>
                        </p>
                        <Badge variant="outline">
                          {leave.totalRequests}
                          {leave.totalRequests > 1 ? " requests" : " request"}
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
                <CardTitle>Leave History</CardTitle>
                <CardDescription>Your recent leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.leaves?.leaveTypes?.map((leave, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {leave?._id} Leave
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {leave?.totalDaysRequested} total days requested •{" "}
                        {leave?.totalRequests} total requests
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Department:{" "}
                        {
                          DEPARTMENTS.find(
                            (department) =>
                              department?.value ===
                              leave?.statusBreakdown[0]?.department
                          )?.label
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leave Summary</CardTitle>
              <CardDescription>Overview of your leave usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {dashboardData?.leaves?.summary?.totalLeaveRequests}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Leave Requests
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {dashboardData?.leaves?.summary?.totalLeaveDays}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Leave Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatNumber(
                      dashboardData?.leaves?.summary?.avgDaysPerRequest || 0,
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
                <CardTitle>My Requests</CardTitle>
                <CardDescription>All your submitted requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.requests?.requestTypes?.map(
                    (request, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {
                              requestTypes.find(
                                (type) => type?.value === request?._id
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
                              variant={getPriorityColor(status.priority)}
                              size="sm"
                            >
                              {status?.priority}: {status?.count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Requests awaiting approval</CardDescription>
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
                            {pending?._id} Priority Requests
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
                Detailed breakdown of your requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Total Requests</TableHead>
                    <TableHead>High Priority</TableHead>
                    <TableHead>Low Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.requests?.requestTypes?.map(
                    (request, index) => {
                      const highPriority =
                        request?.statusBreakdown?.find(
                          (s) => s?.priority === "high"
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
                                (type) => type?.value === request?._id
                              )?.label
                            }
                          </TableCell>
                          <TableCell>{request?.totalRequests}</TableCell>
                          <TableCell>{highPriority}</TableCell>
                          <TableCell>{lowPriority}</TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
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
