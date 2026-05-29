import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  RotateCcw,
  XCircle,
  ExternalLink,
  History,
  Store,
  Star,
  Heart,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const Route = createFileRoute("/minha-area")({
  beforeLoad: async () => {
    // Placeholder for auth check - will implement real check once auth is wired up
    const isAuthenticated = true; 
    if (!isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: MyAreaPage,
});

const MOCK_MY_APPOINTMENTS = [
  {
    id: "ap1",
    tenant: { name: "Barbearia do João", slug: "barbearia-joao", logo_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=64&h=64&fit=crop" },
    service: { name: "Corte Masculino", price_cents: 4500 },
    professional: { name: "Ricardo Silva" },
    starts_at: new Date(Date.now() + 86400000 * 2), // Tomorrow + 1
    status: "confirmed",
    protocol: "XJ82K19S"
  },
  {
    id: "ap2",
    tenant: { name: "Studio Beauty", slug: "studio-beauty", logo_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=64&h=64&fit=crop" },
    service: { name: "Coloração", price_cents: 18000 },
    professional: { name: "Maria Clara" },
    starts_at: new Date(Date.now() + 3600000 * 5), // Today + 5h
    status: "pending_payment",
    protocol: "LP92J10P"
  }
];

const MOCK_HISTORY = [
  {
    id: "h1",
    tenant: { name: "Barbearia do João", slug: "barbearia-joao" },
    service: { name: "Barba Tradicional", price_cents: 3500 },
    professional: { name: "Felipe Oliveira", id: "p2" },
    starts_at: new Date(Date.now() - 86400000 * 2),
    status: "completed",
    has_review: false
  },
  {
    id: "h2",
    tenant: { name: "Barbearia do João", slug: "barbearia-joao" },
    service: { name: "Corte Masculino", price_cents: 4500 },
    professional: { name: "Ricardo Silva", id: "p1" },
    starts_at: new Date(Date.now() - 86400000 * 45),
    status: "completed",
    has_review: true
  }
];

const MOCK_FAVORITE_TENANTS = [
  {
    name: "Barbearia do João",
    slug: "barbearia-joao",
    logo_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=128&h=128&fit=crop",
    last_service: "Corte Masculino",
    last_date: "há 15 dias"
  },
  {
    name: "Studio Beauty",
    slug: "studio-beauty",
    logo_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=128&h=128&fit=crop",
    last_service: "Manicure",
    last_date: "há 2 meses"
  }
];

function MyAreaPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommended, setRecommended] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Confirmado</Badge>;
      case "pending_payment": return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Pendente Pagamento</Badge>;
      case "cancelled": return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Cancelado</Badge>;
      case "completed": return <Badge variant="outline" className="text-blue-600 border-blue-200">Finalizado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Calendar className="w-6 h-6" />
            <span>Agendaki</span>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="hidden sm:block font-medium text-sm">Meu Perfil</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Olá, João!</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus agendamentos e estabelecimentos favoritos.</p>
        </div>

        {/* Next Appointments */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Próximos Agendamentos</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {MOCK_MY_APPOINTMENTS.map(appointment => (
              <Card key={appointment.id} className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-0">
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex gap-4 flex-1">
                      <Avatar className="h-12 w-12 rounded-lg border">
                        <AvatarImage src={appointment.tenant.logo_url} />
                        <AvatarFallback>{appointment.tenant.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{appointment.tenant.name}</h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm font-semibold">{appointment.service.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {appointment.starts_at.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {appointment.starts_at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {appointment.professional.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right space-y-1">
                      <p className="text-lg font-bold text-primary">{formatPrice(appointment.service.price_cents)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Protocolo #{appointment.protocol}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 px-4 sm:px-6 flex flex-wrap gap-2 border-t">
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1"><RotateCcw className="w-3 h-3" /> Reagendar</Button>
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1 text-destructive hover:text-destructive hover:bg-destructive/5"><XCircle className="w-3 h-3" /> Cancelar</Button>
                    <div className="flex-1"></div>
                    <Button size="sm" variant="ghost" className="text-xs h-8 gap-1" asChild>
                      <a href={`/${appointment.tenant.slug}`}><ExternalLink className="w-3 h-3" /> Ver salão</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* History Collapsible */}
        <section>
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="w-full space-y-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-muted-foreground" />
                  <h2 className="font-bold text-lg">Histórico de Agendamentos</h2>
                </div>
                {isHistoryOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {MOCK_HISTORY.map(h => (
                <div key={h.id} className="bg-white border rounded-lg p-4 flex justify-between items-center group hover:border-primary/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{h.tenant.name}</span>
                      <span className="text-[10px] text-muted-foreground">• {h.starts_at.toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{h.service.name} com {h.professional.name}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="h-8 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RotateCcw className="w-3 h-3" /> Repetir
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Favorite Tenants */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Onde Sou Cliente</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_FAVORITE_TENANTS.map(tenant => (
              <Card key={tenant.slug} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex gap-4 items-center">
                  <Avatar className="h-14 w-14 rounded-lg border">
                    <AvatarImage src={tenant.logo_url} />
                    <AvatarFallback>{tenant.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-sm">{tenant.name}</h3>
                    <p className="text-[11px] text-muted-foreground leading-tight">Último: {tenant.last_service}<br/>{tenant.last_date}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-9 w-9 p-0" asChild>
                    <a href={`/${tenant.slug}`}><ChevronRight className="h-5 w-5 text-primary" /></a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
