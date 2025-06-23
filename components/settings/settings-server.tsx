export default async function SettingsServer() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <div>finished loading</div>;
}
