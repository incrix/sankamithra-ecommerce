import { usePathname } from "next/navigation";

export const useActivePath = (href) => {
  const pathname = usePathname() || "/";
  const normalize = (path) => path.replace(/\/$/, "") || "/";
  return normalize(pathname) === normalize(href);
};
