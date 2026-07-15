import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-3xl font-black text-white">Profile</h1>
      <p className="mb-8 text-slate-400">
        Update your account details. Your email is used for ticket delivery.
      </p>
      <ProfileForm
        name={user.name}
        email={user.email}
        phone={user.phone ?? ""}
      />
    </div>
  );
}
