import { matchPath } from "react-router-dom";

export interface RoutePermission {
  module: string;
  action: string;
  anyOf?: { module: string; action: string }[];
}

export const routePermissions: Record<string, RoutePermission> = {
  "/properties": { module: "Properties", action: "View" },
  "/properties/create": { module: "Properties", action: "Create" },
  "/properties/edit/:id": { module: "Properties", action: "Update" },
  "/properties/view/:id": { module: "Properties", action: "View" },
  "/projects": { module: "Projects", action: "View" },
  "/projects/create": { module: "Projects", action: "Create" },
  "/projects/edit/:id": { module: "Projects", action: "Update" },
  "/areas": { module: "Areas", action: "View" },
  "/cms/:pageId": { module: "Dynamic Content", action: "View" },
  "/showcase-videos": { module: "Showcase Videos", action: "View" },
  "/landowners": { module: "Landowners", action: "View" },

  "/blog": { module: "Blog", action: "View" },
  "/blog/create": { module: "Blog", action: "Create" },
  "/blog/edit/:id": { module: "Blog", action: "Update" },
  "/reviews": { module: "Reviews", action: "View" },

  "/enquiries/contact-messages": {
    module: "Contact Messages",
    action: "View",
  },
  "/enquiries/quotation-requests": {
    module: "Quotation Requests",
    action: "View",
  },
  "/notifications": { module: "Notifications", action: "View" },

  "/media-library": { module: "Media Library", action: "View" },
  "/settings/media-library": { module: "Media Library", action: "View" },
  "/settings/media-bin": { module: "Media Bin", action: "View" },

  "/employees": { module: "Employees", action: "View" },
  "/employees/create": { module: "Employees", action: "Create" },
  "/employees/edit/:id": { module: "Employees", action: "Update" },
  "/employees/view/:id": { module: "Employees", action: "View" },
  "/employees/designations": { module: "Designations", action: "View" },
  "/settings/designation": { module: "Designations", action: "View" },
  "/settings/roles": { module: "Roles", action: "View" },
  "/settings/roles/:id/permissions": { module: "Roles", action: "Permission" },
  "/users": { module: "Employees", action: "View" },
  "/users/roles": { module: "Roles", action: "View" },
  "/users/designations": { module: "Designations", action: "View" },

  "/logs/actions": { module: "Action Logs", action: "View" },
  "/logs/errors": { module: "Error Logs", action: "View" },
  "/action-logs": { module: "Action Logs", action: "View" },

  "/settings/amenities": { module: "Properties", action: "View" },
  "/settings/services-countries": {
    module: "Services Countries",
    action: "View",
  },
  "/settings/budget-ranges": {
    module: "Budget Ranges",
    action: "View",
  },
};

export const getRoutePermission = (
  pathname: string
): RoutePermission | undefined => {
  if (routePermissions[pathname]) return routePermissions[pathname];

  for (const pattern of Object.keys(routePermissions)) {
    if (pattern === pathname) continue;
    if (matchPath({ path: pattern, end: true }, pathname)) {
      return routePermissions[pattern];
    }
  }
  return undefined;
};
