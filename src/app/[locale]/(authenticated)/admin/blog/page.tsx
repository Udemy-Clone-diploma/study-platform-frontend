"use client";

import { withAuth } from "@/features/auth";
import { BlogModerationView } from "@/widgets/blog";

const ProtectedBlogModerationView = withAuth(BlogModerationView, {
  allowedRoles: ["administrator"],
});

export default function AdminBlogPage() {
  return <ProtectedBlogModerationView role="administrator" />;
}
