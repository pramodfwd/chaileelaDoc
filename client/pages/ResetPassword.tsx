import { Button } from "@/components/ui/button";
import { set } from "mongoose";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ResetPassword({ userId }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [userDetails, setUserDetails] = useState<any>([]);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [emailExists, setEmailExists] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL || "/api";

  const timeoutRef = useRef(null);

  // 🔹 API call function
  const checkEmailExists = async (emailValue) => {
    try {
      setLoading(true);

      const match = userDetails.employees.filter(
        (emp: any) => emp.email.toLowerCase() === emailValue.toLowerCase(),
      );
      if (match.length > 0) {
        setUserDetails(match[0]);
        setEmailExists(true);
      } else {
        setEmailExists(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 When user leaves input
  const handleBlur = () => {
    if (!email) return;

    // clear previous timer
    clearTimeout(timeoutRef.current);

    // start new 4 sec timer
    timeoutRef.current = setTimeout(() => {
      checkEmailExists(email);
    }, 3000);
  };

  const fetchData = async () => {
    try {
      const employeesRes = await fetch(`/api/employees`);

      if (!employeesRes.ok) {
        throw new Error("Failed to fetch employees");
      }
      const employees = await employeesRes.json();
      setUserDetails(employees);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load dashboard data: " + String(error));
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!currentPassword || !newPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userDetails.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      console.log("🚀 ~ handleSubmit ~ data:", data);

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setMessage(data.message || "Password reset successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setMessage("");
    setError("");
    setEmailExists(true);

    fetchData();
  }, []);
  console.log(emailExists);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <input
            type="email"
            name="reset-email"
            autoComplete="off"
            placeholder="Enter email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailExists(true);
            }}
            onBlur={handleBlur}
            className="w-full px-4 py-2 border rounded-lg"
          />

          {loading && (
            <span className="text-sm text-gray-500">Checking email...</span>
          )}

          {!emailExists && !loading && (
            <span className="text-sm text-red-600">
              This email does not exist. Please enter a valid email ID.
            </span>
          )}
          {/* Current Password */}
          <input
            type="password"
            name="current-password-reset"
            autoComplete="new-password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />

          <input
            type="password"
            name="new-password-reset"
            autoComplete="new-password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2596be] hover:bg-[#1f7fa3] disabled:opacity-50 text-white py-2 rounded-lg font-semibold transition duration-300"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
        <div className="text-center">
          <Button
            variant="link"
            className="text-amber-600"
            onClick={() => navigate("/login")}
          >
            login page
          </Button>
        </div>
      </div>
    </div>
  );
}
