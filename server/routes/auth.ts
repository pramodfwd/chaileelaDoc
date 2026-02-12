import { RequestHandler } from "express";
import { User } from "../models/User";

// Simple token encoding/decoding (for demo purposes)
const encodeToken = (data: any): string => {
  return Buffer.from(JSON.stringify(data)).toString("base64");
};

const decodeToken = (token: string): any => {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: { id: string; email: string; name: string; role: string };
  error?: string;
}

export const handleLogin: RequestHandler<
  any,
  LoginResponse,
  LoginRequest
> = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const tokenData = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      iat: Date.now(),
    };

    const token = encodeToken(tokenData);

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict" as any,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
};

export const handleLogout: RequestHandler = (req, res) => {
  res.clearCookie("authToken");
  res.json({ success: true });
};

export const handleRegister: RequestHandler<
  any,
  LoginResponse,
  { email: string; password: string; name: string }
> = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, error: "User already exists" });
      return;
    }

    // Create new user
    const newUser = await User.create({
      email,
      password,
      name,
      role: "employee",
    });

    const tokenData = {
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      iat: Date.now(),
    };

    const token = encodeToken(tokenData);

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict" as any,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
};

export const handleVerify: RequestHandler = async (req, res) => {
  try {
    const token =
      req.cookies.authToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ success: false, error: "No token" });
      return;
    }

    const decoded = decodeToken(String(token));

    if (!decoded) {
      res.status(401).json({ success: false, error: "Invalid token" });
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(401).json({ success: false, error: "Invalid token" });
  }
};

export const handleResetPassword: RequestHandler<
  any,
  { success: boolean; message?: string; error?: string },
  { userId: string; currentPassword: string; newPassword: string }
> = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: userId, currentPassword, newPassword",
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    // Verify current password
    if (user.password !== currentPassword) {
      res.status(401).json({ success: false, error: "Current password is incorrect" });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
};
