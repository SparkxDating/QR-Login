import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CAMP } from "@/lib/camp";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart3,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";

export type AdminSection =
  | "overview"
  | "registrations"
  | "analytics"
  | "reports"
  | "settings"
  | "super";

const MAIN_NAV: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "अवलोकन", icon: LayoutDashboard },
  { id: "registrations", label: "पंजीकरण", icon: Users },
  { id: "analytics", label: "आँकड़े", icon: BarChart3 },
  { id: "reports", label: "रिपोर्ट", icon: FileText },
  { id: "settings", label: "सेटिंग", icon: Settings },
];

const SUPER_NAV: { id: string; label: string; icon: typeof UserCog }[] = [
  { id: "sa-accounts", label: "Admin Accounts", icon: UserCog },
  { id: "sa-security", label: "Security", icon: KeyRound },
  { id: "sa-logs", label: "Activity Logs", icon: Activity },
  { id: "sa-delete", label: "Delete Management", icon: Trash2 },
];
