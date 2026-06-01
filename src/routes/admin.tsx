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
  Loader2,
  Receipt,
  Star,
  Minus,
  ShoppingCart,
  AlertTriangle
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
import { getAdminAgenda, updateAppointmentStatus, getTenantFullData } from "@/lib/functions/admin";
import { getFinanceKPIs, getCommissionsByProfessional } from "@/lib/functions/finance";
import {
  listOpenComandas,
  openComanda,
  addComandaItem,
  removeComandaItem,
  applyComandaDiscount,
  closeComanda,
  getComanda,
} from "@/lib/functions/comandas";
import {
  getCurrentSession,
  openCashSession,
  closeCashSession,
  addCashMovement,
  listSessionMovements,
} from "@/lib/functions/cash";
import {
  listProducts,
  upsertProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
} from "@/lib/functions/products";
import { getLoyaltyRules, upsertLoyaltyRules } from "@/lib/functions/loyalty";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/admin-login" });
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
  const [activeTab, setActiveTab] = useState<"agenda" | "settings" | "services" | "team" | "finance" | "comandas" | "caixa" | "estoque" | "fidelidade">("agenda");
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
    navigate({ to: "/admin-login" });
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
          <Button variant="ghost" onClick={() => setActiveTab("comandas")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "comandas" && "bg-white/10 text-white")}><Receipt className="w-5 h-5" /><span className="hidden lg:block">Comandas</span></Button>
          <Button variant="ghost" onClick={() => setActiveTab("caixa")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "caixa" && "bg-white/10 text-white")}><Wallet className="w-5 h-5" /><span className="hidden lg:block">Caixa</span></Button>
          {isOwner && <Button variant="ghost" onClick={() => setActiveTab("finance")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "finance" && "bg-white/10 text-white")}><DollarSign className="w-5 h-5" /><span className="hidden lg:block">Financeiro</span></Button>}
          <Button variant="ghost" onClick={() => setActiveTab("services")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "services" && "bg-white/10 text-white")}><Package className="w-5 h-5" /><span className="hidden lg:block">Serviços</span></Button>
          {isOwner && <Button variant="ghost" onClick={() => setActiveTab("estoque")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "estoque" && "bg-white/10 text-white")}><ShoppingCart className="w-5 h-5" /><span className="hidden lg:block">Estoque</span></Button>}
          {isOwner && <Button variant="ghost" onClick={() => setActiveTab("fidelidade")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "fidelidade" && "bg-white/10 text-white")}><Star className="w-5 h-5" /><span className="hidden lg:block">Fidelidade</span></Button>}
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

        {activeTab === "comandas" && <ComandasPanel tenantId={tenantId} services={adminData?.services ?? []} />}
        {activeTab === "caixa" && <CaixaPanel tenantId={tenantId} />}
        {activeTab === "estoque" && isOwner && <EstoquePanel tenantId={tenantId} />}
        {activeTab === "fidelidade" && isOwner && <FidelidadePanel tenantId={tenantId} />}

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

// ============================================================
// Helpers
// ============================================================
const BRL = (cents: number) =>
  ((cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ============================================================
// Comandas Panel (PDV)
// ============================================================
function ComandasPanel({ tenantId, services }: { tenantId: string; services: any[] }) {
  const qc = useQueryClient();
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");

  const { data: comandas = [] } = useQuery({
    queryKey: ["openComandas", tenantId],
    queryFn: () => listOpenComandas({ data: tenantId }),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: () => listProducts({ data: tenantId }),
  });

  const { data: comandaDetail } = useQuery({
    queryKey: ["comandaDetail", selectedComandaId],
    queryFn: () => getComanda({ data: selectedComandaId! }),
    enabled: !!selectedComandaId,
  });

  const [clientSearch, setClientSearch] = useState("");
  const { data: clients = [] } = useQuery({
    queryKey: ["clientsSearch", tenantId, clientSearch],
    queryFn: async () => {
      let q = supabase.from("clients").select("id, name, phone").eq("tenant_id", tenantId).limit(20);
      if (clientSearch) q = q.ilike("name", `%${clientSearch}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const openMut = useMutation({
    mutationFn: (vars: { client_id: string | null }) =>
      openComanda({ data: { tenant_id: tenantId, client_id: vars.client_id } }),
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["openComandas"] });
      setSelectedComandaId(row.id);
      setOpenNewDialog(false);
      toast.success("Comanda aberta!");
    },
  });

  const addItemMut = useMutation({
    mutationFn: addComandaItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comandaDetail", selectedComandaId] });
      qc.invalidateQueries({ queryKey: ["openComandas"] });
    },
  });

  const removeItemMut = useMutation({
    mutationFn: removeComandaItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comandaDetail", selectedComandaId] });
      qc.invalidateQueries({ queryKey: ["openComandas"] });
    },
  });

  const discountMut = useMutation({
    mutationFn: applyComandaDiscount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comandaDetail", selectedComandaId] });
      qc.invalidateQueries({ queryKey: ["openComandas"] });
    },
  });

  const closeMut = useMutation({
    mutationFn: closeComanda,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["openComandas"] });
      qc.invalidateQueries({ queryKey: ["currentCashSession"] });
      console.info("comanda_closed", { tenant: tenantId, method: paymentMethod });
      toast.success("Comanda fechada!");
      setCloseDialogOpen(false);
      setSelectedComandaId(null);
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao fechar comanda"),
  });

  const [discountInput, setDiscountInput] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const filteredServices = useMemo(
    () => services.filter((s) => s.name.toLowerCase().includes(itemSearch.toLowerCase())),
    [services, itemSearch],
  );
  const filteredProducts = useMemo(
    () =>
      (products as any[]).filter((p) =>
        p.name.toLowerCase().includes(itemSearch.toLowerCase()),
      ),
    [products, itemSearch],
  );

  // Detail view
  if (selectedComandaId && comandaDetail?.comanda) {
    const c = comandaDetail.comanda;
    const items = comandaDetail.items;
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedComandaId(null)} className="gap-2 mb-2">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>
            <h1 className="text-2xl font-bold">Comanda #{c.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">{c.clients?.name ?? "Sem cliente"}</p>
          </div>
          <Button onClick={() => setCloseDialogOpen(true)} className="gap-2">
            <Check className="w-4 h-4" /> Fechar comanda
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Catalog */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Adicionar itens</CardTitle>
              <Input
                placeholder="Buscar serviço ou produto..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Serviços</p>
                <div className="space-y-1">
                  {filteredServices.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{BRL(s.price_cents)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addItemMut.mutate({
                            data: {
                              comanda_id: c.id,
                              kind: "service",
                              service_id: s.id,
                              description: s.name,
                              quantity: 1,
                              unit_price_cents: s.price_cents,
                            },
                          })
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Produtos</p>
                <div className="space-y-1">
                  {filteredProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {BRL(p.price_cents)} • estoque: {p.stock_qty}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addItemMut.mutate({
                            data: {
                              comanda_id: c.id,
                              kind: "product",
                              product_id: p.id,
                              description: p.name,
                              quantity: 1,
                              unit_price_cents: p.price_cents,
                            },
                          })
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Nenhum produto.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Itens ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum item adicionado.</p>
              )}
              {items.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between gap-2 p-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.quantity}x {BRL(it.unit_price_cents)}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{BRL(it.total_cents)}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-rose-500"
                    onClick={() => removeItemMut.mutate({ data: { item_id: it.id, comanda_id: c.id } })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{BRL(c.subtotal_cents ?? 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs flex-1">Desconto (R$)</Label>
                  <Input
                    type="number"
                    className="w-28 h-8"
                    placeholder="0,00"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      discountMut.mutate({
                        data: {
                          comanda_id: c.id,
                          discount_cents: Math.round(parseFloat(discountInput || "0") * 100),
                        },
                      })
                    }
                  >
                    Aplicar
                  </Button>
                </div>
                <div className="flex justify-between text-sm text-rose-600">
                  <span>Desconto</span>
                  <span>- {BRL(c.discount_cents ?? 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{BRL(c.total_cents ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fechar comanda</DialogTitle>
              <DialogDescription>Total: {BRL(c.total_cents ?? 0)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label>Forma de pagamento</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                {["dinheiro", "pix", "debito", "credito"].map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <RadioGroupItem value={m} id={`pm-${m}`} />
                    <Label htmlFor={`pm-${m}`} className="capitalize cursor-pointer">
                      {m}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => closeMut.mutate({ data: { comanda_id: c.id, payment_method: paymentMethod } })}
                disabled={closeMut.isPending}
              >
                {closeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Comandas abertas</h1>
          <p className="text-sm text-muted-foreground">{(comandas as any[]).length} em aberto</p>
        </div>
        <Button className="gap-2" onClick={() => setOpenNewDialog(true)}>
          <Plus className="w-4 h-4" /> Nova comanda
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(comandas as any[]).map((c: any) => (
          <Card
            key={c.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedComandaId(c.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-sm">{c.clients?.name ?? "Sem cliente"}</p>
                <Badge variant="outline" className="text-[10px]">
                  #{c.id.slice(0, 6)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Aberta {new Date(c.created_at).toLocaleString("pt-BR")}
              </p>
              <p className="text-lg font-bold mt-2">{BRL(c.total_cents ?? 0)}</p>
            </CardContent>
          </Card>
        ))}
        {(comandas as any[]).length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">
            Nenhuma comanda em aberto.
          </p>
        )}
      </div>

      <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova comanda</DialogTitle>
            <DialogDescription>Escolha o cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => openMut.mutate({ client_id: null })}
              >
                Sem cliente (avulso)
              </Button>
              {(clients as any[]).map((cl: any) => (
                <Button
                  key={cl.id}
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => openMut.mutate({ client_id: cl.id })}
                >
                  {cl.name}
                  <span className="ml-auto text-xs text-muted-foreground">{cl.phone}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Caixa Panel
// ============================================================
function CaixaPanel({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const [openingCents, setOpeningCents] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [movDialog, setMovDialog] = useState<null | "withdraw" | "reinforcement" | "expense">(null);
  const [movAmount, setMovAmount] = useState("");
  const [movReason, setMovReason] = useState("");
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingCents, setClosingCents] = useState("");

  const { data: session } = useQuery({
    queryKey: ["currentCashSession", tenantId],
    queryFn: () => getCurrentSession({ data: tenantId }),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["sessionMovements", session?.id],
    queryFn: () => listSessionMovements({ data: session!.id }),
    enabled: !!session?.id,
  });

  const openMut = useMutation({
    mutationFn: openCashSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentCashSession"] });
      console.info("cash_opened", { tenant: tenantId });
      toast.success("Caixa aberto!");
      setOpeningCents("");
      setOpeningNotes("");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao abrir caixa"),
  });

  const movMut = useMutation({
    mutationFn: addCashMovement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessionMovements"] });
      toast.success("Movimento registrado");
      setMovDialog(null);
      setMovAmount("");
      setMovReason("");
    },
  });

  const closeMut = useMutation({
    mutationFn: closeCashSession,
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["currentCashSession"] });
      const diff = row?.difference_cents ?? 0;
      console.info("cash_closed", { tenant: tenantId, difference: diff });
      toast.success(
        `Caixa fechado. Diferença: ${BRL(diff)} ${diff === 0 ? "(exato)" : diff > 0 ? "(sobra)" : "(falta)"}`,
      );
      setCloseDialogOpen(false);
      setClosingCents("");
    },
  });

  if (!session) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Abrir caixa</h1>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Valor inicial (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={openingCents}
                onChange={(e) => setOpeningCents(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Opcional..."
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={() =>
                openMut.mutate({
                  data: {
                    tenant_id: tenantId,
                    opening_cents: Math.round(parseFloat(openingCents || "0") * 100),
                    notes: openingNotes || undefined,
                  },
                })
              }
              disabled={openMut.isPending}
            >
              <Wallet className="w-4 h-4" /> Abrir caixa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Caixa aberto</h1>
          <p className="text-sm text-muted-foreground">
            Desde {new Date(session.opened_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <Button variant="destructive" className="gap-2" onClick={() => setCloseDialogOpen(true)}>
          <XCircle className="w-4 h-4" /> Fechar caixa
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Abertura</p>
            <p className="text-xl font-bold">{BRL(session.opening_cents ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Movimentos</p>
            <p className="text-xl font-bold">{(movements as any[]).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Vendas</p>
            <p className="text-xl font-bold">
              {(movements as any[]).filter((m: any) => m.kind === "sale").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-2" onClick={() => setMovDialog("withdraw")}>
          <ArrowUpRight className="w-4 h-4" /> Sangria
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setMovDialog("reinforcement")}>
          <Plus className="w-4 h-4" /> Suprimento
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setMovDialog("expense")}>
          <Minus className="w-4 h-4" /> Despesa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(movements as any[]).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    Nenhum movimento.
                  </TableCell>
                </TableRow>
              )}
              {(movements as any[]).map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">
                    {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {m.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{m.payment_method ?? "–"}</TableCell>
                  <TableCell className="font-bold">{BRL(m.amount_cents)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.reason ?? "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={movDialog !== null} onOpenChange={(o) => !o && setMovDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movDialog === "withdraw" && "Sangria"}
              {movDialog === "reinforcement" && "Suprimento"}
              {movDialog === "expense" && "Despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={movAmount}
                onChange={(e) => setMovAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={movReason} onChange={(e) => setMovReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                movDialog &&
                movMut.mutate({
                  data: {
                    session_id: session.id,
                    tenant_id: tenantId,
                    kind: movDialog,
                    amount_cents: Math.round(parseFloat(movAmount || "0") * 100),
                    reason: movReason || undefined,
                  },
                })
              }
              disabled={movMut.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar caixa</DialogTitle>
            <DialogDescription>Informe o valor contado em dinheiro no caixa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Valor contado (R$)</Label>
            <Input
              type="number"
              value={closingCents}
              onChange={(e) => setClosingCents(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                closeMut.mutate({
                  data: {
                    session_id: session.id,
                    closing_cents: Math.round(parseFloat(closingCents || "0") * 100),
                  },
                })
              }
              disabled={closeMut.isPending}
            >
              Confirmar fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Estoque Panel
// ============================================================
function EstoquePanel({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const [onlyLow, setOnlyLow] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    cost_cents: "",
    price_cents: "",
    stock_qty: "",
    min_stock_qty: "",
  });
  const [adjForm, setAdjForm] = useState<{ kind: "in" | "out" | "adjust" | "loss"; quantity: string; reason: string }>({
    kind: "in",
    quantity: "",
    reason: "",
  });

  const { data: products = [] } = useQuery({
    queryKey: ["productsList", tenantId],
    queryFn: () => listProducts({ data: tenantId }),
  });

  const filtered = useMemo(() => {
    const list = products as any[];
    if (!onlyLow) return list;
    return list.filter((p: any) => p.stock_qty <= p.min_stock_qty);
  }, [products, onlyLow]);

  const createMut = useMutation({
    mutationFn: upsertProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productsList"] });
      toast.success("Produto salvo!");
      setNewDialogOpen(false);
      setForm({ name: "", sku: "", category: "", cost_cents: "", price_cents: "", stock_qty: "", min_stock_qty: "" });
    },
  });

  const adjustMut = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productsList"] });
      toast.success("Estoque ajustado!");
      setAdjustProduct(null);
      setAdjForm({ kind: "in", quantity: "", reason: "" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productsList"] });
      toast.success("Produto removido");
    },
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Estoque</h1>
        <Button className="gap-2" onClick={() => setNewDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Novo produto
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="onlyLow" checked={onlyLow} onCheckedChange={(v) => setOnlyLow(!!v)} />
        <Label htmlFor="onlyLow" className="text-sm cursor-pointer">
          Apenas estoque baixo
        </Label>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    Nenhum produto.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p: any) => {
                const isLow = p.stock_qty <= p.min_stock_qty;
                return (
                  <TableRow key={p.id} className={cn(isLow && "bg-rose-50")}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs">{p.category ?? "–"}</TableCell>
                    <TableCell>{BRL(p.price_cents)}</TableCell>
                    <TableCell className={cn(isLow && "text-rose-600 font-bold")}>
                      {p.stock_qty} {isLow && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                    </TableCell>
                    <TableCell>
                      {p.active ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => setAdjustProduct(p)}>
                        Ajustar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-rose-500"
                        onClick={() => deleteMut.mutate({ data: p.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo produto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Custo (R$)</Label>
              <Input
                type="number"
                value={form.cost_cents}
                onChange={(e) => setForm({ ...form, cost_cents: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                value={form.price_cents}
                onChange={(e) => setForm({ ...form, price_cents: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Estoque inicial</Label>
              <Input
                type="number"
                value={form.stock_qty}
                onChange={(e) => setForm({ ...form, stock_qty: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Estoque mínimo</Label>
              <Input
                type="number"
                value={form.min_stock_qty}
                onChange={(e) => setForm({ ...form, min_stock_qty: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                createMut.mutate({
                  data: {
                    tenant_id: tenantId,
                    name: form.name,
                    sku: form.sku || null,
                    category: form.category || null,
                    cost_cents: Math.round(parseFloat(form.cost_cents || "0") * 100),
                    price_cents: Math.round(parseFloat(form.price_cents || "0") * 100),
                    stock_qty: parseInt(form.stock_qty || "0"),
                    min_stock_qty: parseInt(form.min_stock_qty || "0"),
                    active: true,
                  },
                })
              }
              disabled={createMut.isPending || !form.name}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustProduct} onOpenChange={(o) => !o && setAdjustProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar estoque — {adjustProduct?.name}</DialogTitle>
            <DialogDescription>Estoque atual: {adjustProduct?.stock_qty}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup
                value={adjForm.kind}
                onValueChange={(v) => setAdjForm({ ...adjForm, kind: v as any })}
              >
                {[
                  { v: "in", l: "Entrada" },
                  { v: "out", l: "Saída" },
                  { v: "adjust", l: "Ajuste" },
                  { v: "loss", l: "Perda" },
                ].map((o) => (
                  <div key={o.v} className="flex items-center gap-2">
                    <RadioGroupItem value={o.v} id={`adj-${o.v}`} />
                    <Label htmlFor={`adj-${o.v}`} className="cursor-pointer">
                      {o.l}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1">
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={adjForm.quantity}
                onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Input
                value={adjForm.reason}
                onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustProduct(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                adjustProduct &&
                adjustMut.mutate({
                  data: {
                    tenant_id: tenantId,
                    product_id: adjustProduct.id,
                    kind: adjForm.kind,
                    quantity: parseInt(adjForm.quantity || "0"),
                    reason: adjForm.reason || undefined,
                  },
                })
              }
              disabled={adjustMut.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Fidelidade Panel
// ============================================================
function FidelidadePanel({ tenantId }: { tenantId: string }) {
  const qc = useQueryClient();
  const { data: rules } = useQuery({
    queryKey: ["loyaltyRules", tenantId],
    queryFn: () => getLoyaltyRules({ data: tenantId }),
  });

  const [form, setForm] = useState({
    enabled: true,
    points_per_currency_unit: 1,
    currency_unit_cents: 100,
    points_to_currency_unit: 100,
    reward_currency_unit_cents: 100,
    min_redeem_points: 100,
    expires_in_days: "",
  });

  useEffect(() => {
    if (rules) {
      setForm({
        enabled: rules.enabled ?? true,
        points_per_currency_unit: rules.points_per_currency_unit ?? 1,
        currency_unit_cents: rules.currency_unit_cents ?? 100,
        points_to_currency_unit: rules.points_to_currency_unit ?? 100,
        reward_currency_unit_cents: rules.reward_currency_unit_cents ?? 100,
        min_redeem_points: rules.min_redeem_points ?? 100,
        expires_in_days: rules.expires_in_days?.toString() ?? "",
      });
    }
  }, [rules]);

  const saveMut = useMutation({
    mutationFn: upsertLoyaltyRules,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyaltyRules"] });
      toast.success("Regras salvas!");
    },
  });

  const [simInput, setSimInput] = useState("100");
  const simPoints = useMemo(() => {
    const reais = parseFloat(simInput || "0");
    if (!form.enabled || !form.currency_unit_cents) return 0;
    return Math.floor((reais * 100) / form.currency_unit_cents) * form.points_per_currency_unit;
  }, [simInput, form]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-4">
      <h1 className="text-2xl font-bold">Programa de Fidelidade</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regras</CardTitle>
          <CardDescription>Configure como os clientes acumulam e resgatam pontos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="enabled"
              checked={form.enabled}
              onCheckedChange={(v) => setForm({ ...form, enabled: v })}
            />
            <Label htmlFor="enabled">Programa habilitado</Label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Pontos por unidade gasta</Label>
              <Input
                type="number"
                value={form.points_per_currency_unit}
                onChange={(e) =>
                  setForm({ ...form, points_per_currency_unit: parseFloat(e.target.value || "0") })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Unidade em centavos (100 = R$ 1)</Label>
              <Input
                type="number"
                value={form.currency_unit_cents}
                onChange={(e) =>
                  setForm({ ...form, currency_unit_cents: parseInt(e.target.value || "0") })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Pontos para resgate</Label>
              <Input
                type="number"
                value={form.points_to_currency_unit}
                onChange={(e) =>
                  setForm({ ...form, points_to_currency_unit: parseFloat(e.target.value || "0") })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Valor do resgate (centavos)</Label>
              <Input
                type="number"
                value={form.reward_currency_unit_cents}
                onChange={(e) =>
                  setForm({ ...form, reward_currency_unit_cents: parseInt(e.target.value || "0") })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Mínimo para resgate (pontos)</Label>
              <Input
                type="number"
                value={form.min_redeem_points}
                onChange={(e) => setForm({ ...form, min_redeem_points: parseInt(e.target.value || "0") })}
              />
            </div>
            <div className="space-y-1">
              <Label>Expira em (dias, opcional)</Label>
              <Input
                type="number"
                value={form.expires_in_days}
                onChange={(e) => setForm({ ...form, expires_in_days: e.target.value })}
              />
            </div>
          </div>

          <Button
            className="gap-2"
            onClick={() =>
              saveMut.mutate({
                data: {
                  tenant_id: tenantId,
                  enabled: form.enabled,
                  points_per_currency_unit: form.points_per_currency_unit,
                  currency_unit_cents: form.currency_unit_cents,
                  points_to_currency_unit: form.points_to_currency_unit,
                  reward_currency_unit_cents: form.reward_currency_unit_cents,
                  min_redeem_points: form.min_redeem_points,
                  expires_in_days: form.expires_in_days ? parseInt(form.expires_in_days) : null,
                },
              })
            }
            disabled={saveMut.isPending}
          >
            <Save className="w-4 h-4" /> Salvar regras
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulação</CardTitle>
          <CardDescription>Veja quantos pontos o cliente ganharia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Cliente gasta (R$)</Label>
            <Input type="number" value={simInput} onChange={(e) => setSimInput(e.target.value)} />
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg flex items-center gap-3">
            <Star className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-xs text-emerald-700 font-bold uppercase">Ganha</p>
              <p className="text-2xl font-bold text-emerald-700">{simPoints} pontos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
