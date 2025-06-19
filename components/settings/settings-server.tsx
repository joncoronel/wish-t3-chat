import { SWRConfig } from "swr";
import { getEncryptedApiKeys } from "@/lib/data/api-keys";
import { SettingsForm } from "./settings-form";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function SettingsServer() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }
  // Fetch encrypted API keys on the server
  const encryptedApiKeys = await getEncryptedApiKeys(user.id);

  return (
    <SWRConfig
      value={{
        fallback: {
          [`encrypted-api-keys-${user.id}`]: encryptedApiKeys,
        },
      }}
    >
      <SettingsForm userId={user.id} />
    </SWRConfig>
  );
}
