import { RequestHandler } from "express";
import { Employee } from "../models/Employee";
import { User } from "../models/User";
import { Document } from "../models/Document";

export const handleGetEmployees: RequestHandler = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });

    // Get document counts for each employee
    const employeesWithCounts = await Promise.all(
      employees.map(async (emp) => {
        const docCount = await Document.countDocuments({
          uploadedBy: emp.userId,
        });
        const empObj = emp.toObject();
        return {
          id: empObj._id.toString(),
          email: empObj.email,
          name: empObj.name,
          role: empObj.role,
          isActive: empObj.isActive,
          createdAt: empObj.createdAt,
          documentsCount: docCount,
        };
      })
    );

    res.json({ success: true, employees: employeesWithCounts });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch employees",
    });
  }
};

export const handleAddEmployee: RequestHandler<
  any,
  { success: boolean; employee?: any; error?: string },
  { email: string; name: string; password: string }
> = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      res.status(400).json({ success: false, error: "Employee already exists" });
      return;
    }

    // Create user in User model
    const newUser = await User.create({
      email,
      password,
      name,
      role: "employee",
    });

    // Create employee in Employee model
    const newEmployee = await Employee.create({
      email,
      name,
      userId: newUser._id,
      role: "employee",
      isActive: true,
      documentsCount: 0,
    });

    // Convert MongoDB response to expected format
    const empObj = newEmployee.toObject();
    const responseEmployee = {
      id: empObj._id.toString(),
      email: empObj.email,
      name: empObj.name,
      role: empObj.role,
      isActive: empObj.isActive,
      createdAt: empObj.createdAt,
      documentsCount: 0,
    };

    res.json({ success: true, employee: responseEmployee });
  } catch (error) {
    console.error("Add employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add employee",
    });
  }
};

export const handleUpdateEmployee: RequestHandler<
  any,
  { success: boolean; employee?: any; error?: string },
  { id: string; name?: string; isActive?: boolean }
> = async (req, res) => {
  try {
    const { id, name, isActive } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { ...(name && { name }), ...(isActive !== undefined && { isActive }) },
      { new: true }
    );

    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    res.json({ success: true, employee });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update employee",
    });
  }
};

export const handleDeleteEmployee: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    // Also delete the associated user
    await User.findByIdAndDelete(employee.userId);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete employee",
    });
  }
};

export const handleBlockEmployee: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    // Convert MongoDB response to expected format
    const empObj = employee.toObject();
    const responseEmployee = {
      id: empObj._id.toString(),
      email: empObj.email,
      name: empObj.name,
      role: empObj.role,
      isActive: empObj.isActive,
      createdAt: empObj.createdAt,
      documentsCount: empObj.documentsCount || 0,
    };

    res.json({ success: true, employee: responseEmployee });
  } catch (error) {
    console.error("Block employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to block employee",
    });
  }
};

export const handleUnblockEmployee: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    // Convert MongoDB response to expected format
    const empObj = employee.toObject();
    const responseEmployee = {
      id: empObj._id.toString(),
      email: empObj.email,
      name: empObj.name,
      role: empObj.role,
      isActive: empObj.isActive,
      createdAt: empObj.createdAt,
      documentsCount: empObj.documentsCount || 0,
    };

    res.json({ success: true, employee: responseEmployee });
  } catch (error) {
    console.error("Unblock employee error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to unblock employee",
    });
  }
};
