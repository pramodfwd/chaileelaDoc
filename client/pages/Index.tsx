import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUp, Users, BarChart3, Lock } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Auto-redirect to appropriate dashboard
      if (parsedUser.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    }
  }, [navigate]);

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 shadow-sm  ">
        <div className="text-2xl font-bold text-amber-900">
          ☕ Shivshakti Cafe
        </div>
        <Button
          onClick={() => navigate("/login")}
          className="bg-amber-600 hover:bg-amber-700"
        >
          Login
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            Document Management
            <span className="text-amber-600"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Shivshakti Cafe & Restaurant's modern document management system.
            Store, organize, and manage all your business documents with ease.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8"
            >
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <FileUp className="w-8 h-8 text-amber-600 mb-2" />
              <CardTitle>Easy Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload PDFs, images, videos, and more. Simple drag-and-drop
                interface.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Admin controls to manage employees, block/unblock users, and
                monitor activity.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track uploads, monitor statistics, and view activity logs in
                real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition">
            <CardHeader>
              <Lock className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-based access control, JWT authentication, and secure file
                storage.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-amber-600">
                1
              </div>
              <h3 className="text-lg font-semibold">Login</h3>
              <p className="text-gray-600">
                Sign in with your email and password. Sessions persist across
                devices.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-blue-600">
                2
              </div>
              <h3 className="text-lg font-semibold">Upload</h3>
              <p className="text-gray-600">
                Drag and drop or click to upload documents. Support for all file
                types.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold text-green-600">
                3
              </div>
              <h3 className="text-lg font-semibold">Manage</h3>
              <p className="text-gray-600">
                View, download, filter, and manage your documents with ease.
              </p>
            </div>
          </div>
        </div>

        {/* User Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="text-2xl">👨‍💼 Admin</CardTitle>
              <CardDescription>Full control and access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>✓ View all documents</p>
              <p>✓ Manage employees</p>
              <p>✓ Block/Unblock users</p>
              <p>✓ View activity logs</p>
              <p>✓ Dashboard analytics</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl">👤 Employee</CardTitle>
              <CardDescription>Limited access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>✓ Login to account</p>
              <p>✓ Upload documents</p>
              <p>✓ View own documents</p>
              <p>✓ Download documents</p>
              <p>✓ Manage profile</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg p-12 text-center text-white space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg opacity-90">
            Demo credentials: admin@cafe.com / admin123
          </p>
          <Button
            size="lg"
            className="bg-white text-amber-600 hover:bg-gray-100 font-semibold px-8"
            onClick={() => navigate("/login")}
          >
            Login Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2024 Shivshakti Cafe & Restaurant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
