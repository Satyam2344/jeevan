import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  Crown,
  LayoutDashboard,
  Users,
  Gamepad2,
  Wallet,
  ShieldAlert,
  BarChart3,
  Trophy,
  Settings,
} from "lucide-react";
import logo from "@/assets/jeevan_logo.jpeg";

const adminNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Games", url: "/admin/games", icon: Gamepad2 },
  { title: "Game Results", url: "/admin/game-results", icon: Crown },
  { title: "Transactions", url: "/admin/transactions", icon: Wallet },
  { title: "Matches", url: "/admin/matches", icon: Trophy },
  { title: "Fantasy", url: "/admin/fantasy", icon: Crown },
  { title: "Fraud Detection", url: "/admin/fraud", icon: ShieldAlert },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-primary tracking-wider">
            {!collapsed && "ADMIN PANEL"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
            <SidebarTrigger className="mr-4" />
            <Link to="/" className="flex items-center gap-2 mr-auto">
              <img src={logo} alt="JEEVAN Logo" className="h-7 w-7 rounded-full object-cover" />
              <span className="font-display text-sm font-bold tracking-wider text-primary">JEEVAN</span>
            </Link>
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Back to Site
            </Link>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
