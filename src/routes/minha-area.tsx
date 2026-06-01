import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rescheduleAppointment } from "@/server/functions/schedule";
import { exportClientData, requestAccountDeletion } from "@/server/functions/lgpd";
import { Input } from "@/components/ui/input";
import { Download, Trash2, CalendarClock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/minha-area")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: MyAreaPage,
});

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function canReview(apt: any): boolean {
  if (apt.status !== "completed") return false;
  if (apt.has_review) return false;
  return Date.now() - new Date(apt.starts_at).getTime() <= SEVEN_DAYS_MS;
}

function MyAreaPage() {
  const qc = useQueryClient();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<{ email?: string; name?: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setAuthUser({ email: user.email, name: user.user_metadata?.full_name });

      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .or(`email.eq.${user.email},google_id.eq.${user.id}`)
        .maybeSingle();

      if (existing) {
        setClientId(existing.id);
      } else {
        const { data: created } = await supabase
          .from("clients")
          .insert({
            name: user.user_metadata?.full_name || user.email || "Cliente",
            email: user.email,
            google_id: user.id,
          })
          .select("id")
          .single();
        if (created) setClientId(created.id);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleCancelAppointment = async (appointment: any) => {
    const tenantCancellationHours = appointment.tenants?.cancellation_hours ?? 2;
    const hoursUntil = (new Date(appointment.starts_at).getTime() - Date.now()) / 3600000;
    if (hoursUntil < tenantCancellationHours) {
      toast.error(`Cancelamento não permitido com menos de ${tenantCancellationHours}h de antecedência.`);
      return;
    }
    setCancellingId(appointment.id);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointment.id);
      if (error) throw error;
      toast.success("Agendamento cancelado.");
      qc.invalidateQueries({ queryKey: ["my-appointments", clientId] });
    } catch {
      toast.error("Erro ao cancelar agendamento.");
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["my-appointments", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, tenants(name, slug, logo_url), services(name), professionals(name)")
        .eq("client_id", clientId!)
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

  const [rescheduleApt, setRescheduleApt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showLgpd, setShowLgpd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleReschedule = async () => {
    if (!rescheduleApt || !rescheduleDate || !rescheduleTime) return;
    const oldStart = new Date(rescheduleApt.starts_at).getTime();
    const oldEnd = new Date(rescheduleApt.ends_at).getTime();
    const duration = oldEnd - oldStart;
    const newStart = new Date(`${rescheduleDate}T${rescheduleTime}`);
    if (isNaN(newStart.getTime())) { toast.error("Data/hora inválida."); return; }
    if (newStart.getTime() < Date.now()) { toast.error("Data deve ser no futuro."); return; }
    const hoursUntilOld = (oldStart - Date.now()) / 3600000;
    const minHours = rescheduleApt.tenants?.cancellation_hours ?? 2;
    if (hoursUntilOld < minHours) {
      toast.error(`Reagendamento exige ${minHours}h de antecedência.`);
      return;
    }
    setIsRescheduling(true);
    try {
      await rescheduleAppointment({
        data: {
          appointment_id: rescheduleApt.id,
          new_starts_at: newStart.toISOString(),
          new_ends_at: new Date(newStart.getTime() + duration).toISOString(),
        },
      });
      toast.success("Agendamento reagendado.");
      setRescheduleApt(null);
      setRescheduleDate("");
      setRescheduleTime("");
      qc.invalidateQueries({ queryKey: ["my-appointments", clientId] });
    } catch {
      toast.error("Erro ao reagendar.");
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleExportData = async () => {
    if (!clientId) return;
    try {
      const data = await exportClientData({ data: clientId });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Seus dados foram baixados.");
    } catch {
      toast.error("Erro ao exportar dados.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!clientId) return;
    try {
      await requestAccountDeletion({ data: clientId });
      await supabase.auth.signOut();
      toast.success("Conta removida.");
      window.location.href = "/";
    } catch {
      toast.error("Erro ao remover conta.");
    }
  };

  const [reviewingAppointment, setReviewingAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommended, setRecommended] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleReviewSubmit = async () => {
    if (!clientId) { toast.error("Erro: usuário não identificado."); return; }
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

  const mySalons = useMemo(() => {
    const seen = new Set<string>();
    return appointments
      .filter((a: any) => a.tenants && !seen.has(a.tenants.slug) && seen.add(a.tenants.slug))
      .map((a: any) => a.tenants);
  }, [appointments]);

  if (!clientId && !isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <ExternalLink className="w-5 h-5" />
          <span>Minha Área</span>
        </div>
        <div className="flex items-center gap-4">
          {authUser?.name && <span className="text-sm text-muted-foreground hidden sm:block">{authUser.name}</span>}
          <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
        </div>
      </header>
    <div className="p-4 md:p-8">
      <main className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Olá{authUser?.name ? `, ${authUser.name.split(" ")[0]}` : ""}!</h1>
        
        <section className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Próximos</h2>
          {nextAppointments.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
          )}
          {nextAppointments.map((appointment: any) => {
            const hoursUntil = (new Date(appointment.starts_at).getTime() - Date.now()) / 3600000;
            const cancellationHours = appointment.tenants?.cancellation_hours ?? 2;
            const canCancel = appointment.status !== "cancelled" && hoursUntil >= cancellationHours;
            return (
              <Card key={appointment.id} className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold">{appointment.tenants?.name}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.services?.name}</p>
                      <p className="text-sm">{new Date(appointment.starts_at).toLocaleString('pt-BR')}</p>
                      <div className="mt-2">{getStatusBadge(appointment.status)}</div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/${appointment.tenants?.slug}`}>Ver Salão</a>
                      </Button>
                      {canCancel && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRescheduleApt(appointment);
                              setRescheduleDate(new Date(appointment.starts_at).toISOString().slice(0, 10));
                              setRescheduleTime(new Date(appointment.starts_at).toISOString().slice(11, 16));
                            }}
                          >
                            <CalendarClock className="w-3 h-3 mr-1" /> Reagendar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => setConfirmCancelId(appointment.id)}
                            disabled={cancellingId === appointment.id}
                          >
                            {cancellingId === appointment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
                <Dialog open={confirmCancelId === appointment.id} onOpenChange={() => setConfirmCancelId(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancelar agendamento?</DialogTitle>
                      <DialogDescription>
                        Você está prestes a cancelar <strong>{appointment.services?.name}</strong> em{" "}
                        <strong>{appointment.tenants?.name}</strong> no dia{" "}
                        {new Date(appointment.starts_at).toLocaleDateString('pt-BR')}. Esta ação não pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setConfirmCancelId(null)}>Manter</Button>
                      <Button variant="destructive" onClick={() => handleCancelAppointment(appointment)} disabled={!!cancellingId}>
                        {cancellingId ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Confirmar cancelamento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Card>
            );
          })}
        </section>

        {mySalons.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Meus Salões</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mySalons.map((salon: any) => (
                <Card key={salon.slug} className="overflow-hidden hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                        {salon.name?.[0]}
                      </div>
                      <p className="font-bold text-sm">{salon.name}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/${salon.slug}`}>Ver</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <Collapsible open={showLgpd} onOpenChange={setShowLgpd}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Privacidade e dados (LGPD)</div>
                {showLgpd ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-4">
              <p className="text-xs text-muted-foreground">
                Você tem direito de acessar, exportar e excluir seus dados a qualquer momento.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleExportData}>
                  <Download className="w-3 h-3 mr-1" /> Baixar meus dados (JSON)
                </Button>
                <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Excluir minha conta
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
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
                  {canReview(h) && (
                    <Button size="sm" variant="secondary" onClick={() => setReviewingAppointment(h)}><Star className="w-3 h-3 mr-1" /> Avaliar</Button>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </section>
      </main>
    </div>

      <Dialog open={!!rescheduleApt} onOpenChange={() => setRescheduleApt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar</DialogTitle>
            <DialogDescription>Escolha nova data e horário para {rescheduleApt?.services?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Data</Label>
              <Input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleApt(null)}>Cancelar</Button>
            <Button onClick={handleReschedule} disabled={isRescheduling}>
              {isRescheduling && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta?</DialogTitle>
            <DialogDescription>
              Seus dados pessoais serão removidos. Registros de agendamentos passados serão anonimizados para fins fiscais.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Manter conta</Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>Excluir definitivamente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

