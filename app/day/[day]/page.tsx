// app/day/[day]/page.tsx

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import ConnectXButton from "@/app/components/ConnectXButton";
import XProfile from "@/app/components/XProfile";

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

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-6xl font-light">{dayNumber}</div>
        
        <div className="pt-8">
          {xAccessToken && xUsername ? (
            <XProfile username={xUsername} />
          ) : (
            <ConnectXButton />
          )}
        </div>
      </div>
    </main>
  );
}