import { buildApiUrl } from "@/lib/api";
import { DEFAULT_COURSE_PLAYER_PATH } from "@/constants/routes";

export function redirectToGoogleOAuth(redirectPath: string = DEFAULT_COURSE_PLAYER_PATH): void {
  const safeRedirect = redirectPath || DEFAULT_COURSE_PLAYER_PATH;
  const target = `${buildApiUrl("/auth/google")}?redirect=${encodeURIComponent(safeRedirect)}`;
  window.location.assign(target);
}
