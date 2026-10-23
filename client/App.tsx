import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

// Pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import AdminRooms from "./pages/admin/Rooms";
import AdminAllocations from "./pages/admin/Allocations";
import AdminBlocks from "./pages/admin/Blocks";
import OccupiedRooms from "./pages/admin/OccupiedRooms";
import AdminSettings from "./pages/admin/Settings";
import AddStudent from "./pages/admin/AddStudent";
import AddExistingStudent from "./pages/admin/AddExistingStudent";
import AddRoom from "./pages/admin/AddRoom";
import AddAllocation from "./pages/admin/AddAllocation";
import EditAllocation from "./pages/admin/EditAllocation";
import ViewAllocationDetails from "./pages/admin/ViewAllocationDetails";
import AddBlock from "./pages/admin/AddBlock";
import EditBlock from "./pages/admin/EditBlock";
import ViewBlockDetails from "./pages/admin/ViewBlockDetails";
import EditRoom from "./pages/admin/EditRoom";
import EditStudent from "./pages/admin/EditStudent";
import ViewStudentDetails from "./pages/admin/ViewStudentDetails";

// Student Pages
import StudentLogin from "./pages/student/Login";
import StudentAllocationStatus from "./pages/student/AllocationStatus";
import StudentAllocationLetter from "./pages/student/AllocationLetter";
import StudentRoomRequest from "./pages/student/RoomRequest";
import StudentProfile from "./pages/student/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/add"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddStudent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/add-existing"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddExistingStudent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/edit/:studentId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditStudent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/view/:studentId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ViewStudentDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rooms"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rooms/add"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rooms/edit/:roomId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/occupied-rooms"
              element={
                <ProtectedRoute requiredRole="admin">
                  <OccupiedRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/allocations"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAllocations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/allocations/add"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddAllocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/allocations/edit/:allocationId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditAllocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/allocations/view/:allocationId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ViewAllocationDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blocks"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminBlocks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blocks/add"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddBlock />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blocks/edit/:blockId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditBlock />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/blocks/view/:blockId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ViewBlockDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route
              path="/student/allocation-status"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentAllocationStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/allocation-letter"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentAllocationLetter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/room-request"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentRoomRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentProfile />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
