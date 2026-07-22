export const PROFILE_SOCIALS = [
  {
    key: "instagram",
    srcGray: "/social-media-icons/instagrm-gray.svg",
    srcBlack: "/social-media-icons/instagrm.png",
    label: "Instagram",
  },
  {
    key: "linkedin",
    srcGray: "/social-media-icons/LinKedln-gray.svg",
    srcBlack: "/social-media-icons/LinKedln.png",
    label: "LinkedIn",
  },
  {
    key: "facebook",
    srcGray: "/social-media-icons/Facebook-gray.svg",
    srcBlack: "/social-media-icons/Facebook.png",
    label: "Facebook",
  },
  {
    key: "behance",
    srcGray: "/social-media-icons/behance-gray.svg",
    srcBlack: "/social-media-icons/behance.png",
    label: "Behance",
  },
] as const;

export type SocialLinks = Record<(typeof PROFILE_SOCIALS)[number]["key"], string>;
