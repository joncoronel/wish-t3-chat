import { getUser } from "@/lib/auth";
import { HeaderToolsOverlay } from "./header-tools-overlay";

export default async function HeaderToolsOverlayWrapper() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  return <HeaderToolsOverlay userId={user.id} />;
}
