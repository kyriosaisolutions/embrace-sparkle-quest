import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Settings, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  WifiOff,
  LayoutDashboard,
  Search,
  Filter,
  Package,
  ArrowRight,
  Building,
  MapPin,
  Save,
  Trash2,
  Edit2,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  ArrowUpRight,
  History,
  FileText,
  Eye,
  Check,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminAgenda, updateAppointmentStatus, getTenantFullData } from "@/server/functions/admin";
import { getFinanceKPIs, getCommissionsByProfessional } from "@/server/functions/finance";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/admin/login" });
  },
  component: AdminAgendaPage,
});


const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-50 border-blue-200 text-blue-700",
  confirmed: "bg-emerald-50 border-emerald-200 text-emerald-700",
  in_progress: "bg-orange-50 border-orange-200 text-orange-700",
  completed: "bg-slate-50 border-slate-200 text-slate-500",
  cancelled: "bg-rose-50 border-rose-200 text-rose-700 line-through opacity-60",
  no_show: "bg-rose-100 border-rose-300 text-rose-800",
  blocked: "bg-slate-100 border-slate-300 text-slate-400 pattern-diagonal",
};

function AdminAgendaPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"agenda" | "settings" | "services" | "team" | "finance">("agenda");
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string } | null>(null);
  const [isOwner, setIsOwner] = useState(true);
  const [myProfessionalId, setMyProfessionalId] = useState<string | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setCurrentUser({ email: user.email, name: user.user_metadata?.full_name || user.email });
      const { data: pro } = await supabase
        .from("professionals")
        .select("id, access_level")
        .eq("tenant_id", "7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56")
        .eq("email", user.email!)
        .maybeSingle();
      if (pro && pro.access_level === "professional") {
        setIsOwner(false);
        setMyProfessionalId(pro.id);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOffline, setIsOffline] = useState(false);
  
  // Real Tenant Context (Barbearia do Joao ID from seed)
  const tenantId = "7b2d56e2-6e2a-4c12-8f9d-16a7f0e34c56";

  const { data: adminData, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ["adminFullData", tenantId],
    queryFn: () => getTenantFullData({ data: tenantId }),
  });

  const { data: agendaRaw = [], isLoading: isLoadingAgenda } = useQuery({
    queryKey: ["adminAgenda", tenantId, selectedDate.toISOString().split('T')[0]],
    queryFn: () => getAdminAgenda({ data: { tenant_id: tenantId, date: selectedDate.toISOString() } }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { id: string, status: string }) => updateAppointmentStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAgenda"] });
      toast.success("Status atualizado!");
    }
  });

  const agendaData = useMemo(() => {
    return agendaRaw.map((apt: any) => ({
      id: apt.id,
      professional_id: apt.professional_id,
      client: apt.clients?.name || "Convidado",
      service: apt.services?.name,
      time: new Date(apt.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      duration: apt.services?.duration_minutes || 30,
      status: apt.status
    }));
  }, [agendaRaw]);

  const { data: financeData } = useQuery({
    queryKey: ["financeKPIs", tenantId],
    queryFn: () => getFinanceKPIs({ data: tenantId }),
    enabled: isOwner,
  });

  const { data: commissionsData = [] } = useQuery({
    queryKey: ["commissionsPerPro", tenantId],
    queryFn: () => getCommissionsByProfessional({ data: tenantId }),
    enabled: isOwner,
  });

  const handleExportCsv = () => {
    const logs = financeData?.commissionLogs ?? [];
    if (!logs.length) { toast.error("Nenhum dado para exportar."); return; }
    const header = "Data,Profissional,Valor Base (R$),Taxa (%),Comissão (R$),Pago";
    const rows = logs.map((l: any) => [
      new Date(l.calculated_at).toLocaleString("pt-BR"),
      l.professionals?.name ?? "–",
      (l.service_price_cents / 100).toFixed(2),
      l.commission_rate,
      (l.commission_cents / 100).toFixed(2),
      l.paid ? "Sim" : "Não",
    ].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "comissoes.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const fetchCepAdmin = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setTenantInfo(p => ({ ...p, address: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}` }));
        toast.success("Endereço preenchido!");
      } else {
        toast.error("CEP não encontrado.");
      }
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleProPhotoUpload = async (file: File, proId: string) => {
    const ext = file.name.split(".").pop();
    const path = `${proId}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Erro no upload."); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("professionals").update({ photo_url: publicUrl }).eq("id", proId);
    queryClient.invalidateQueries({ queryKey: ["adminFullData", tenantId] });
    toast.success("Foto atualizada!");
  };

  const handleServiceImageUpload = async (file: File, serviceId: string) => {
    const ext = file.name.split(".").pop();
    const path = `${serviceId}.${ext}`;
    const { error: upErr } = await supabase.storage.from("services").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Erro no upload."); return; }
    const { data: { publicUrl } } = supabase.storage.from("services").getPublicUrl(path);
    await supabase.from("services").update({ image_url: publicUrl }).eq("id", serviceId);
    queryClient.invalidateQueries({ queryKey: ["adminFullData", tenantId] });
    toast.success("Imagem atualizada!");
  };

  // Settings states
  const [setupStep, setSetupTab] = useState(1);
  const [tenantInfo, setTenantInfo] = useState({
    name: "Barbearia do João",
    slug: "barbearia-joao",
    cep: "",
    address: "",
    cancellation_hours: 2,
    cancellation_fee: 0
  });

  const categories = useMemo(() => {
    if (!adminData?.services) return ["Corte", "Barba", "Tratamento", "Coloração"];
    return Array.from(new Set(adminData.services.map((s: any) => s.category)));
  }, [adminData]);

  const professionals = useMemo(() => {
    const all = adminData?.professionals || [];
    if (!isOwner && myProfessionalId) return all.filter((p: any) => p.id === myProfessionalId);
    return all;
  }, [adminData, isOwner, myProfessionalId]);

  // Monitor online/offline status
  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 9; i <= 20; i++) {
      slots.push(`${i.toString().padStart(2, "0")}:00`);
      slots.push(`${i.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }, []);

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col border-r">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
          <span className="hidden lg:block font-bold text-white text-lg">Agendaki Admin</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 py-4">
          <Button variant="ghost" onClick={() => setActiveTab("agenda")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "agenda" && "bg-white/10 text-white")}><CalendarIcon className="w-5 h-5" /><span className="hidden lg:block">Agenda</span></Button>
          {isOwner && <Button variant="ghost" onClick={() => setActiveTab("finance")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "finance" && "bg-white/10 text-white")}><DollarSign className="w-5 h-5" /><span className="hidden lg:block">Financeiro</span></Button>}
          <Button variant="ghost" onClick={() => setActiveTab("services")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "services" && "bg-white/10 text-white")}><Package className="w-5 h-5" /><span className="hidden lg:block">Serviços</span></Button>
          {isOwner && <Button variant="ghost" onClick={() => setActiveTab("team")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "team" && "bg-white/10 text-white")}><Users className="w-5 h-5" /><span className="hidden lg:block">Equipe</span></Button>}
          {isOwner && <Button variant="ghost" onClick={() => setActiveTab("settings")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "settings" && "bg-white/10 text-white")}><Settings className="w-5 h-5" /><span className="hidden lg:block">Configurações</span></Button>}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white text-xs">
                {currentUser?.name?.[0]?.toUpperCase() ?? "A"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser?.name ?? "Admin"}</p>
              <p className="text-[10px] text-slate-500 uppercase truncate">{currentUser?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-white/5 text-xs h-8"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden lg:block">Sair</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeTab === "agenda" && (
          <>
            <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <Button size="sm" variant={view === "day" ? "secondary" : "ghost"} onClick={() => setView("day")} className="h-8 text-xs px-4">Dia</Button>
                  <Button size="sm" variant={view === "week" ? "secondary" : "ghost"} onClick={() => setView("week")} className="h-8 text-xs px-4">Semana</Button>
                </div>
                
                <div className="flex items-center gap-2 text-slate-600">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="font-bold text-sm min-w-[120px] text-center">
                    {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isOffline && (
                  <Badge variant="outline" className="bg-amber-50 text-orange-600 border-amber-200 animate-pulse gap-1">
                    <WifiOff className="w-3 h-3" /> Offline — sincronizando...
                  </Badge>
                )}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar agendamento..." className="pl-9 w-64 h-9 text-sm" />
                </div>
                <Button size="sm" className="gap-2 font-bold"><Plus className="w-4 h-4" /> Novo Agendamento</Button>
              </div>
            </header>

            {/* Schedule Grid */}
            <div className="flex-1 overflow-x-auto flex flex-col bg-white">
            <div className="flex border-b sticky top-0 bg-white z-20">
              <div className="w-16 shrink-0 bg-slate-50 border-r" />
              {professionals.map((pro: any) => (
                <div key={pro.id} className="flex-1 min-w-[280px] p-4 flex items-center gap-3 border-r">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/10"><AvatarImage src={pro.photo_url} /><AvatarFallback>{pro.name[0]}</AvatarFallback></Avatar>
                  <div><h3 className="font-bold text-sm text-slate-900">{pro.name}</h3><p className="text-[10px] text-slate-500 uppercase tracking-wider">{pro.role}</p></div>
                </div>
              ))}
            </div>

            <div className="flex-1 relative">
              <div className="flex h-full">
                <div className="w-16 shrink-0 bg-slate-50 border-r flex flex-col">
                  {timeSlots.map(time => (
                    <div key={time} className="h-24 border-b p-2 text-[10px] font-bold text-slate-400 text-center">{time}</div>
                  ))}
                </div>

                {professionals.map((pro: any) => (
                  <div key={pro.id} className="flex-1 min-w-[280px] border-r relative group">
                    {timeSlots.map(time => (
                      <div key={time} className="h-24 border-b border-slate-100 group-hover:bg-slate-50/50 transition-colors" />
                    ))}

                      {agendaData.filter(item => item.professional_id === pro.id).map(apt => {
                        const [h, m] = apt.time.split(":").map(Number);
                        const top = ((h - 9) * 2 + (m === 30 ? 1 : 0)) * 96;
                        const height = (apt.duration / 30) * 48;

                        return (
                          <div 
                            key={apt.id}
                            className={cn(
                              "absolute left-1 right-1 rounded-lg border-2 p-3 shadow-sm cursor-move transition-all z-10 select-none",
                              STATUS_COLORS[apt.status] || "bg-white border-slate-200"
                            )}
                            style={{ top: `${top + 4}px`, height: `${height - 8}px` }}
                          >
                            <div className="flex justify-between items-start">
                              <div><p className="font-bold text-xs truncate">{apt.client}</p><p className="text-[10px] opacity-90 truncate">{apt.service}</p></div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100"><MoreVertical className="w-3 h-3" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "confirmed")}>Confirmar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "in_progress")}>Iniciar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "completed")}>Finalizar</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-rose-600" onClick={() => handleStatusChange(apt.id, "cancelled")}>Cancelar</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="absolute bottom-2 left-3 flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-60" />
                              <span className="text-[10px] font-bold opacity-60">{apt.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "finance" && (
          <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Financeiro & Comissões</h1>
                <p className="text-muted-foreground text-sm">Controle de caixa, conciliação e extrato de profissionais.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2"><History className="h-4 w-4" /> Histórico</Button>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Lançamento Manual</Button>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white"><CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><DollarSign className="h-6 w-6" /></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Faturamento (Hoje)</p><p className="text-xl font-bold text-slate-900">{financeData ? ((financeData.todayRevenue || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "–"}</p></div>
              </CardContent></Card>
              <Card className="bg-white"><CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Wallet className="h-6 w-6" /></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Comissões Pendentes</p><p className="text-xl font-bold text-slate-900">{financeData ? ((financeData.pendingCommissions || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "–"}</p></div>
              </CardContent></Card>
              <Card className="bg-white"><CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center"><CreditCard className="h-6 w-6" /></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Transações Hoje</p><p className="text-xl font-bold text-slate-900">{financeData ? (financeData.todayTransactions?.length ?? 0) : "–"}</p></div>
              </CardContent></Card>
              <Card className="bg-white"><CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center"><TrendingUp className="h-6 w-6" /></div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold">Ticket Médio (Mês)</p><p className="text-xl font-bold text-slate-900">{financeData ? ((financeData.avgTicket || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "–"}</p></div>
              </CardContent></Card>
            </div>

            <Tabs defaultValue="cash_flow">
              <TabsList className="mb-6">
                <TabsTrigger value="cash_flow">Fluxo de Caixa</TabsTrigger>
                <TabsTrigger value="commissions">Comissões por Profissional</TabsTrigger>
                <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
              </TabsList>

              <TabsContent value="cash_flow" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Movimentações de Hoje</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Cliente / Serviço</TableHead>
                          <TableHead>Forma</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(financeData?.todayTransactions ?? []).length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-6">Nenhuma movimentação hoje.</TableCell></TableRow>
                        )}
                        {(financeData?.todayTransactions ?? []).map((item: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{new Date(item.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                            <TableCell><div><p className="font-bold text-sm">{item.clients?.name ?? "–"}</p><p className="text-xs text-muted-foreground">{item.services?.name ?? "–"}</p></div></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold">{item.payment_method ?? "–"}</Badge></TableCell>
                            <TableCell className="font-bold">{((item.total_cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                            <TableCell>{item.status === 'completed' ? <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">Concluído</Badge> : <Badge variant="secondary">{item.status}</Badge>}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commissions" className="space-y-6">
                {(commissionsData as any[]).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma comissão pendente.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(commissionsData as any[]).map((pro: any) => (
                    <Card key={pro.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10"><AvatarImage src={pro.photo_url} /><AvatarFallback>{pro.name?.[0]}</AvatarFallback></Avatar>
                          <div><CardTitle className="text-sm">{pro.name}</CardTitle><CardDescription className="text-xs">{pro.commission_value}% comissão</CardDescription></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-end border-b pb-4">
                          <div><p className="text-[10px] text-muted-foreground uppercase font-bold">A pagar</p><p className="text-2xl font-bold text-slate-900">{((pro.pendingTotal || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
                          <Button size="sm" className="gap-2 h-8 text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> Fechar</Button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Serviços (mês)</span><span className="font-bold">{pro.monthCount}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Comissão</span><span className="font-bold">{pro.commission_value}%</span></div>
                        </div>
                        <Button variant="outline" className="w-full text-xs h-8 gap-2"><Eye className="h-3.5 w-3.5" /> Detalhar</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div><CardTitle className="text-lg">Audit Log: Cálculos de Comissão</CardTitle><CardDescription>Registros imutáveis gerados na conclusão do serviço.</CardDescription></div>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCsv}><FileText className="h-4 w-4" /> Exportar CSV</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Profissional</TableHead>
                          <TableHead>Preço Base</TableHead>
                          <TableHead>Taxa (%)</TableHead>
                          <TableHead>Comissão</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(financeData?.commissionLogs ?? []).length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-6">Nenhum log de comissão.</TableCell></TableRow>
                        )}
                        {(financeData?.commissionLogs ?? []).map((log: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-[10px]">{new Date(log.calculated_at).toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-sm font-medium">{log.professionals?.name ?? "–"}</TableCell>
                            <TableCell className="text-sm">{((log.service_price_cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                            <TableCell className="text-sm">{log.commission_rate}%</TableCell>
                            <TableCell className="text-sm font-bold text-primary">{((log.commission_cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                            <TableCell>{log.paid ? <Badge className="bg-slate-100 text-slate-600 border-none">Pago</Badge> : <Badge className="bg-blue-50 text-blue-600 border-none">Pendente</Badge>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
            <h1 className="text-2xl font-bold mb-8">Configurações do Salão</h1>
            
            <Tabs defaultValue="onboarding" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="onboarding">Wizard Onboarding</TabsTrigger>
                <TabsTrigger value="general">Geral</TabsTrigger>
                <TabsTrigger value="policies">Políticas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="onboarding">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Passo {setupStep} de 5</CardTitle>
                        <CardDescription>Configure seu salão em poucos minutos.</CardDescription>
                      </div>
                      <Badge variant="secondary">Agendaki Onboarding</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {setupStep === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
                          <div className="w-24 h-24 bg-white border rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50 border-dashed">
                            <Plus className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label>Nome do estabelecimento</Label>
                            <Input placeholder="Ex: Barbearia do João" value={tenantInfo.name} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Link do seu salão (URL)</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">app.agendaki.com/</span>
                            <Input placeholder="nome-do-salao" value={tenantInfo.slug} />
                          </div>
                        </div>
                      </div>
                    )}

                    {setupStep === 2 && (
                      <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2 space-y-2">
                            <Label>CEP</Label>
                            <Input placeholder="00000-000" value={tenantInfo.cep}
                              onChange={e => setTenantInfo(p => ({ ...p, cep: e.target.value }))}
                              onBlur={() => fetchCepAdmin(tenantInfo.cep)} />
                          </div>
                          <div className="space-y-2 flex items-end">
                            <Button variant="outline" className="w-full" onClick={() => fetchCepAdmin(tenantInfo.cep)} disabled={isLoadingCep}>
                              {isLoadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Endereço Completo</Label>
                          <Input placeholder="Rua, Número, Bairro" value={tenantInfo.address}
                            onChange={e => setTenantInfo(p => ({ ...p, address: e.target.value }))} />
                        </div>
                        <div className="space-y-2"><Label>Complemento</Label><Input placeholder="Sala, andar, etc." /></div>
                      </div>
                    )}
                  </CardContent>
                  <DialogFooter className="p-6 border-t bg-muted/10">
                    {setupStep > 1 && <Button variant="outline" onClick={() => setSetupTab(s => s - 1)}>Voltar</Button>}
                    <Button onClick={() => setupStep < 5 ? setSetupTab(s => s + 1) : toast.success("Setup concluído!")}>
                      {setupStep === 5 ? "Concluir Onboarding" : "Próximo Passo"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="general" className="space-y-6">
                <Card><CardHeader><CardTitle>Redes Sociais</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Instagram</Label><Input placeholder="@seu_salao" /></div>
                  <div className="space-y-2"><Label>Facebook URL</Label><Input placeholder="facebook.com/seu_salao" /></div>
                  <Button className="gap-2"><Save className="h-4 w-4" /> Salvar Alterações</Button>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="policies" className="space-y-6">
                <Card><CardHeader><CardTitle>Política de Cancelamento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Antecedência mínima (horas)</Label><Input type="number" value={tenantInfo.cancellation_hours} /></div>
                    <div className="space-y-2"><Label>Multa por cancelamento tardio (%)</Label><Input type="number" value={tenantInfo.cancellation_fee} /></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-confirm" />
                    <Label htmlFor="auto-confirm">Confirmar agendamentos automaticamente</Label>
                  </div>
                  <Button className="gap-2"><Save className="h-4 w-4" /> Salvar Políticas</Button>
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === "services" && (
          <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Gestão de Serviços</h1>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Adicionar Serviço</Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {adminData?.services.map((svc: any) => (
                <Card key={svc.id} className="group hover:border-primary/50 transition-all">
                  <CardContent className="p-4 flex items-center gap-6">
                    <div className="relative w-16 h-16 shrink-0">
                      {svc.image_url
                        ? <img src={svc.image_url} alt={svc.name} className="w-16 h-16 rounded-lg object-cover" />
                        : <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Package className="h-6 w-6" /></div>
                      }
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-opacity">
                        <Upload className="w-4 h-4 text-white" />
                        <input type="file" accept="image/*" className="sr-only"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleServiceImageUpload(f, svc.id); }} />
                      </label>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{svc.name}</h3>
                        <Badge variant="outline" className="text-[10px]">{svc.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{svc.duration_minutes} min • {(svc.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "team" && (
          <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Gestão de Equipe</h1>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Convidar Profissional</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {professionals.map((pro: any) => (
                <Card key={pro.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-4 items-start mb-6">
                      <div className="relative group/avatar">
                        <Avatar className="h-16 w-16"><AvatarImage src={pro.photo_url} /><AvatarFallback className="text-lg">{pro.name?.[0]}</AvatarFallback></Avatar>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 rounded-full cursor-pointer transition-opacity">
                          <Upload className="w-4 h-4 text-white" />
                          <input type="file" accept="image/*" className="sr-only"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleProPhotoUpload(f, pro.id); }} />
                        </label>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{pro.name}</h3>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none">{pro.role}</Badge>
                        <p className="text-xs text-muted-foreground mt-2 italic">Acesso: {pro.access_level === "owner" ? "Dono" : "Profissional"}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Editar Perfil</DropdownMenuItem>
                          <DropdownMenuItem>Horário de Trabalho</DropdownMenuItem>
                          <DropdownMenuItem>Configurar Comissão</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-600">Desativar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg"><p className="text-[10px] text-muted-foreground uppercase font-bold">Comissão</p><p className="font-bold">{pro.commission_value ?? 0}%</p></div>
                      <div className="bg-slate-50 p-3 rounded-lg"><p className="text-[10px] text-muted-foreground uppercase font-bold">Tipo</p><p className="font-bold capitalize">{pro.commission_type ?? "percent"}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
