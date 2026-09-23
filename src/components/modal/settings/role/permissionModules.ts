export interface PermissionModule {
  module: string;
  permissions: string[];
  group: string;
}

const CRUD = ["View", "Create", "Update", "Delete"];

export const PERMISSION_GROUP_ORDER: string[] = [
  "Dashboard",
  "Listings",
  "Content",
  "Website CMS",
  "Enquiries",
  "Employee Management",
  "Media Library",
  "Logs",
  "Settings",
];

export const DASHBOARD_CARD_MODULES = [
  "Listings Summary",
  "Projects Summary",
  "Enquiries Summary",
  "Content Summary",
  "Listing Trend",
] as const;

export const PERMISSION_MODULES: PermissionModule[] = [
  ...DASHBOARD_CARD_MODULES.map((module) => ({
    module,
    permissions: ["View"],
    group: "Dashboard",
  })),

  { module: "Properties", permissions: CRUD, group: "Listings" },
  { module: "Projects", permissions: CRUD, group: "Listings" },
  { module: "Areas", permissions: CRUD, group: "Listings" },
  { module: "Landowners", permissions: CRUD, group: "Listings" },
  { module: "Showcase Videos", permissions: CRUD, group: "Listings" },

  { module: "Blog", permissions: CRUD, group: "Content" },
  { module: "Reviews", permissions: CRUD, group: "Content" },
  
  { module: "Dynamic Content", permissions: CRUD, group: "Website CMS" },

  {
    module: "Media Library",
    permissions: ["View", "Create", "Delete"],
    group: "Media Library",
  },

  {
    module: "Contact Messages",
    permissions: ["View", "Update", "Delete"],
    group: "Enquiries",
  },
  {
    module: "Quotation Requests",
    permissions: ["View", "Update", "Delete"],
    group: "Enquiries",
  },
  {
    module: "Notifications",
    permissions: ["View", "Delete"],
    group: "Enquiries",
  },

  {
    module: "Employees",
    permissions: [...CRUD, "Change Password"],
    group: "Employee Management",
  },
  { module: "Agents", permissions: CRUD, group: "Employee Management" },
  {
    module: "Roles",
    permissions: [...CRUD, "Permission"],
    group: "Employee Management",
  },
  { module: "Designations", permissions: CRUD, group: "Employee Management" },

  { module: "Action Logs", permissions: ["View", "Delete"], group: "Logs" },
  { module: "Error Logs", permissions: ["View", "Delete"], group: "Logs" },

  { module: "Budget Ranges", permissions: CRUD, group: "Settings" },
  {
    module: "Media Bin",
    permissions: ["View", "Restore", "Delete"],
    group: "Settings",
  },
];

export const DISTINCT_PERMISSION_ACTIONS: string[] = Array.from(
  new Set(PERMISSION_MODULES.flatMap((m) => m.permissions))
);

export const TOTAL_PERMISSION_COUNT: number = PERMISSION_MODULES.reduce(
  (sum, m) => sum + m.permissions.length,
  0
);
