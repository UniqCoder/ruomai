import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  useEffect(() => {
    const confirmEmail = async () => {
      // Supabase might have already established the session via the hash fragment
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        toast.success("Email confirmed successfully!");
        navigate("/dashboard");
        return;
      }

      const token = searchParams.get("token") || searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (token) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: (type as "signup" | "email") || "signup",
          });

          if (error) throw error;

          toast.success("Email confirmed successfully!");
          navigate("/dashboard");
        } catch (error: unknown) {
          toast.error(getErrorMessage(error, "Failed to confirm email"));
          navigate("/login");
        }
      } else {
        toast.error("Invalid confirmation link");
        navigate("/login");
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p>Confirming your email...</p>
      </div>
    </div>
  );
};
