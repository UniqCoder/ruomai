import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

const FREE_LIMIT = 5;

export const Dashboard = () => {
  const { user } = useAuth();
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  const fetchUsage = async () => {
    try {
      const { data: usage } = await supabase
        .rpc('get_current_month_usage' as any, { p_user_id: user?.id });
      setUsageCount(usage || 0);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Link to="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 container max-w-4xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your usage overview.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>This Month's Usage</CardTitle>
              <CardDescription>Free tier: 5 repurposes/month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{usageCount}/5</div>
              {usageCount >= 5 && (
                <Link to="/pricing">
                  <Button className="mt-4 w-full" size="sm">
                    Upgrade for unlimited <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Repurpose Content
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Repurposes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              History coming soon. Start by <Link to="/" className="text-primary hover:underline">repurposing content</Link>.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};
