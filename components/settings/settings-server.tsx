import { SWRConfig } from "swr";
import { getUserSettingsData } from "@/lib/data/user-preferences";
import { getConversations } from "@/lib/data/conversations";
import { SettingsForm } from "./settings-form";
import { DataManagementSection } from "./data-management-section";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function SettingsServer() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch both API keys, user preferences, and conversations data
  const userSettingsPromise = getUserSettingsData(user.id);
  const conversationsPromise = getConversations(user.id);

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
          [`conversations-${user.id}`]: conversationsPromise,
        },
      }}
    >
      <div className="space-y-8">
        <SettingsForm userId={user.id} />
        <DataManagementSection userId={user.id} />
      </div>
    </SWRConfig>
  );
}
