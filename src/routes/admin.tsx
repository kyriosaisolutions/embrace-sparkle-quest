import { createFileRoute, redirect } from "@tanstack/react-router";
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
  Check
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

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    // Admin auth placeholder
    const isAdmin = true;
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: AdminAgendaPage,
});

const ADMIN_PROFESSIONALS = [
  { id: "p1", name: "Ricardo Silva", role: "Master", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
  { id: "p2", name: "Felipe Oliveira", role: "Barba", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
  { id: "p3", name: "Maria Clara", role: "Coloração", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
];

const MOCK_AGENDA = [
  { id: "1", professional_id: "p1", client: "João Silva", service: "Corte Masculino", time: "09:00", duration: 45, status: "confirmed" },
  { id: "2", professional_id: "p1", client: "Pedro Alves", service: "Barba", time: "10:30", duration: 30, status: "in_progress" },
  { id: "3", professional_id: "p2", client: "Lucas Lima", service: "Corte + Barba", time: "09:30", duration: 75, status: "scheduled" },
  { id: "4", professional_id: "p2", client: "Block", service: "Intervalo Almoço", time: "12:00", duration: 60, status: "blocked" },
  { id: "5", professional_id: "p3", client: "Mariana C.", service: "Luzes", time: "14:00", duration: 120, status: "confirmed" },
];

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
  const [activeTab, setActiveTab] = useState<"agenda" | "settings" | "services" | "team">("agenda");
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOffline, setIsOffline] = useState(false);
  const [agendaData, setAgendaData] = useState(MOCK_AGENDA);

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

  const categories = ["Corte", "Barba", "Tratamento", "Coloração"];
  const [services, setServices] = useState([
    { id: "s1", name: "Corte Masculino", category: "Corte", price: 45, duration: 45, deposit: 0 },
    { id: "s2", name: "Barba Tradicional", category: "Barba", price: 35, duration: 30, deposit: 0 },
  ]);

  const [team, setTeam] = useState(ADMIN_PROFESSIONALS);

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
    setAgendaData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    toast.success(`Status atualizado para ${newStatus}`);
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
          <Button variant="ghost" onClick={() => setActiveTab("services")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "services" && "bg-white/10 text-white")}><Package className="w-5 h-5" /><span className="hidden lg:block">Serviços</span></Button>
          <Button variant="ghost" onClick={() => setActiveTab("team")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "team" && "bg-white/10 text-white")}><Users className="w-5 h-5" /><span className="hidden lg:block">Equipe</span></Button>
          <Button variant="ghost" onClick={() => setActiveTab("settings")} className={cn("w-full justify-start gap-3 hover:bg-white/5", activeTab === "settings" && "bg-white/10 text-white")}><Settings className="w-5 h-5" /><span className="hidden lg:block">Configurações</span></Button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarImage src="https://github.com/shadcn.png" /></Avatar>
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-white">João Admin</p>
              <p className="text-[10px] text-slate-500 uppercase">Dono do Salão</p>
            </div>
          </div>
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
                {ADMIN_PROFESSIONALS.map(pro => (
                  <div key={pro.id} className="flex-1 min-w-[280px] p-4 flex items-center gap-3 border-r">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10"><AvatarImage src={pro.photo} /><AvatarFallback>{pro.name[0]}</AvatarFallback></Avatar>
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

                  {ADMIN_PROFESSIONALS.map(pro => (
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
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>CEP</Label><Input placeholder="00000-000" /></div>
                          <div className="space-y-2 flex items-end"><Button variant="outline" className="w-full">Buscar Endereço</Button></div>
                        </div>
                        <div className="space-y-2"><Label>Endereço Completo</Label><Input placeholder="Rua, Número, Bairro" /></div>
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
              {services.map(svc => (
                <Card key={svc.id} className="group hover:border-primary/50 transition-all">
                  <CardContent className="p-4 flex items-center gap-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Package className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{svc.name}</h3>
                        <Badge variant="outline" className="text-[10px]">{svc.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{svc.duration} min • R$ {svc.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon"><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="cursor-grab"><MoreHorizontal className="h-4 w-4" /></Button>
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
              {team.map(pro => (
                <Card key={pro.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-4 items-start mb-6">
                      <Avatar className="h-16 w-16"><AvatarImage src={pro.photo} /></Avatar>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{pro.name}</h3>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none">{pro.role}</Badge>
                        <p className="text-xs text-muted-foreground mt-2 italic">Acesso: Profissional</p>
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
                      <div className="bg-slate-50 p-3 rounded-lg"><p className="text-[10px] text-muted-foreground uppercase font-bold">Comissão</p><p className="font-bold">30%</p></div>
                      <div className="bg-slate-50 p-3 rounded-lg"><p className="text-[10px] text-muted-foreground uppercase font-bold">Agendamentos</p><p className="font-bold">124</p></div>
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
