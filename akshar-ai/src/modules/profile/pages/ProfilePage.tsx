import { useAuth } from "../../auth/hooks/useAuth";

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Name</p><p className="mt-1 font-semibold">{user?.name ?? "—"}</p>
        <p className="mt-4 text-sm text-slate-500">Email</p><p className="mt-1 font-semibold">{user?.email ?? "—"}</p>
        <p className="mt-4 text-sm text-slate-500">Email verification</p><p className="mt-1 font-semibold">{user?.emailVerified ? "Verified" : "Not verified"}</p>
      </div>
    </section>
  );
}
