import ChatServer from "./chat-server";
// import { Suspense } from "react";
// import Loading from "./loadings";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  return (
    // <Suspense fallback={<div>test</div>}>
    <ChatServer searchParams={searchParams} />
    // </Suspense>
  );
}
