import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
export default async function CustomerDashboard() {
  // Ensure user has customer role
  await requireRole(["CUSTOMER"])

  return (
    <DashboardLayout title="Customer Dashboard">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back!</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Customer Dashboard</CardTitle>
            <CardDescription>
              Customer features will be implemented here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This dashboard will contain booking management, favorites, and personalized recommendations.
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
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Current reservations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Properties</CardTitle>
              <IconHeart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Saved for later
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stays</CardTitle>
              <IconHome className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Completed bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <IconBell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Unread messages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Your Next Stay</CardTitle>
              <CardDescription>
                Discover amazing kos properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/">
                  <IconSearch className="mr-2 h-4 w-4" />
                  Browse Properties
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/search?location=jakarta">
                  <IconMapPin className="mr-2 h-4 w-4" />
                  Search by Location
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>
                Manage your reservations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/customer/bookings/active">
                  View Active Bookings
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/customer/bookings/history">
                  Booking History
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/customer/profile">
                  Edit Profile
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/customer/favorites">
                  My Favorites
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Bookings */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Bookings</CardTitle>
              <CardDescription>
                Your active reservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Kos Mawar Indah</p>
                    <p className="text-sm text-muted-foreground">Room 205 • Jakarta Selatan</p>
                    <p className="text-xs text-muted-foreground">Check-in: Dec 15, 2024</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Kos Melati Residence</p>
                    <p className="text-sm text-muted-foreground">Room 101 • Bandung</p>
                    <p className="text-xs text-muted-foreground">Check-in: Jan 1, 2025</p>
                  </div>
                  <Badge variant="outline">Upcoming</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Booking confirmed</p>
                    <p className="text-xs text-muted-foreground">Kos Melati Residence</p>
                  </div>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment completed</p>
                    <p className="text-xs text-muted-foreground">Rp 2,500,000</p>
                  </div>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Property saved</p>
                    <p className="text-xs text-muted-foreground">Kos Anggrek Premium</p>
                  </div>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>
              Properties you might like based on your preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="border rounded-lg p-4">
                <div className="aspect-video bg-muted rounded-md mb-2"></div>
                <h4 className="font-medium">Kos Sakura Modern</h4>
                <p className="text-sm text-muted-foreground">Jakarta Pusat</p>
                <p className="text-sm font-medium">Rp 2,800,000/month</p>
                <Button size="sm" className="w-full mt-2" variant="outline">
                  View Details
                </Button>
              </div>
              <div className="border rounded-lg p-4">
                <div className="aspect-video bg-muted rounded-md mb-2"></div>
                <h4 className="font-medium">Kos Dahlia Executive</h4>
                <p className="text-sm text-muted-foreground">Bandung</p>
                <p className="text-sm font-medium">Rp 2,200,000/month</p>
                <Button size="sm" className="w-full mt-2" variant="outline">
                  View Details
                </Button>
              </div>
              <div className="border rounded-lg p-4">
                <div className="aspect-video bg-muted rounded-md mb-2"></div>
                <h4 className="font-medium">Kos Tulip Residence</h4>
                <p className="text-sm text-muted-foreground">Surabaya</p>
                <p className="text-sm font-medium">Rp 1,900,000/month</p>
                <Button size="sm" className="w-full mt-2" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
