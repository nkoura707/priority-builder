import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Logo size={22} />
        <h1 className="font-serif text-[40px] mt-8 mb-3">Dashboard placeholder</h1>
        <p className="text-muted-foreground mb-6">Signed in as {user?.email}. Real dashboard ships in step 5.</p>
        <Button variant="outline" onClick={signOut}>Log out</Button>
      </div>
    </div>
  );
};

export default Dashboard;
