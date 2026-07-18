import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, login, token } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [location, setLocation] = useState(user?.location || "");
  const [saving, setSaving] = useState(false);
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

  return (
    <div className="min-h-screen flex flex-col">
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
      </div>

      <div className="px-4 pb-8 pt-6 flex gap-3">
        <Button variant="secondary" fullWidth={false} className="flex-1" onClick={() => navigate("/profile")}>
          Cancel
        </Button>
        <Button fullWidth={false} className="flex-1" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
