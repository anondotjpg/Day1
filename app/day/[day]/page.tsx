// app/day/[day]/page.tsx

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import ConnectXButton from "@/app/components/ConnectXButton";
import XProfile from "@/app/components/XProfile";
import Chat from "@/app/components/Chat";

export default async function DayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const dayNumber = Number(day);

  if (!Number.isInteger(dayNumber) || dayNumber < 0 || dayNumber > 364) {
    notFound();
  }

  const cookieStore = await cookies();
  const xAccessToken = cookieStore.get("x_access_token")?.value;
  const xUsername = cookieStore.get("x_username")?.value;

  const isSignedIn = !!(xAccessToken && xUsername);

  return (
    <main className="relative min-h-screen bg-[#0b0b0d] text-white">
      {/* ───────────────── Header ───────────────── */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 md:px-[12%] pt-6">
        {/* Day number — top left */}
        <div className="text-[15px] md:text-[32px] font-semibold tracking-tight text-white/90">
          Day {dayNumber}
        </div>

        {/* X connect / profile — top right */}
        <div>
          {isSignedIn ? (
            <XProfile username={xUsername} />
          ) : (
            <ConnectXButton />
          )}
        </div>
      </header>

      {/* ─────────────── Chat Area ─────────────── */}
      <div className="min-h-screen flex flex-col pt-[30%] md:pt-[15%] pb-6 px-4 md:px-[12%]">
        {isSignedIn ? (
          <Chat dayId={dayNumber} username={xUsername} />
        ) : (
          <div className="flex-1 flex items-center justify-center mt-[-30%] md:mt-[-15%]">
            <p className="text-white/40 text-[15px]">
              Sign in with X to lock in
            </p>
          </div>
        )}
      </div>
    </main>
  );
}