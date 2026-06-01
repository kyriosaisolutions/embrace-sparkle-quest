import { createFileRoute, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/minha-area" });
  },
  component: CustomerLoginPage,
});

function CustomerLoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    try {
      const redirectTo = `${window.location.origin}/minha-area`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch {
      toast.error("Erro ao entrar com Google. Tente novamente.");
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <Calendar className="w-8 h-8" />
            <span>Agendaki</span>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Minha Área</CardTitle>
            <CardDescription>Entre para ver seus agendamentos, histórico e avaliações.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full gap-3 h-11"
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle}
            >
              {isLoadingGoogle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continuar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Acesso via WhatsApp/SMS disponível em breve.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          É profissional ou dono de salão?{" "}
          <a href="/admin-login" className="text-primary hover:underline">
            Acesse o painel admin
          </a>
        </p>
      </div>
    </div>
  );
}
