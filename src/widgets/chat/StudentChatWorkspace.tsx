"use client";

import { useState } from "react";
import type { ChatUser } from "@/entities/chat";
import { ChatWorkspace } from "@/features/chat";
import { PublicProfileLoader } from "@/features/profile";

/** Student chat workspace that opens another student's or teacher's profile as a modal card. */
export function StudentChatWorkspace() {
  const [profileUser, setProfileUser] = useState<ChatUser | null>(null);

  return (
    <>
      <ChatWorkspace onViewProfile={setProfileUser} />
      {profileUser ? (
        <PublicProfileLoader
          key={profileUser.id}
          userId={profileUser.id}
          modal
          onClose={() => setProfileUser(null)}
        />
      ) : null}
    </>
  );
}
