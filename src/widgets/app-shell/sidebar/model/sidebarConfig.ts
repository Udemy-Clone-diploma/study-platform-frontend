import type { UserRole } from "@/entities/user";
import type { SidebarItem } from "@/features/app-shell";

const teacherItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/teacher-dashboard", icon: "dashboard", iconSrc: "/icons/house.svg", match: "exact" },
  { id: "courses", label: "Courses", href: "/teacher-dashboard/courses", icon: "courses", iconSrc: "/icons/curses.svg", match: "startsWith" },
  { id: "students", label: "Students", href: "/teacher-dashboard/students", icon: "students", iconSrc: "/icons/people.svg", match: "startsWith" },
  { id: "attendance", label: "Group attendance", href: "/teacher-dashboard/attendance", icon: "attendance", iconSrc: "/icons/clock.svg", match: "startsWith" },
  { id: "gradebook", label: "Gradebook", href: "/teacher-dashboard/gradebook", icon: "gradebook", iconSrc: "/icons/diary.svg", match: "startsWith" },
  { id: "homework", label: "Homework", href: "/teacher-dashboard/homework", icon: "homework", iconSrc: "/icons/homework.svg", match: "startsWith" },
  { id: "chats", label: "Chats", href: "/teacher-dashboard/chats", icon: "chats", iconSrc: "/icons/sms.svg", match: "startsWith" },
  { id: "statistics", label: "Statistics", href: "/teacher-dashboard/statistics", icon: "statistics", iconSrc: "/icons/statistics.svg", match: "startsWith" },
  { id: "schedule", label: "Schedule", href: "/teacher-dashboard/schedule", icon: "schedule", iconSrc: "/icons/list.svg", match: "startsWith" },
  { id: "payment", label: "Payments", href: "/teacher-dashboard/payments", icon: "payment", iconSrc: "/icons/wallet.svg", match: "startsWith" },
];

const studentItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/student-dashboard", icon: "dashboard", iconSrc: "/icons/house.svg", match: "exact" },
  { id: "courses", label: "Courses", href: "/student-dashboard/courses", icon: "courses", iconSrc: "/icons/curses.svg", match: "startsWith" },
  { id: "homework", label: "Homework", href: "/student-dashboard/homework", icon: "homework", iconSrc: "/icons/homework.svg", match: "startsWith" },
  { id: "materials", label: "Educational materials", href: "/student-dashboard/materials", icon: "materials", iconSrc: "/icons/diary.svg", match: "startsWith" },
  { id: "chats", label: "Chats", href: "/student-dashboard/chats", icon: "chats", iconSrc: "/icons/sms.svg", match: "startsWith" },
  { id: "schedule", label: "Schedule", href: "/student-dashboard/schedule", icon: "schedule", iconSrc: "/icons/list.svg", match: "startsWith" },
  { id: "statistics", label: "Statistics", href: "/student-dashboard/statistics", icon: "statistics", iconSrc: "/icons/statistics.svg", match: "startsWith" },
  { id: "payment", label: "Payment", href: "/student-dashboard/payment", icon: "payment", iconSrc: "/icons/wallet.svg", match: "startsWith" },
  { id: "certificates", label: "Certificates", href: "/student-dashboard/certificates", icon: "certificates", iconSrc: "/icons/certificate.svg", match: "startsWith" },
  { id: "wishlist", label: "Wishlist", href: "/student-dashboard/wishlist", icon: "wishlist", iconSrc: "/icons/heart fill.svg", match: "startsWith" },
];

const moderatorItems: SidebarItem[] = [
  { id: "dashboard",     label: "Dashboard",    href: "/moderator-dashboard",            icon: "dashboard",     iconSrc: "/icons/house.svg",         match: "exact" },
  { id: "courses",       label: "My courses",   href: "/moderator-dashboard/courses",    icon: "courses",       iconSrc: "/icons/curses.svg",         match: "startsWith" },
  { id: "teacher-applications", label: "Applications", href: "/moderator-dashboard/teacher-applications", icon: "students", iconSrc: "/icons/people.svg", match: "startsWith" },
  { id: "chats",         label: "Chats",        href: "/moderator-dashboard/chats",      icon: "chats",         iconSrc: "/icons/sms.svg",            match: "startsWith" },
  { id: "reviews",       label: "Reviews",      href: "/moderator-dashboard/reviews",    icon: "reviews",       iconSrc: "/icons/Reviews.svg",        match: "startsWith" },
  { id: "notifications", label: "Notifications",href: "/moderator-dashboard/notifications", icon: "notifications", iconSrc: "/icons/Notification.svg", match: "startsWith" },
];

const adminItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: "dashboard", iconSrc: "/icons/house.svg", match: "exact" },
  { id: "students", label: "Users", href: "/admin/users", icon: "students", iconSrc: "/icons/people.svg", match: "startsWith" },
  { id: "categories", label: "Categories", href: "/admin/categories", icon: "materials", iconSrc: "/icons/categories.svg", match: "startsWith" },
  { id: "courses", label: "Courses", href: "/admin/courses", icon: "courses", iconSrc: "/icons/curses.svg", match: "startsWith" },
  { id: "statistics", label: "Statistics", href: "/admin/statistics", icon: "statistics", iconSrc: "/icons/statistics.svg", match: "startsWith" },
  { id: "payment", label: "Payment", href: "/admin/payment", icon: "payment", iconSrc: "/icons/wallet.svg", match: "startsWith" },
];

export function getSidebarItems(role: UserRole): SidebarItem[] {
  if (role === "teacher") return teacherItems;
  if (role === "moderator") return moderatorItems;
  if (role === "administrator") return adminItems;
  return studentItems;
}
