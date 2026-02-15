import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileUp,
  Users,
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Upload,
  Download,
  Eye,
  Camera,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  documentsCount: number;
}

interface DashboardStats {
  totalUploads: number;
  todayUploads: number;
  monthUploads: number;
  totalSize: number;
  activeEmployees: number;
}

interface PendingFile {
  id: string;
  file: File;
  title: string;
  description: string;
}

interface Document {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  uploadDate: string;
  uploadedBy: string;
  uploadedByName: string;
  category: string;
  fileUrl: string;
  title: string;
  description: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePassword, setNewEmployeePassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedEmployee, setGeneratedEmployee] = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const users = ["Amit Sharma", "Rohit Verma", "Neha Singh", "Pooja Patel"];
  const [open, setOpen] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          navigate("/login");
          return;
        }

        const userData = JSON.parse(userStr);
        if (userData.role !== "admin") {
          navigate("/employee-dashboard");
          return;
        }

        setUser(userData);
        fetchData();
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/login");
      }
    };

    // Use setTimeout to ensure localStorage is accessible
    const timer = setTimeout(checkAuth, 0);
    return () => clearTimeout(timer);
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [employeesRes, statsRes, documentsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/employees`),
        fetch(`${BASE_URL}/api/dashboard/stats`),
        fetch(`${BASE_URL}/api/documents?role=admin`),
      ]);

      const employeesData = await employeesRes.json();
      const statsData = await statsRes.json();
      const documentsData = await documentsRes.json();

      console.log("Employees response:", employeesData);
      console.log("Stats response:", statsData);
      console.log("Documents response:", documentsData);

      if (employeesData.success) {
        setEmployees(employeesData.employees || []);
      } else {
        console.error("Employees API error:", employeesData.error);
        toast.error(
          "Failed to load employees: " +
            (employeesData.error || "Unknown error"),
        );
      }

      if (statsData.success) {
        setStats(statsData.stats);
      } else {
        console.error("Stats API error:", statsData.error);
      }

      if (documentsData.success) {
        setDocuments(documentsData.documents || []);
      } else {
        console.error("Documents API error:", documentsData.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load dashboard data: " + String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeEmail || !newEmployeeName || !newEmployeePassword) {
      toast.error("Please fill all fields (Email, Name, and Password)");
      return;
    }

    if (newEmployeePassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmployeeEmail,
          name: newEmployeeName,
          password: newEmployeePassword,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmployees([...employees, data.employee]);
        // Show the password confirmation
        setGeneratedEmployee({
          ...data.employee,
          password: newEmployeePassword,
        });
        setShowPasswordModal(true);

        // Reset form
        setNewEmployeeEmail("");
        setNewEmployeeName("");
        setNewEmployeePassword("");
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to add employee");
    }
  };

  const handleBlockEmployee = async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/${id}/block`, {
        method: "PATCH",
      });

      const data = await response.json();
      if (data.success) {
        setEmployees(
          employees.map((e) => (e.id === id ? { ...e, isActive: false } : e)),
        );
        toast.success("Employee blocked");
      }
    } catch (error) {
      toast.error("Failed to block employee");
    }
  };

  const handleUnblockEmployee = async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/${id}/unblock`, {
        method: "PATCH",
      });

      const data = await response.json();
      if (data.success) {
        setEmployees(
          employees.map((e) => (e.id === id ? { ...e, isActive: true } : e)),
        );
        toast.success("Employee unblocked");
      }
    } catch (error) {
      toast.error("Failed to unblock employee");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pendingFile: PendingFile = {
        id: `${Date.now()}-${i}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: "",
      };
      setPendingFiles([...pendingFiles, pendingFile]);
    }

    e.target.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
      }
    } catch (error) {
      console.error("Failed to access camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().toLocaleString().replace(/[/:]/g, "-");
            const file = new File([blob], `photo-${timestamp}.jpg`, {
              type: "image/jpeg",
            });
            const pendingFile: PendingFile = {
              id: `${Date.now()}-camera`,
              file,
              title: `Photo ${timestamp}`,
              description: "",
            };
            setPendingFiles([...pendingFiles, pendingFile]);
            toast.success("Photo added to upload queue");
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  const handlePendingFileUpdate = (
    id: string,
    field: "title" | "description",
    value: string,
  ) => {
    setPendingFiles(
      pendingFiles.map((pf) => (pf.id === id ? { ...pf, [field]: value } : pf)),
    );
  };

  const handleRemovePendingFile = (id: string) => {
    setPendingFiles(pendingFiles.filter((pf) => pf.id !== id));
  };

  const handleSubmitAll = async () => {
    if (!user || pendingFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    const missingTitles = pendingFiles.filter((pf) => !pf.title.trim());
    if (missingTitles.length > 0) {
      toast.error("Please add a title for all selected documents");
      return;
    }

    setSubmitting(true);

    try {
      const documentsData = [];
      for (const pf of pendingFiles) {
        // Only store base64 for images, skip for videos to optimize upload time
        let fileData = "";
        if (pf.file.type.startsWith("image/")) {
          fileData = await fileToBase64(pf.file);
        }

        documentsData.push({
          filename: pf.file.name,
          fileType: pf.file.type,
          size: pf.file.size,
          title: pf.title,
          description: pf.description,
          fileData: fileData,
        });
      }

      const response = await fetch(`${BASE_URL}/api/documents/batch-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents: documentsData,
          userId: user.id,
          userName: user.name,
          category: "general",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Upload error:", response.status, error);
        toast.error(`Upload failed: ${response.status}`);
        setSubmitting(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setDocuments([...data.documents, ...documents]);
        toast.success(
          `Successfully uploaded ${data.documents.length} document${data.documents.length !== 1 ? "s" : ""}!`,
        );
        setPendingFiles([]);

        try {
          await fetch(`${BASE_URL}/api/logs/activity`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              userName: user.name,
              action: "upload",
              documentName: `${data.documents.length} documents`,
            }),
            credentials: "include",
          });
        } catch (logError) {
          console.warn("Failed to log activity:", logError);
        }

        if (data.errors && data.errors.length > 0) {
          toast.warning(`Some files failed: ${data.errors.join(", ")}`);
        }
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/documents/${docId}?role=admin`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        setDocuments(documents.filter((d: any) => d.id !== docId));
        toast.success("Document deleted");
      } else {
        toast.error(data.error || "Failed to delete document");
      }
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/documents/download/${doc.id}`,
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        toast.error(errorData.error || `Download failed (${response.status})`);
        return;
      }

      // Create a blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Document downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getFilteredDocuments = () => {
    let filtered = [...documents];
    console.log("🚀 ~ getFilteredDocuments ~ filtered:", filtered);

    // Filter by user
    if (filterUser) {
      filtered = filtered.filter((doc) =>
        doc.uploadedByName.toLowerCase().includes(filterUser.toLowerCase()),
      );
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter((doc) => {
        const docDate = new Date(doc.uploadDate).getTime();
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate
          ? new Date(endDate).getTime() + 86400000 // Include entire end date
          : Number.MAX_VALUE;
        return docDate >= start && docDate <= end;
      });
    } else if (filterDate) {
      filtered = filtered.filter((doc) => {
        const docDate = new Date(doc.uploadDate).toISOString().split("T")[0];
        return docDate === filterDate;
      });
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime(),
    );
  };

  const displayDocuments = getFilteredDocuments().slice(
    0,
    showMore ? undefined : 5,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">
              ☕ Admin Dashboard
            </h1>
            <p className="text-gray-600">Shivshakti Cafe Document Manager</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {stats.totalUploads}
                </div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.todayUploads}
                </div>
                <p className="text-xs text-gray-500 mt-1">Documents uploaded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.monthUploads}
                </div>
                <p className="text-xs text-gray-500 mt-1">Documents uploaded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {employees.filter((e) => e.isActive).length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Out of {employees.length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="upload">Upload Document</TabsTrigger>
            <TabsTrigger value="documents">All Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle>Employee Management</CardTitle>
                <CardDescription>
                  Add, edit, block, or unblock employees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Employee Form */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold">Add New Employee</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="email"
                      placeholder="Email"
                      className="border rounded px-3 py-2"
                      value={newEmployeeEmail}
                      autoComplete="off"
                      onChange={(e) => setNewEmployeeEmail(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Name"
                      className="border rounded px-3 py-2"
                      value={newEmployeeName}
                      autoComplete="off"
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Password (min 6 chars)"
                      className="border rounded px-3 py-2"
                      value={newEmployeePassword}
                      autoComplete="new-password"
                      onChange={(e) => setNewEmployeePassword(e.target.value)}
                    />
                    <Button
                      onClick={handleAddEmployee}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Password Modal */}
                {showPasswordModal && generatedEmployee && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                      <CardHeader>
                        <CardTitle>✅ Employee Added Successfully</CardTitle>
                        <CardDescription>
                          Share these credentials with the employee
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded border border-blue-200">
                          <p className="text-sm text-gray-600">Email:</p>
                          <p className="font-mono font-bold text-blue-900">
                            {generatedEmployee.email}
                          </p>
                          <p className="text-sm text-gray-600 mt-3">
                            Password:
                          </p>
                          <p className="font-mono font-bold text-blue-900">
                            {generatedEmployee.password}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          ⚠️ Make sure to share this password securely with the
                          employee. They should change it after first login.
                        </p>
                        <Button
                          onClick={() => setShowPasswordModal(false)}
                          className="w-full bg-amber-600 hover:bg-amber-700"
                        >
                          Done
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Employees Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.name}
                          </TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.documentsCount}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                employee.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {employee.isActive ? "Active" : "Blocked"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {employee.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleBlockEmployee(employee.id)
                                  }
                                >
                                  <Lock className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleUnblockEmployee(employee.id)
                                  }
                                >
                                  <Unlock className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>
                  Select multiple documents, add titles and descriptions, then
                  submit all at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Input and Camera */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Files *
                  </label>
                  <div className="flex gap-2">
                    <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition flex-1">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {pendingFiles.length === 0
                            ? "Select PDF, Images, Videos (Max 500 MB each)"
                            : `${pendingFiles.length} file(s) selected`}
                        </p>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        disabled={submitting}
                        className="hidden"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv,.3gp,.m4v,.m3u8,.ts,.mts,.m2ts"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCameraModal(true);
                        setTimeout(startCamera, 100);
                      }}
                      className="flex items-center gap-2 h-50"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Camera</span>
                    </Button>
                  </div>
                </div>

                {/* Pending Files List */}
                {pendingFiles.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-gray-900">
                      Selected Files ({pendingFiles.length})
                    </h3>
                    {pendingFiles.map((pf) => (
                      <div
                        key={pf.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              {pf.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(pf.file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleRemovePendingFile(pf.id)}
                            disabled={submitting}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Document Title *"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={pf.title}
                            onChange={(e) =>
                              handlePendingFileUpdate(
                                pf.id,
                                "title",
                                e.target.value,
                              )
                            }
                            disabled={submitting}
                          />
                          <textarea
                            placeholder="Description (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                            rows={2}
                            value={pf.description}
                            onChange={(e) =>
                              handlePendingFileUpdate(
                                pf.id,
                                "description",
                                e.target.value,
                              )
                            }
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitAll}
                  disabled={submitting || pendingFiles.length === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submitting
                    ? `Uploading ${pendingFiles.length} file(s)...`
                    : `Submit ${pendingFiles.length > 0 ? `${pendingFiles.length} File(s)` : "Documents"}`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>All Documents</CardTitle>
                <CardDescription>
                  View all documents with filtering and preview options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Filter */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600">
                        Specific Date
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        value={filterDate}
                        onChange={(e) => {
                          setFilterDate(e.target.value);
                          setStartDate("");
                          setEndDate("");
                        }}
                      />
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Or select Date Range:
                    </p>
                    <div className="flex gap-2  md:flex-row flex-col">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600">
                          From
                        </label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setFilterDate("");
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-600">
                          To
                        </label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setFilterDate("");
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 relative">
                    <label className="text-xs font-medium text-gray-600">
                      Filter by User Name
                    </label>

                    {/* Select */}
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-2 text-sm mt-1"
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                    >
                      <option value="">Select User</option>
                      {employees.map((user, index) => (
                        <option key={index} value={user.name}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(filterDate || startDate || endDate || filterUser) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setFilterDate("");
                        setStartDate("");
                        setEndDate("");
                        setFilterUser("");
                        setShowMore(false);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {displayDocuments.length === 0 ? (
                  <p className="text-gray-600">
                    {getFilteredDocuments().length === 0
                      ? "No documents uploaded yet"
                      : "No documents match your filters"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {displayDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {doc.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {doc.filename}
                            </p>
                            {doc.description && (
                              <p className="text-sm text-gray-700 mt-1">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex gap-3 text-xs text-gray-500 mt-2 flex-wrap">
                              <span>
                                📅{" "}
                                {new Date(doc.uploadDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                              <span>👤 Uploaded by: {doc.uploadedByName}</span>
                              <span>💾 {(doc.size / 1024).toFixed(2)} KB</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!showMore && getFilteredDocuments().length > 4 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowMore(true)}
                      >
                        Load More ({getFilteredDocuments().length - 5} more)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Take Photo</CardTitle>
              <Button size="sm" variant="ghost" onClick={stopCamera}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={stopCamera}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={capturePhoto}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white border-b">
              <CardTitle>{previewDoc.title}</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewDoc(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">File:</span>{" "}
                  {previewDoc.filename}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Uploaded by:</span>{" "}
                  {previewDoc.uploadedByName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(previewDoc.uploadDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Size:</span>{" "}
                  {(previewDoc.size / 1024).toFixed(2)} KB
                </p>
              </div>

              {previewDoc.description && (
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Description:
                  </p>
                  <p className="text-sm text-gray-600">
                    {previewDoc.description}
                  </p>
                </div>
              )}

              {previewDoc.fileType.startsWith("image/") && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={`/api/documents/view/${previewDoc.id}`}
                    alt={previewDoc.title}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPreviewDoc(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={() =>
                    (window.location.href = `/api/documents/download/${previewDoc.id}`)
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
