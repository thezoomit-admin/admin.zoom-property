import { Navigate, createBrowserRouter } from "react-router-dom";

import MainLayout from "../layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import AllActionLogs from "../pages/ActionLog/AllActionLogs";
import AllErrorLogs from "../pages/ActionLog/AllErrorLogs";
import Areas from "../pages/Areas/Areas";
import CreateArea from "../pages/Areas/CreateArea";
import UpdateArea from "../pages/Areas/UpdateArea";
import Blog from "../pages/Blog/Blog";
import BlogCategories from "../pages/Blog/BlogCategories";
import BlogComments from "../pages/Blog/BlogComments";
import Dashboard from "../pages/Dashboard/Dashboard";
import ErrorPage from "../pages/ErrorPage/ErrorPage";
import ContactMessages from "../pages/Inquiries/ContactMessage";
import QuotationRequests from "../pages/Inquiries/QuotationRequests";
import ForgotPassword from "../pages/Login/ForgotPassword";
import Login from "../pages/Login/Login";
import ResetPassword from "../pages/Login/ResetPassword";
import AllMediaLibraryList from "../pages/media-library/AllMediaLibraryList";
import AllNotifications from "../pages/Notifications/AllNotifications";
import Profile from "../pages/Profile/Profile";
import CmsPage from "../pages/CMS/CmsPage";
import CreatePost from "../pages/Blog/CreatePost";
import UpdatePost from "../pages/Blog/UpdatePost";
import Landowners from "../pages/Landowners/Landowners";
import ShowcaseVideos from "../pages/ShowcaseVideos/ShowcaseVideos";
import CreateProject from "../pages/Projects/CreateProject";
import ProjectLandingPage from "../pages/Projects/ProjectLandingPage";
import Projects from "../pages/Projects/Projects";
import UpdateProject from "../pages/Projects/UpdateProject";
import CreateProperty from "../pages/Properties/CreateProperty";
import Properties from "../pages/Properties/Properties";
import PropertyDetails from "../pages/Properties/PropertyDetails";
import UpdateProperty from "../pages/Properties/UpdateProperty";
import Reports from "../pages/Reports/Reports";
import Reviews from "../pages/Reviews/Reviews";
import Amenities from "../pages/Settings/Amenities/Amenities";
import Designation from "../pages/Settings/Desgination/Designation";
import PropertyTypes from "../pages/Settings/Amenities/PropertyTypes";
import MediaBin from "../pages/Settings/MediaBin/MediaBin";
import NotificationSounds from "../pages/Settings/NotificationSounds/NotificationSounds";
import ServicesCountries from "../pages/Settings/ServicesCountries/ServicesCountries";
import UserGuide from "../pages/UserGuide/UserGuide";
import EmployeeDetails from "../pages/Users/EmployeeDetails";
import RolePermissions from "../pages/Users/RolePermissions";
import Roles from "../pages/Users/Roles";
import Users from "../pages/Users/Users";
import Agents from "../pages/Agents/Agents";

const routes = [
  {
    path: "/",
    errorElement: <ErrorPage />,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),

    children: [
      { path: "/", element: <Dashboard /> },

      {
        path: "properties",
        children: [
          { path: "", element: <Properties /> },
          { path: "create", element: <CreateProperty /> },
          { path: "edit/:id", element: <UpdateProperty /> },
          { path: "view/:id", element: <PropertyDetails /> },
        ],
      },
      {
        path: "projects",
        children: [
          { path: "", element: <Projects /> },
          { path: "create", element: <CreateProject /> },
          { path: "edit/:id", element: <UpdateProject /> },
          { path: ":id/landing", element: <ProjectLandingPage /> },
        ],
      },
      {
        path: "areas",
        children: [
          { path: "", element: <Areas /> },
          { path: "create", element: <CreateArea /> },
          { path: "edit/:id", element: <UpdateArea /> },
        ],
      },
      { path: "cms/:pageId", element: <CmsPage /> },
      { path: "showcase-videos", element: <ShowcaseVideos /> },
      { path: "landowners", element: <Landowners /> },

      /* ── Content ─────────────────────────────────────────────────────── */
      {
        path: "blog",
        children: [
          { path: "", element: <Blog /> },
          { path: "categories", element: <BlogCategories /> },
          { path: "comments", element: <BlogComments /> },
          { path: "create", element: <CreatePost /> },
          { path: "edit/:id", element: <UpdatePost /> },
        ],
      },
      { path: "reviews", element: <Reviews /> },

      /* ── Enquiries ─────────────────────────────────────────────────── */
      {
        path: "enquiries",
        children: [
          { path: "contact-messages", element: <ContactMessages /> },
          { path: "quotation-requests", element: <QuotationRequests /> },
        ],
      },
      {
        path: "inquiries",
        children: [
          {
            path: "contact-message",
            element: <Navigate to="/enquiries/contact-messages" replace />,
          },
          {
            path: "quotation-request",
            element: <Navigate to="/enquiries/quotation-requests" replace />,
          },
          { path: "notifications", element: <AllNotifications /> },
        ],
      },

      /* ── People ──────────────────────────────────────────────────────── */
      {
        path: "employees",
        children: [
          { path: "", element: <Users /> },
          { path: "create", element: <Navigate to="/employees" replace /> },
          { path: "edit/:id", element: <Navigate to="/employees" replace /> },
          { path: "view/:id", element: <EmployeeDetails /> },
          { path: "roles", element: <Navigate to="/settings/roles" replace /> },
          {
            path: "roles/:id/permissions",
            element: <Navigate to="/settings/roles" replace />,
          },
          { path: "designations", element: <Designation /> },
          { path: "agents", element: <Agents /> },
        ],
      },
      {
        path: "users",
        children: [
          { path: "", element: <Users /> },
          { path: "roles", element: <Roles /> },
          { path: "designations", element: <Designation /> },
        ],
      },

      { path: "reports", element: <Reports /> },

      /* ── Everything else ─────────────────────────────────────────────── */
      {
        path: "logs",
        children: [
          { path: "actions", element: <AllActionLogs /> },
          { path: "errors", element: <AllErrorLogs /> },
        ],
      },
      { path: "action-logs", element: <AllActionLogs /> },
      { path: "notifications", element: <AllNotifications /> },
      { path: "user-guide", element: <UserGuide /> },
      {
        path: "media-library",
        element: <Navigate to="/settings/media-library" replace />,
      },

      {
        path: "settings",
        children: [
          { path: "profile", element: <Profile /> },
          { path: "roles", element: <Roles /> },
          { path: "roles/:id/permissions", element: <RolePermissions /> },
          { path: "amenities", element: <Amenities /> },
          { path: "property-types", element: <PropertyTypes /> },
          { path: "designation", element: <Designation /> },
          { path: "services-countries", element: <ServicesCountries /> },
          { path: "notification-sounds", element: <NotificationSounds /> },
          { path: "media-library", element: <AllMediaLibraryList /> },
          { path: "media-bin", element: <MediaBin /> },
        ],
      },
    ],
  },
  { path: "404", element: <ErrorPage /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
];

const router = createBrowserRouter(routes);

export default router;
