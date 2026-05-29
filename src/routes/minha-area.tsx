import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  XCircle, 
  ExternalLink, 
  History, 
  Store, 
  Star, 
  Heart, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

export const Route = createFileRoute("/minha-area")({
  beforeLoad: async () => {
    const isAuthenticated = true; 
    if (!isAuthenticated) throw redirect({ to: "/" });
  },
  component: MyAreaPage,
});

function MyAreaPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const clientId = "d1a3e5b7-4c1d-4f1e-8a5b-9c8d7e6f5a4b";

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["my-appointments", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, tenants(name, slug, logo_url), services(name), professionals(name)")
        .eq("client_id", clientId)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const nextAppointments = useMemo(() => 
    appointments.filter((a: any) => new Date(a.starts_at) > new Date()), 
  [appointments]);

  const historyAppointments = useMemo(() => 
    appointments.filter((a: any) => new Date(a.starts_at) <= new Date()), 
  [appointments]);

  const [reviewingAppointment, setReviewingAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommended, setRecommended] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleReviewSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        tenant_id: reviewingAppointment.tenant_id,
        appointment_id: reviewingAppointment.id,
        client_id: clientId,
        professional_id: reviewingAppointment.professional_id,
        rating,
        comment,
        recommended
      });
      if (error) throw error;
      toast.success("Obrigado pela sua avaliação!");
      setReviewingAppointment(null);
      setRating(0);
      setComment("");
      setRecommended(false);
    } catch (e) {
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-100 text-green-700">Confirmado</Badge>;
      case "pending_payment": return <Badge className="bg-orange-100 text-orange-700">Pendente</Badge>;
      case "completed": return <Badge variant="outline" className="text-blue-600">Finalizado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <main className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Minha Área</h1>
        
        <section className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Próximos</h2>
          {nextAppointments.map((appointment: any) => (
            <Card key={appointment.id} className="overflow-hidden border-l-4 border-l-primary">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{appointment.tenants?.name}</h3>
                  <p className="text-sm">{appointment.services?.name} • {new Date(appointment.starts_at).toLocaleString('pt-BR')}</p>
                  <div className="mt-2">{getStatusBadge(appointment.status)}</div>
                </div>
                <Button size="sm" variant="outline" asChild><a href={`/${appointment.tenants?.slug}`}>Ver Salão</a></Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between"><div className="flex items-center gap-2"><History /> Histórico</div>{isHistoryOpen ? <ChevronUp /> : <ChevronDown />}</Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-4">
              {historyAppointments.map((h: any) => (
                <div key={h.id} className="bg-white border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{h.tenants?.name} <span className="font-normal text-xs text-muted-foreground">• {new Date(h.starts_at).toLocaleDateString('pt-BR')}</span></p>
                    <p className="text-xs text-muted-foreground">{h.services?.name}</p>
                  </div>
                  {!h.has_review && h.status === 'completed' && (
                    <Button size="sm" variant="secondary" onClick={() => setReviewingAppointment(h)}><Star className="w-3 h-3 mr-1" /> Avaliar</Button>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </section>
      </main>

      <Dialog open={!!reviewingAppointment} onOpenChange={() => setReviewingAppointment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Avaliar serviço</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-8 h-8 cursor-pointer", rating >= s ? "fill-yellow-400 text-yellow-400" : "text-slate-200")} onClick={() => setRating(s)} />)}
            </div>
            <Textarea placeholder="Comentário..." value={comment} onChange={e => setComment(e.target.value)} />
            <div className="flex items-center justify-between border p-3 rounded">
              <Label>Recomendar profissional</Label>
              <Heart className={cn("cursor-pointer", recommended && "fill-rose-500 text-rose-500")} onClick={() => setRecommended(!recommended)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleReviewSubmit} disabled={rating === 0 || isSubmitting}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
