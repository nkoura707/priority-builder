import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Inbox, MapPin, Settings as SettingsIcon, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LocationRow {
  id: string;
  business_name: string;
  address: string | null;
}

const navItems = [
  { to: "/dashboard", label: "Reviews", icon: Inbox, end: true },
  { to: "/dashboard/locations", label: "Locations", icon: MapPin },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("locations")
      .select("id, business_name, address")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLocations(data);
          setSelectedLocation(data[0].id);
        }
      });
  }, [user]);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#141414] text-white w-60">
      <div className="px-5 pt-5 pb-4">
        <Logo variant="light" size={20} />
      </div>

      {locations.length > 1 && (
        <div className="px-3 pb-3">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full bg-[#1f1f1f] border-[#262626] text-white text-sm h-9 hover:bg-[#262626]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="bg-[#1f1f1f] border-[#262626] text-white">
              {locations.map((loc) => (
                <SelectItem
                  key={loc.id}
                  value={loc.id}
                  className="text-white focus:bg-[#262626] focus:text-white"
                >
                  {loc.business_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#262626] text-white"
                    : "text-[#737373] hover:text-white hover:bg-[#1f1f1f]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={isActive ? "text-[#D4622A]" : ""}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[#262626] space-y-2">
        <div className="text-xs text-[#737373] truncate">{user?.email}</div>
        <button
          onClick={signOut}
          className="text-sm text-[#a3a3a3] hover:text-red-400 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FAFAF7]">
      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-w-0">
        <button
          className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-md bg-white border border-[#E8E4DF] shadow-sm"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        {children}
      </div>
    </div>
  );
};
