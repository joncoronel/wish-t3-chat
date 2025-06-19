import { SWRConfig } from "swr";
import { getEncryptedApiKeys } from "@/lib/data/api-keys";
import { getUserPreferences } from "@/lib/data/user-preferences";
import { SettingsForm } from "./settings-form";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function SettingsServer() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch data on the server for performance
  const [encryptedApiKeys, userPreferences] = await Promise.all([
    getEncryptedApiKeys(user.id),
    getUserPreferences(user.id),
  ]);

  return (
    <SWRConfig
      value={{
        fallback: {
          [`encrypted-api-keys-${user.id}`]: encryptedApiKeys,
          [`user-preferences-${user.id}`]: userPreferences,
        },
      }}
    >
      <SettingsForm userId={user.id} />
    </SWRConfig>
  );
}
