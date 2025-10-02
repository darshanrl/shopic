"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

// Context for Sidebar state
const SidebarContext = React.createContext({
  isOpen: false,
  setIsOpen: () => {},
});

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Main Sidebar Container
export const Sidebar = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen } = React.useContext(SidebarContext);
  return (
    <aside
      ref={ref}
      className={cn(
        "fixed top-0 left-0 z-40 h-screen w-72 flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        !isOpen && "-translate-x-full",
        className
      )}
      {...props}
    >
      <div className="flex h-full flex-col">{children}</div>
    </aside>
  );
});
Sidebar.displayName = "Sidebar";

// Sidebar Trigger for mobile
export const SidebarTrigger = React.forwardRef(({ className, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(SidebarContext);
  return (
    <button
      ref={ref}
      onClick={() => setIsOpen(!isOpen)}
      className={cn("md:hidden", className)}
      {...props}
    >
      {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      <span className="sr-only">Toggle sidebar</span>
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

// Simple wrappers for structure
export const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-shrink-0", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 overflow-y-auto", className)} {...props} />
));
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-shrink-0", className)} {...props} />
));
SidebarFooter.displayName = "SidebarFooter";

export const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-4", className)} {...props} />
));
SidebarGroup.displayName = "SidebarGroup";

export const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

export const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("space-y-1", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("block", className)} {...props} />
));
SidebarMenuButton.displayName = "SidebarMenuButton";