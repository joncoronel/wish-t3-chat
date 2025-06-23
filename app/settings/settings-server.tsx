import { cookies } from "next/headers";

export default async function SettingsServer() {
  const cookieStore = await cookies();
  console.log(cookieStore);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>finished loading</div>;
}
