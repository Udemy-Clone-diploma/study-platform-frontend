import type { UserRole } from "@/entities/user";
import type { SidebarItem } from "@/features/app-shell";

type Translator = (key: string) => string;

function buildTeacherItems(t: Translator): SidebarItem[] {
  return [
    {
      id: "dashboard",
      label: t("dashboard"),
      href: "/teacher-dashboard",
      icon: "dashboard",
      iconSrc: "/icons/house.svg",
      match: "exact",
    },
    {
      id: "courses",
      label: t("courses"),
      href: "/teacher-dashboard/courses",
      icon: "courses",
      iconSrc: "/icons/curses.svg",
      match: "startsWith",
    },
    {
      id: "students",
      label: t("students"),
      href: "/teacher-dashboard/students",
      icon: "students",
      iconSrc: "/icons/people.svg",
      match: "startsWith",
    },
    {
      id: "attendance",
      label: t("attendance"),
      href: "/teacher-dashboard/attendance",
      icon: "attendance",
      iconSrc: "/icons/clock.svg",
      match: "startsWith",
    },
    {
      id: "gradebook",
      label: t("gradebook"),
      href: "/teacher-dashboard/gradebook",
      icon: "gradebook",
      iconSrc: "/icons/diary.svg",
      match: "startsWith",
    },
    {
      id: "homework",
      label: t("homework"),
      href: "/teacher-dashboard/homework",
      icon: "homework",
      iconSrc: "/icons/homework.svg",
      match: "startsWith",
    },
    {
      id: "chats",
      label: t("chats"),
      href: "/teacher-dashboard/chats",
      icon: "chats",
      iconSrc: "/icons/sms.svg",
      match: "startsWith",
    },
    {
      id: "blog",
      label: t("myArticles"),
      href: "/teacher-dashboard/blog",
      icon: "materials",
      iconSrc: "/icons/book-navy.svg",
      match: "startsWith",
    },
    {
      id: "statistics",
      label: t("statistics"),
      href: "/teacher-dashboard/statistics",
      icon: "statistics",
      iconSrc: "/icons/statistics.svg",
      match: "startsWith",
    },
    {
      id: "schedule",
      label: t("schedule"),
      href: "/teacher-dashboard/schedule",
      icon: "schedule",
      iconSrc: "/icons/list.svg",
      match: "startsWith",
    },
    {
      id: "payment",
      label: t("payments"),
      href: "/teacher-dashboard/payments",
      icon: "payment",
      iconSrc: "/icons/wallet.svg",
      match: "startsWith",
    },
  ];
}

function buildStudentItems(t: Translator): SidebarItem[] {
  return [
    {
      id: "dashboard",
      label: t("dashboard"),
      href: "/student-dashboard",
      icon: "dashboard",
      iconSrc: "/icons/house.svg",
      match: "exact",
    },
    {
      id: "courses",
      label: t("courses"),
      href: "/student-dashboard/courses",
      icon: "courses",
      iconSrc: "/icons/curses.svg",
      match: "startsWith",
    },
    {
      id: "homework",
      label: t("homework"),
      href: "/student-dashboard/homework",
      icon: "homework",
      iconSrc: "/icons/homework.svg",
      match: "startsWith",
    },
    {
      id: "materials",
      label: t("materials"),
      href: "/student-dashboard/materials",
      icon: "materials",
      iconSrc: "/icons/diary.svg",
      match: "startsWith",
    },
    {
      id: "chats",
      label: t("chats"),
      href: "/student-dashboard/chats",
      icon: "chats",
      iconSrc: "/icons/sms.svg",
      match: "startsWith",
    },
    {
      id: "schedule",
      label: t("schedule"),
      href: "/student-dashboard/schedule",
      icon: "schedule",
      iconSrc: "/icons/list.svg",
      match: "startsWith",
    },
    {
      id: "statistics",
      label: t("statistics"),
      href: "/student-dashboard/statistics",
      icon: "statistics",
      iconSrc: "/icons/statistics.svg",
      match: "startsWith",
    },
    {
      id: "payment",
      label: t("payment"),
      href: "/student-dashboard/payment",
      icon: "payment",
      iconSrc: "/icons/wallet.svg",
      match: "startsWith",
    },
    {
      id: "certificates",
      label: t("certificates"),
      href: "/student-dashboard/certificates",
      icon: "certificates",
      iconSrc: "/icons/certificate.svg",
      match: "startsWith",
    },
    {
      id: "wishlist",
      label: t("wishlist"),
      href: "/student-dashboard/wishlist",
      icon: "wishlist",
      iconSrc: "/icons/heart fill.svg",
      match: "startsWith",
    },
  ];
}

function buildModeratorItems(t: Translator, tCommon: Translator): SidebarItem[] {
  return [
    {
      id: "dashboard",
      label: t("dashboard"),
      href: "/moderator-dashboard",
      icon: "dashboard",
      iconSrc: "/icons/house.svg",
      match: "exact",
    },
    {
      id: "courses",
      label: tCommon("myCourses"),
      href: "/moderator-dashboard/courses",
      icon: "courses",
      iconSrc: "/icons/curses.svg",
      match: "startsWith",
    },
    {
      id: "teacher-applications",
      label: t("teacherApplications"),
      href: "/moderator-dashboard/teacher-applications",
      icon: "reports",
      iconSrc: "/icons/copy-check-navy.svg",
      match: "startsWith",
    },
    {
      id: "chats",
      label: t("chats"),
      href: "/moderator-dashboard/chats",
      icon: "chats",
      iconSrc: "/icons/sms.svg",
      match: "startsWith",
    },
    {
      id: "reviews",
      label: t("reviews"),
      href: "/moderator-dashboard/reviews",
      icon: "reviews",
      iconSrc: "/icons/Reviews.svg",
      match: "startsWith",
    },
    {
      id: "reports",
      label: t("reports"),
      href: "/moderator-dashboard/reports",
      icon: "reports",
      match: "startsWith",
    },
    {
      id: "blog",
      label: t("blog"),
      href: "/moderator-dashboard/blog",
      icon: "materials",
      iconSrc: "/icons/book-navy.svg",
      match: "startsWith",
    },
  ];
}

function buildAdminItems(t: Translator, tCommon: Translator): SidebarItem[] {
  return [
    {
      id: "dashboard",
      label: t("dashboard"),
      href: "/admin",
      icon: "dashboard",
      iconSrc: "/icons/house.svg",
      match: "exact",
    },
    {
      id: "students",
      label: t("users"),
      href: "/admin/users",
      icon: "students",
      iconSrc: "/icons/people.svg",
      match: "startsWith",
    },
    {
      id: "teacher-applications",
      label: t("teacherApplications"),
      href: "/admin/teacher-applications",
      icon: "reports",
      iconSrc: "/icons/copy-check-navy.svg",
      match: "startsWith",
    },
    {
      id: "categories",
      label: tCommon("categories"),
      href: "/admin/categories",
      icon: "materials",
      iconSrc: "/icons/categories.svg",
      match: "startsWith",
    },
    {
      id: "chats",
      label: t("chats"),
      href: "/admin/chats",
      icon: "chats",
      iconSrc: "/icons/sms.svg",
      match: "startsWith",
    },
    {
      id: "reports",
      label: t("reports"),
      href: "/admin/reports",
      icon: "reports",
      match: "startsWith",
    },
    {
      id: "courses",
      label: t("courses"),
      href: "/admin/courses",
      icon: "courses",
      iconSrc: "/icons/curses.svg",
      match: "startsWith",
    },
    {
      id: "certificates",
      label: t("certificates"),
      href: "/admin/certificates",
      icon: "certificates",
      iconSrc: "/icons/certificate.svg",
      match: "startsWith",
    },
    {
      id: "blog",
      label: t("blog"),
      href: "/admin/blog",
      icon: "materials",
      iconSrc: "/icons/book-navy.svg",
      match: "startsWith",
    },
    {
      id: "payment",
      label: t("payment"),
      href: "/admin/payment",
      icon: "payment",
      iconSrc: "/icons/wallet.svg",
      match: "startsWith",
    },
  ];
}

/** `t` must be bound to the "AppSidebar" namespace, `tCommon` to "Common" (for the 2 labels shared with header nav). */
export function getSidebarItems(role: UserRole, t: Translator, tCommon: Translator): SidebarItem[] {
  if (role === "teacher") return buildTeacherItems(t);
  if (role === "moderator") return buildModeratorItems(t, tCommon);
  if (role === "administrator") return buildAdminItems(t, tCommon);
  return buildStudentItems(t);
}
