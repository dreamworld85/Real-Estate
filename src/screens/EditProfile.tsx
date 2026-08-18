import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Input from "@/components/Input";
import Button from "@/components/Button";
import BottomNav from "@/components/BottomNav";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, login, token, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [location, setLocation] = useState(user?.location || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateMyProfile({ name, phone, email, location });
      if (token) login(token, updated);
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account?\n\nThis will wipe out all your properties, media uploads, subscriptions, and logs. This action is permanent and cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccount();
      logout();
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col pb-28">
      <Header title="Edit Profile" showBack />

      <div className="px-4 pt-2 flex flex-col gap-5 flex-1">
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="w-20 h-20 rounded-full bg-sage flex items-center justify-center">
            <UserIcon size={32} className="text-forest" />
          </div>
          <button className="text-sm font-semibold text-forest">Change Photo</button>
        </div>

        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />

        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-coral mb-1">Danger Zone</h3>
          <p className="text-[12px] text-slate-500 mb-4 leading-normal">
            Permanently delete your account and all associated properties, media files, and logs. This action is irreversible.
          </p>
          <Button 
            variant="destructive" 
            disabled={saving || deleting} 
            onClick={handleDeleteAccount}
          >
            {deleting ? "Deleting Account…" : "Delete Account"}
          </Button>
        </div>
      </div>

      <div className="px-4 pb-8 pt-6 flex gap-3">
        <Button variant="secondary" fullWidth={false} className="flex-1" onClick={() => navigate("/profile")}>
          Cancel
        </Button>
        <Button fullWidth={false} className="flex-1" disabled={saving || deleting} onClick={handleSave}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
