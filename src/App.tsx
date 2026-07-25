import { Routes, Route, Navigate } from "react-router-dom";
import { AddPropertyProvider } from "@/lib/AddPropertyContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/screens/Login";
import Home from "@/screens/Home";
import MyProperties from "@/screens/MyProperties";
import Search from "@/screens/Search";
import Saved from "@/screens/Saved";
import Profile from "@/screens/Profile";
import EditProfile from "@/screens/EditProfile";
import VisitorsEnquiries from "@/screens/VisitorsEnquiries";
import PublicPropertyDetails from "@/screens/PublicPropertyDetails";
import OwnerPropertyDetails from "@/screens/OwnerPropertyDetails";
import AgencyProfile from "@/screens/AgencyProfile";
import ReportProperty from "@/screens/ReportProperty";
import PropertyReviews from "@/screens/PropertyReviews";
import ChooseRole from "@/screens/AddProperty/ChooseRole";
import DetailsStep1 from "@/screens/AddProperty/DetailsStep1";
import MediaStep2 from "@/screens/AddProperty/MediaStep2";
import MoreInfoStep3 from "@/screens/AddProperty/MoreInfoStep3";
import ReviewStep4 from "@/screens/AddProperty/ReviewStep4";
import Success from "@/screens/AddProperty/Success";
import ComingSoon from "@/screens/ComingSoon";

// Admin Screens
import AdminLayout from "@/screens/Admin/AdminLayout";
import AdminLogin from "@/screens/Admin/Login";
import AdminDashboard from "@/screens/Admin/Dashboard";
import AdminUsers from "@/screens/Admin/Users";
import AdminUserDetails from "@/screens/Admin/UserDetails";
import AdminProperties from "@/screens/Admin/Properties";
import AdminPropertyDetails from "@/screens/Admin/PropertyDetails";
import AdminReportedListings from "@/screens/Admin/ReportedListings";
import AdminAnalytics from "@/screens/Admin/Analytics";
import AdminActivityLogs from "@/screens/Admin/ActivityLogs";
import AdminSettings from "@/screens/Admin/Settings";
import AdminUserReviews from "@/screens/Admin/UserReviews";

export default function App() {
  return (
    <div className="max-w-[420px] mx-auto bg-cream min-h-screen relative">
      <AddPropertyProvider>
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/visitors-enquiries" element={<ProtectedRoute><VisitorsEnquiries /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><ComingSoon title="Settings" /></ProtectedRoute>} />

        <Route path="/my-properties" element={<ProtectedRoute><MyProperties /></ProtectedRoute>} />
        <Route path="/my-properties/:id" element={<ProtectedRoute><OwnerPropertyDetails /></ProtectedRoute>} />

        {/* Public — no auth required to browse */}
        <Route path="/property/:id" element={<PublicPropertyDetails />} />
        <Route path="/property/:id/report" element={<ProtectedRoute><ReportProperty /></ProtectedRoute>} />
        <Route path="/property/:id/reviews" element={<ProtectedRoute><PropertyReviews /></ProtectedRoute>} />
        <Route path="/agency/:id" element={<AgencyProfile />} />

        {/* Add Property wizard — shares form state via AddPropertyProvider */}
        <Route
          path="/add-property/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route index element={<ChooseRole />} />
                <Route path="details" element={<DetailsStep1 />} />
                <Route path="media" element={<MediaStep2 />} />
                <Route path="more-info" element={<MoreInfoStep3 />} />
                <Route path="review" element={<ReviewStep4 />} />
                <Route path="success" element={<Success />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Admin Section */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetails />} />
          <Route path="users/:id/reviews" element={<AdminUserReviews />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/:id" element={<AdminPropertyDetails />} />
          <Route path="reports" element={<AdminReportedListings />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="logs" element={<AdminActivityLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </AddPropertyProvider>
    </div>
  );
}
