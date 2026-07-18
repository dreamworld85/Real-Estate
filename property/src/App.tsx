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
import ChooseRole from "@/screens/AddProperty/ChooseRole";
import DetailsStep1 from "@/screens/AddProperty/DetailsStep1";
import MediaStep2 from "@/screens/AddProperty/MediaStep2";
import MoreInfoStep3 from "@/screens/AddProperty/MoreInfoStep3";
import ReviewStep4 from "@/screens/AddProperty/ReviewStep4";
import Success from "@/screens/AddProperty/Success";
import ComingSoon from "@/screens/ComingSoon";

export default function App() {
  return (
    <div className="max-w-[420px] mx-auto bg-cream min-h-screen relative">
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
        <Route path="/agency/:id" element={<AgencyProfile />} />

        {/* Add Property wizard — shares form state via AddPropertyProvider */}
        <Route
          path="/add-property/*"
          element={
            <ProtectedRoute>
              <AddPropertyProvider>
                <Routes>
                  <Route index element={<ChooseRole />} />
                  <Route path="details" element={<DetailsStep1 />} />
                  <Route path="media" element={<MediaStep2 />} />
                  <Route path="more-info" element={<MoreInfoStep3 />} />
                  <Route path="review" element={<ReviewStep4 />} />
                  <Route path="success" element={<Success />} />
                </Routes>
              </AddPropertyProvider>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
