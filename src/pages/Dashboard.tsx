import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowUpRight, 
  Zap, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  FileText, 
  Twitter, 
  Linkedin, 
  Video, 
  MessageCircle,
  Crown,
  ChevronRight,
  Copy,
  CheckCircle2
} from "lucide-react";

const FREE_LIMIT = 5;

interface UsageRecord {
  id: string;
  input_content: string;
  tone: string;
  language: string;
  outputs: any;
  created_at: string;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [recentHistory, setRecentHistory] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch usage
      const { data: usage } = await supabase
        .rpc('get_current_month_usage' as any, { p_user_id: user?.id });
      setUsageCount(usage || 0);

      // Fetch recent history
      const { data: history } = await supabase
        .from('usage_history' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentHistory(history || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getFormatIcon = (key: string) => {
    if (key.includes('tweet')) return <Twitter className="h-4 w-4" />;
    if (key.includes('linkedin')) return <Linkedin className="h-4 w-4" />;
    if (key.includes('reel')) return <Video className="h-4 w-4" />;
    if (key.includes('whatsapp')) return <MessageCircle className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Link to="/login">
            <Button size="lg">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const usagePercentage = (usageCount / FREE_LIMIT) * 100;
  const remainingUses = Math.max(0, FREE_LIMIT - usageCount);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <TopNav />
      
      <main className="flex-1 container max-w-6xl py-8 md:py-12 px-4">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xl font-semibold">
                {getInitials(user.user_metadata?.full_name || user.email || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Creator'}!
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Ready to repurpose your content?
              </p>
            </div>
          </div>
          <Link to="/">
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
              <Zap className="h-4 w-4" />
              Repurpose Now
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Usage Card */}
          <Card className="md:col-span-2 border-l-4 border-l-primary shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Usage
                </CardTitle>
                <Badge variant={remainingUses === 0 ? "destructive" : remainingUses <= 2 ? "secondary" : "default"}>
                  {remainingUses === 0 ? 'Limit Reached' : remainingUses <= 2 ? 'Low Usage' : 'Active'}
                </Badge>
              </div>
              <CardDescription>
                Free plan: {FREE_LIMIT} repurposes per month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-4xl font-bold">{usageCount}</span>
                  <span className="text-muted-foreground text-lg"> / {FREE_LIMIT} used</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-semibold text-primary">{remainingUses}</span>
                  <span className="text-muted-foreground"> remaining</span>
                </div>
              </div>
              <Progress value={usagePercentage} className="h-3" />
              {remainingUses === 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center gap-3">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">You've reached your free limit</p>
                    <p className="text-xs text-muted-foreground">Upgrade to unlock unlimited repurposes</p>
                  </div>
                  <Link to="/pricing">
                    <Button size="sm" variant="secondary">Upgrade</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-primary">{usageCount}</div>
                  <div className="text-xs text-muted-foreground">Repurposes</div>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-primary">{recentHistory.length}</div>
                  <div className="text-xs text-muted-foreground">Saved</div>
                </div>
              </div>
              <Link to="/pricing" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Recent Repurposes
              </CardTitle>
              <CardDescription>Your latest content transformations</CardDescription>
            </div>
            {recentHistory.length > 0 && (
              <Link to="/history">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No repurposes yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Start transforming your content into multiple formats for different platforms
                </p>
                <Link to="/">
                  <Button className="gap-2">
                    <Zap className="h-4 w-4" />
                    Create Your First Repurpose
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentHistory.map((record) => (
                  <div 
                    key={record.id} 
                    className="group flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {record.input_content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {record.tone}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {record.language === 'HI' ? 'Hindi' : 'English'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(record.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {Object.keys(record.outputs || {}).slice(0, 3).map((key) => (
                        <div key={key} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {getFormatIcon(key)}
                        </div>
                      ))}
                      {Object.keys(record.outputs || {}).length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          +{Object.keys(record.outputs || {}).length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade CTA for Free Users */}
        {remainingUses > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/20">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Unlock Unlimited Repurposes</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Creator plan for ₹399/month and transform your content without limits
                  </p>
                </div>
              </div>
              <Link to="/pricing">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20">
                  Upgrade Now
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
};
