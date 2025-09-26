import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ReceptionistDashboard() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Receptionist Dashboard">
      <div className="px-4 lg:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Receptionist Dashboard</h1>
            <p className="text-muted-foreground">
              Manage guest services and operations
            </p>
          </div>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Receptionist Dashboard</CardTitle>
            <CardDescription>
              Guest management features will be implemented here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This dashboard will contain booking management, check-in/check-out processes, and guest service features.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
              <IconUserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                5 completed, 3 pending
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Check-outs</CardTitle>
              <IconUserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">
                4 completed, 2 pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
              <IconBed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Out of 45 total rooms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Validations</CardTitle>
              <IconClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Check-in/Check-out</CardTitle>
              <CardDescription>
                Process guest arrivals and departures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/receptionist/bookings/checkin">
                  Process Check-in
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/receptionist/bookings/checkout">
                  Process Check-out
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>
                Handle reservations and direct bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/receptionist/bookings">
                  View All Bookings
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/receptionist/bookings/direct">
                  Create Direct Booking
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Room Status</CardTitle>
              <CardDescription>
                Monitor room availability and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/receptionist/rooms">
                  Room Overview
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/receptionist/rooms/maintenance">
                  Maintenance Requests
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Check-ins</CardTitle>
              <CardDescription>
                Guests arriving today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">Room 101 • 14:00</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Jane Smith</p>
                    <p className="text-sm text-muted-foreground">Room 205 • 15:30</p>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mike Johnson</p>
                    <p className="text-sm text-muted-foreground">Room 303 • 16:00</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Check-outs</CardTitle>
              <CardDescription>
                Guests departing today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sarah Wilson</p>
                    <p className="text-sm text-muted-foreground">Room 102 • 11:00</p>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">David Brown</p>
                    <p className="text-sm text-muted-foreground">Room 204 • 12:00</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lisa Davis</p>
                    <p className="text-sm text-muted-foreground">Room 301 • 13:00</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validation Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Queue</CardTitle>
            <CardDescription>
              Bookings requiring validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Booking #BK001</p>
                  <p className="text-sm text-muted-foreground">Payment verification required</p>
                </div>
                <Button size="sm" variant="outline">
                  Validate
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Booking #BK002</p>
                  <p className="text-sm text-muted-foreground">ID verification pending</p>
                </div>
                <Button size="sm" variant="outline">
                  Validate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
