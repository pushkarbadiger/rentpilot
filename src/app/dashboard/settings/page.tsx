import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { ErrorState } from "@/components/ui/Alert";
import { getProfile } from "@/lib/services/profile";
import { getCurrentUser } from "@/lib/services/auth";
import { updateProfileAction } from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ data: profile, error }, user, params] = await Promise.all([
    getProfile(),
    getCurrentUser(),
    searchParams,
  ]);

  const { saved } = params;

  if (error || !profile) {
    return (
      <ErrorState
        message={
          error === "Not authenticated"
            ? "You must be signed in to view settings."
            : (error ?? "Unable to load profile.")
        }
      />
    );
  }

  if (!user) {
    return <ErrorState message="You must be signed in to view settings." />;
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and profile information."
      />

      {saved === "1" && user && !user.isDemo && (
        <Alert variant="success" className="mb-6">
          Your profile has been updated.
        </Alert>
      )}

      <Card className="max-w-lg">
        <CardContent>
          <div className="mb-6 border-b border-slate-100 pb-5">
            <p className="text-sm font-medium text-slate-900">Account</p>
            <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
          </div>
          <ProfileForm action={updateProfileAction} profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
