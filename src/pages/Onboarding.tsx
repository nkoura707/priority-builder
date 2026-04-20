import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Onboarding = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const skip = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8">
        <Logo size={20} />
        <h1 className="font-serif text-[28px] mt-6 mb-2">Onboarding placeholder</h1>
        <p className="text-muted-foreground mb-6 text-[15px] leading-relaxed">
          Welcome, {user?.email}. The full 3-step onboarding (connect Google Business, choose tone, start trial) ships in step 4.
        </p>
        <div className="flex gap-2">
          <Button onClick={skip}>Skip to dashboard</Button>
          <Button variant="outline" onClick={signOut}>Log out</Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
