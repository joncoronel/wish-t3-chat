import { SWRConfig } from "swr";
import { getUserSettingsData } from "@/lib/data/user-preferences";
import { SettingsForm } from "./settings-form";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function SettingsServer() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch both API keys and user preferences in a single query, but maintain separate SWR keys
  const userSettingsPromise = getUserSettingsData(user.id);

  return (
    <SWRConfig
      value={{
        fallback: {
          [`encrypted-api-keys-${user.id}`]: userSettingsPromise.then(
            (data) => data.apiKeys,
          ),
          [`user-preferences-${user.id}`]: userSettingsPromise.then(
            (data) => data.preferences,
          ),
        },
      }}
    >
      <SettingsForm userId={user.id} />
    </SWRConfig>
  );
}
