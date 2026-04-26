import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, RefreshCw } from "lucide-react";

export const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Email not found. Please sign up again.");
      navigate("/signup");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;
      toast.success("Confirmation email resent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="space-y-2">
            <p>We've sent a confirmation link to:</p>
            <p className="font-semibold text-foreground">{email || "your email"}</p>
            <p className="text-sm">Click the link to activate your account.</p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleResendEmail}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Sending..." : "Resend confirmation email"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already confirmed?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
