import { ReactNode, useEffect, useState, createContext, useContext } from "react";
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

interface DashboardCtx {
  locations: LocationRow[];
  selectedLocationId: string;
  loadingLocations: boolean;
}

const Ctx = createContext<DashboardCtx>({
  locations: [],
  selectedLocationId: "",
  loadingLocations: true,
});

export const useDashboardLocation = () => useContext(Ctx);

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
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    setLoadingLocations(true);
    supabase
      .from("locations")
      .select("id, business_name, address")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLocations(data);
          setSelectedLocation(data[0].id);
        }
        setLoadingLocations(false);
      });
  }, [user]);

  const sidebarContent = (
    <div
      className="flex h-full flex-col text-white w-60"
      style={{
        background:
          "linear-gradient(180deg, hsl(var(--sidebar-bg)) 0%, hsl(222 22% 5%) 100%)",
      }}
    >
      <div className="px-5 pt-5 pb-4 border-b border-[hsl(var(--sidebar-border-color))]">
        <Logo variant="light" size={20} />
      </div>

      {locations.length > 1 && (
        <div className="px-3 py-3">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full bg-[hsl(var(--sidebar-pill))] border-[hsl(var(--sidebar-border-color))] text-white text-sm h-9 hover:bg-[hsl(222_18%_16%)]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--sidebar-pill))] border-[hsl(var(--sidebar-border-color))] text-white">
              {locations.map((loc) => (
                <SelectItem
                  key={loc.id}
                  value={loc.id}
                  className="text-white focus:bg-[hsl(222_18%_16%)] focus:text-white"
                >
                  {loc.business_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <nav className="flex-1 px-2 pt-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 h-[38px] pl-3 pr-3 rounded-md text-[13px] transition-all duration-150 border-l-2",
                  isActive
                    ? "border-accent bg-[hsl(var(--sidebar-pill))] text-white font-medium"
                    : "border-transparent text-[hsl(var(--sidebar-inactive))] hover:text-white hover:bg-[hsl(222_18%_10%)] hover:border-[hsl(220_8%_30%)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? "text-accent" : ""} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[hsl(var(--sidebar-border-color))] space-y-2">
        <div className="text-xs text-[hsl(var(--sidebar-inactive))] truncate">{user?.email}</div>
        <button
          onClick={signOut}
          className="text-sm text-[hsl(220_8%_60%)] hover:text-red-400 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <Ctx.Provider value={{ locations, selectedLocationId: selectedLocation, loadingLocations }}>
      <div className="min-h-screen flex bg-background">
        <aside className="hidden md:block fixed inset-y-0 left-0 z-30">
          {sidebarContent}
        </aside>

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

        <div className="flex-1 md:ml-60 flex flex-col min-w-0">
          <button
            className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-md bg-surface border border-border shadow-sm"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {children}
        </div>
      </div>
    </Ctx.Provider>
  );
};
