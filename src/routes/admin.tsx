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
  MoreHorizontal
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
        {/* Top Header */}
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
            {/* Hour marker corner */}
            <div className="w-16 shrink-0 bg-slate-50 border-r" />
            
            {/* Professional Column Headers */}
            {ADMIN_PROFESSIONALS.map(pro => (
              <div key={pro.id} className="flex-1 min-w-[280px] p-4 flex items-center gap-3 border-r">
                <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                  <AvatarImage src={pro.photo} />
                  <AvatarFallback>{pro.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{pro.name}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{pro.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 relative">
            <div className="flex h-full">
              {/* Timeline Hours */}
              <div className="w-16 shrink-0 bg-slate-50 border-r flex flex-col">
                {timeSlots.map(time => (
                  <div key={time} className="h-24 border-b p-2 text-[10px] font-bold text-slate-400 text-center">
                    {time}
                  </div>
                ))}
              </div>

              {/* Grid Columns */}
              {ADMIN_PROFESSIONALS.map(pro => (
                <div key={pro.id} className="flex-1 min-w-[280px] border-r relative group">
                  {/* Grid Lines */}
                  {timeSlots.map(time => (
                    <div key={time} className="h-24 border-b border-slate-100 group-hover:bg-slate-50/50 transition-colors" />
                  ))}

                  {/* Appointment Cards */}
                  {agendaData.filter(item => item.professional_id === pro.id).map(apt => {
                    const [h, m] = apt.time.split(":").map(Number);
                    const top = ((h - 9) * 2 + (m === 30 ? 1 : 0)) * 96; // 96px per hour (48px per 30min)
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
                          <div>
                            <p className="font-bold text-xs truncate">{apt.client}</p>
                            <p className="text-[10px] opacity-90 truncate">{apt.service}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100"><MoreVertical className="w-3 h-3" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => handleStatusChange(apt.id, "confirmed")}>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Confirmar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => handleStatusChange(apt.id, "in_progress")}>
                                <Clock className="w-4 h-4 text-orange-500" /> Iniciar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => handleStatusChange(apt.id, "completed")}>
                                <CheckCircle2 className="w-4 h-4 text-slate-500" /> Finalizar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-rose-600" onClick={() => handleStatusChange(apt.id, "cancelled")}>
                                <XCircle className="w-4 h-4" /> Cancelar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-rose-600" onClick={() => handleStatusChange(apt.id, "no_show")}>
                                <AlertCircle className="w-4 h-4" /> No-show
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="absolute bottom-2 left-3 flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-60" />
                          <span className="text-[10px] font-bold opacity-60">{apt.time} ({apt.duration}min)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
