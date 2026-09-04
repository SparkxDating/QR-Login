export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "super_admin";
}

export function roleLabel(role: string): string {
  if (role === "super_admin") return "सुपर एडमिन";
  if (role === "admin") return "एडमिन";
  return role;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  login_success: "लॉगिन सफल",
  login_fail: "लॉगिन असफल",
  password_change: "पासवर्ड बदला",
  password_recover: "पासवर्ड रिकवरी",
  password_reset: "एडमिन पासवर्ड रीसेट",
  registration_delete: "पंजीकरण हटाया",
  logout_all: "सभी एडमिन सत्र समाप्त",
};
