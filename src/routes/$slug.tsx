import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { 
  Star, 
  Instagram, 
  Facebook, 
  MapPin, 
  Phone, 
  Wifi, 
  Car, 
  Accessibility, 
  Clock, 
  CreditCard,
  ChevronRight,
  Heart,
  ChevronLeft,
  Calendar as CalendarIcon,
  User,
  Users,
  CheckCircle2,
  MessageCircle,
  Copy,
  ExternalLink,
  QrCode,
  ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/$slug")({
  component: TenantPublicPage,
});

// Mock data for initial development
const MOCK_TENANT = {
  name: "Barbearia do João",
  slug: "barbearia-joao",
  logo_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=128&h=128&fit=crop",
  rating: 4.8,
  total_reviews: 124,
  description: "A melhor barbearia da cidade, com profissionais qualificados e um ambiente climatizado para seu conforto. Especialistas em cortes modernos e barba tradicional.",
  address: "Rua das Flores, 123 - Centro, São Paulo - SP",
  phone: "(11) 98765-4321",
  opening_hours: [
    { day: "Segunda", hours: "Fechado" },
    { day: "Terça-Sexta", hours: "09:00 - 20:00" },
    { day: "Sábado", hours: "09:00 - 18:00" },
    { day: "Domingo", hours: "Fechado" },
  ],
  working_hours: {
    "1": { open: "09:00", close: "20:00", closed: true },
    "2": { open: "09:00", close: "20:00", closed: false },
    "3": { open: "09:00", close: "20:00", closed: false },
    "4": { open: "09:00", close: "20:00", closed: false },
    "5": { open: "09:00", close: "20:00", closed: false },
    "6": { open: "09:00", close: "18:00", closed: false },
    "0": { open: "00:00", close: "00:00", closed: true }
  },
  socials: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
  },
  facilities: ["Wi-Fi", "Estacionamento", "Acessibilidade"],
  payment_methods: ["Visa", "Mastercard", "PIX", "Dinheiro"],
};

const MOCK_SERVICES = [
  {
    id: "1",
    name: "Corte Masculino",
    price_cents: 4500,
    price_from: false,
    duration_minutes: 45,
    category: "Corte",
    discount_percent: 0,
    deposit_percent: 0,
    image_url: "https://images.unsplash.com/photo-1621605815841-2179b7977491?w=400&h=300&fit=crop",
    featured: true,
  },
  {
    id: "2",
    name: "Barba Tradicional",
    price_cents: 3500,
    price_from: false,
    duration_minutes: 30,
    category: "Barba",
    discount_percent: 10,
    deposit_percent: 0,
    image_url: "https://images.unsplash.com/photo-1599351431247-f132f03af0d6?w=400&h=300&fit=crop",
    featured: true,
  },
  {
    id: "3",
    name: "Combo: Corte + Barba",
    price_cents: 7000,
    price_from: false,
    duration_minutes: 75,
    category: "Tratamento",
    discount_percent: 15,
    deposit_percent: 20,
    image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop",
    featured: true,
  },
  {
    id: "4",
    name: "Luzes Inversas",
    price_cents: 12000,
    price_from: true,
    duration_minutes: 120,
    category: "Coloração",
    discount_percent: 0,
    deposit_percent: 0,
    image_url: "https://images.unsplash.com/photo-1560869713-7d0a294308ed?w=400&h=300&fit=crop",
    featured: false,
  },
  {
    id: "5",
    name: "Hidratação Capilar",
    price_cents: 5000,
    price_from: false,
    duration_minutes: 40,
    category: "Tratamento",
    discount_percent: 0,
    deposit_percent: 0,
    image_url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop",
    featured: false,
  },
];

const MOCK_PROFESSIONALS = [
  {
    id: "d1a3e5b7-4c1d-4f1e-8a5b-9c8d7e6f5a4b",
    name: "Ricardo Silva",
    role: "Barbeiro Master",
    photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    recommendations_count: 45,
    services: ["Corte Masculino", "Barba Tradicional", "Combo: Corte + Barba"]
  },
  {
    id: "e2b4f6c8-5d2e-5a2f-9b6c-0d9e8f7a6b5c",
    name: "Felipe Oliveira",
    role: "Especialista em Barba",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    recommendations_count: 28,
    services: ["Barba Tradicional", "Combo: Corte + Barba"]
  }
];

const MOCK_REVIEWS = [
  {
    id: "r1",
    client_name: "Mariana Costa",
    rating: 5,
    comment: "Excelente atendimento! O Ricardo é um profissional incrível, muito detalhista.",
    created_at: "há 2 dias"
  },
  {
    id: "r2",
    client_name: "Pedro Santos",
    rating: 4,
    comment: "Gostei bastante do corte, ambiente muito agradável.",
    created_at: "há 1 semana"
  }
];

function TenantPublicPage() {
  const { slug } = Route.useParams();
  const [isLoggedIn] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedService, setSelectedService] = useState<typeof MOCK_SERVICES[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | "no_preference">("no_preference");
  
  // Auth & Payment states
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pixTimeLeft, setPixTimeLeft] = useState(600); // 10 minutes
  const [isPixConfirmed, setIsPixConfirmed] = useState(false);
  const [protocol, setProtocol] = useState("");

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const categories = Array.from(new Set(MOCK_SERVICES.map(s => s.category)));
  const featuredServices = MOCK_SERVICES.filter(s => s.featured);
  const professionals = MOCK_PROFESSIONALS.sort((a, b) => b.recommendations_count - a.recommendations_count);

  const nextBookingDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    const config = (MOCK_TENANT.working_hours as any)[dayOfWeek.toString()];
    if (!config || config.closed) return [];
    const times = [];
    const [startH, startM] = config.open.split(":").map(Number);
    const [endH, endM] = config.close.split(":").map(Number);
    const current = new Date(selectedDate);
    current.setHours(startH, startM, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(endH, endM, 0, 0);
    const now = new Date();
    while (current < end) {
      const timeStr = current.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      if (current >= now) times.push(timeStr);
      current.setMinutes(current.getMinutes() + 30);
    }
    return times;
  }, [selectedDate]);

  const handleOpenBooking = (service?: typeof MOCK_SERVICES[0]) => {
    if (service) {
      setSelectedService(service);
      setBookingStep(2);
    } else {
      setSelectedService(null);
      setBookingStep(1);
    }
    setIsBookingOpen(true);
  };

  const resetBooking = () => {
    setBookingStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedProfessional("no_preference");
    setPhone("");
    setName("");
    setOtp("");
    setIsOtpSent(false);
  };

  const handleSendOtp = () => {
    if (!phone || !name) return;
    setIsOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      if (selectedService?.deposit_percent && selectedService.deposit_percent > 0) {
        setBookingStep(5);
      } else {
        handleConfirmBooking();
      }
    }
  };

  const handleConfirmBooking = () => {
    // Generate a random protocol for mock
    const newProtocol = Math.random().toString(36).substring(2, 10).toUpperCase();
    setProtocol(newProtocol);
    setBookingStep(6);
  };

  useEffect(() => {
    let timer: any;
    if (bookingStep === 5 && paymentMethod === "pix" && pixTimeLeft > 0 && !isPixConfirmed) {
      timer = setInterval(() => {
        setPixTimeLeft((prev) => prev - 1);
      }, 1000);
      
      // Mock automatic confirmation after 15 seconds
      if (pixTimeLeft === 585) {
        setTimeout(() => {
          setIsPixConfirmed(true);
          toast.success("Pagamento PIX confirmado!");
          setTimeout(() => handleConfirmBooking(), 1500);
        }, 500);
      }
    }
    return () => clearInterval(timer);
  }, [bookingStep, paymentMethod, pixTimeLeft, isPixConfirmed]);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="relative bg-primary text-primary-foreground py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <img src={MOCK_TENANT.logo_url} alt={MOCK_TENANT.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover" />
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{MOCK_TENANT.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <div className="flex items-center text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="ml-1 font-bold text-white">{MOCK_TENANT.rating}</span>
              </div>
              <span className="text-primary-foreground/80">({MOCK_TENANT.total_reviews} avaliações)</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
              <a href={MOCK_TENANT.socials.instagram} target="_blank" rel="noreferrer"><Instagram className="w-6 h-6" /></a>
              <a href={MOCK_TENANT.socials.facebook} target="_blank" rel="noreferrer"><Facebook className="w-6 h-6" /></a>
            </div>
          </div>
          <div className="hidden md:block">
            <Button size="lg" variant="secondary" className="font-bold text-lg px-8" onClick={() => handleOpenBooking()}>Agendar Agora</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-12">
          {isLoggedIn && (
            <div className="bg-accent/10 border border-accent rounded-lg p-4 flex items-center justify-between">
              <div><p className="font-semibold">Bem-vindo de volta!</p><p className="text-sm text-muted-foreground">Quer repetir seu último serviço?</p></div>
              <Button variant="outline" size="sm">Repetir Último</Button>
            </div>
          )}

          <section>
            <h2 className="text-2xl font-bold mb-6">Mais Agendados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredServices.map(service => (
                <Card key={service.id} className="overflow-hidden">
                  <img src={service.image_url} alt={service.name} className="w-full h-40 object-cover" />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{service.name}</h3>
                      {service.discount_percent > 0 && <Badge variant="destructive">-{service.discount_percent}%</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm flex items-center mt-1"><Clock className="w-4 h-4 mr-1" /> {service.duration_minutes} min</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">{service.price_from && <span className="text-xs font-normal mr-1">A partir de</span>}{formatPrice(service.price_cents)}</span>
                      <Button size="sm" onClick={() => handleOpenBooking(service)}>Agendar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Reviews Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6">O que dizem nossos clientes</h2>
            <div className="space-y-4">
              {MOCK_REVIEWS.map(review => (
                <div key={review.id} className="bg-card border rounded-xl p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{review.client_name}</p>
                      <div className="flex gap-0.5 text-yellow-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-current" : "text-muted")} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{review.created_at}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed italic">"{review.comment}"</p>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-primary font-bold">Ver todas as avaliações</Button>
            </div>
          </section>

          {professionals.length > 1 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Nossa Equipe</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {professionals.map(pro => (
                  <Card key={pro.id}><CardContent className="p-6"><div className="flex gap-4"><Avatar className="w-16 h-16"><AvatarImage src={pro.photo_url} /><AvatarFallback>{pro.name[0]}</AvatarFallback></Avatar>
                  <div className="flex-1"><div className="flex justify-between"><h3>{pro.name}</h3><div className="flex items-center text-rose-500 text-sm"><Heart className="w-4 h-4 mr-1 fill-current" />{pro.recommendations_count}</div></div><p className="text-primary text-sm">{pro.role}</p></div></div><Button className="w-full mt-6" variant="outline" size="sm">Ver disponibilidades</Button></CardContent></Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold mb-6">Todos os Serviços</h2>
            <div className="space-y-8">
              {categories.map(category => (
                <div key={category}><h3 className="text-lg font-bold border-b pb-2 mb-4">{category}</h3><div className="space-y-4">
                  {MOCK_SERVICES.filter(s => s.category === category).map(service => (
                    <div key={service.id} onClick={() => handleOpenBooking(service)} className="flex items-center justify-between p-4 bg-card rounded-lg border cursor-pointer hover:border-primary">
                      <div className="flex-1"><h4 className="font-bold">{service.name}</h4><div className="flex items-center gap-3 text-sm text-muted-foreground"><span>{service.duration_minutes} min</span><span>•</span><span className="font-semibold text-foreground">{formatPrice(service.price_cents)}</span></div></div><Button variant="ghost" size="icon"><ChevronRight /></Button></div>
                  ))}
                </div></div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section><h3 className="font-bold text-xl mb-3">Sobre nós</h3><p className="text-muted-foreground leading-relaxed">{MOCK_TENANT.description}</p></section>
          <section className="bg-muted/50 p-6 rounded-xl"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Horários</h3><ul className="space-y-2">{MOCK_TENANT.opening_hours.map((item, idx) => (<li key={idx} className="flex justify-between text-sm"><span>{item.day}</span><span className="text-muted-foreground">{item.hours}</span></li>))}</ul></section>
          <section className="space-y-4"><div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-primary mt-1" /><div><p className="font-bold">Endereço</p><p className="text-sm text-muted-foreground">{MOCK_TENANT.address}</p></div></div><div className="flex items-center gap-3"><Phone className="w-5 h-5 text-primary" /><div><p className="font-bold">Telefone</p><p className="text-sm text-muted-foreground">{MOCK_TENANT.phone}</p></div></div></section>
          <div className="grid grid-cols-2 gap-4"><section><h3 className="font-bold text-sm mb-3">Pagamento</h3><div className="flex gap-2"><CreditCard /><Badge variant="secondary">PIX</Badge></div></section><section><h3 className="font-bold text-sm mb-3">Facilidades</h3><div className="flex gap-3"><Wifi /><Car /><Accessibility /></div></section></div>
        </aside>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden z-50">
        <Button className="w-full h-12 font-bold text-lg" onClick={() => handleOpenBooking()}>Agendar Agora</Button>
      </div>

      <Dialog open={isBookingOpen} onOpenChange={(open) => { setIsBookingOpen(open); if (!open) resetBooking(); }}>
        <DialogContent className="sm:max-w-[450px] p-0 gap-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              {bookingStep > 1 && <Button variant="ghost" size="icon" onClick={() => setBookingStep(prev => prev - 1)}><ChevronLeft /></Button>}
              <DialogTitle>
                {bookingStep === 1 && "Selecione o serviço"}
                {bookingStep === 2 && "Data e horário"}
                {bookingStep === 3 && "Profissional"}
                {bookingStep === 4 && "Identificação"}
                {bookingStep === 5 && "Pagamento do sinal"}
                {bookingStep === 6 && "Agendamento Confirmado"}
              </DialogTitle>
            </div>
          </DialogHeader>

          {selectedService && (
            <div className="bg-primary/5 p-3 px-4 border-b flex justify-between text-sm">
              <span className="font-semibold text-primary">{selectedService.name}</span>
              <span className="text-muted-foreground">{formatPrice(selectedService.price_cents)} • {selectedService.duration_minutes} min</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {bookingStep === 1 && (
              <div className="p-4 space-y-3">
                {MOCK_SERVICES.map(service => (
                  <div key={service.id} onClick={() => { setSelectedService(service); setBookingStep(2); }} className={cn("p-4 border rounded-lg cursor-pointer hover:border-primary", selectedService?.id === service.id && "border-primary bg-primary/5")}>
                    <h4 className="font-bold">{service.name}</h4><p className="text-xs text-muted-foreground">{service.duration_minutes} min • {formatPrice(service.price_cents)}</p>
                  </div>
                ))}
              </div>
            )}

            {bookingStep === 2 && (
              <div className="p-4 flex flex-col gap-6">
                <div>
                  <p className="text-sm font-semibold mb-3">Próximas datas</p>
                  <ScrollArea className="w-full whitespace-nowrap"><div className="flex gap-2 pb-2">
                    {nextBookingDays.map((date, idx) => {
                      const isClosed = (MOCK_TENANT.working_hours as any)[date.getDay().toString()].closed;
                      return <button key={idx} disabled={isClosed} onClick={() => { setSelectedDate(date); setSelectedTime(null); }} className={cn("flex flex-col items-center justify-center min-w-[60px] h-[72px] rounded-lg border", isClosed && "opacity-30", selectedDate?.toDateString() === date.toDateString() && "border-primary bg-primary text-primary-foreground")}>
                        <span className="text-[10px] uppercase">{date.toLocaleDateString("pt-BR", { weekday: "short" })}</span>
                        <span className="text-lg font-bold">{date.getDate()}</span>
                      </button>
                    })}
                  </div><ScrollBar orientation="horizontal" /></ScrollArea>
                </div>
                {selectedDate && availableTimes.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimes.map(time => <button key={time} onClick={() => setSelectedTime(time)} className={cn("py-2 rounded-md border text-sm", selectedTime === time ? "bg-orange-500 text-white font-bold" : "hover:border-primary")}>{time}</button>)}
                  </div>
                )}
                {selectedTime && <Button className="w-full h-12 mt-4" onClick={() => setBookingStep(3)}>Continuar</Button>}
              </div>
            )}

            {bookingStep === 3 && (
              <div className="p-4 space-y-4">
                <div onClick={() => setSelectedProfessional("no_preference")} className={cn("p-4 border rounded-lg cursor-pointer flex gap-4 items-center", selectedProfessional === "no_preference" && "border-primary bg-primary/5")}>
                  <Avatar><AvatarFallback><Users /></AvatarFallback></Avatar><div><h4 className="font-bold">Sem preferência</h4><p className="text-xs text-muted-foreground">Automático</p></div>
                </div>
                {professionals.map(pro => (
                  <div key={pro.id} onClick={() => setSelectedProfessional(pro.id)} className={cn("p-4 border rounded-lg cursor-pointer flex gap-4 items-center", selectedProfessional === pro.id && "border-primary bg-primary/5")}>
                    <Avatar><AvatarImage src={pro.photo_url} /></Avatar><div><h4 className="font-bold">{pro.name}</h4><p className="text-xs text-primary">{pro.role}</p></div>
                  </div>
                ))}
                <Button className="w-full h-12" onClick={() => setBookingStep(4)}>Continuar</Button>
              </div>
            )}

            {bookingStep === 4 && (
              <div className="p-6 space-y-6">
                <div className="text-center"><h3 className="text-xl font-bold">Identificação</h3></div>
                {!isOtpSent ? (
                  <div className="space-y-4">
                    <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                    <div><Label>WhatsApp</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSendOtp}><MessageCircle className="mr-2" /> Enviar código</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div><Label>Código</Label><Input maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="text-center text-2xl tracking-[0.5em]" /></div>
                    <Button className="w-full" onClick={handleVerifyOtp}>Confirmar</Button>
                  </div>
                )}
              </div>
            )}

            {bookingStep === 5 && selectedService && (
              <div className="p-6 space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-wider">Resumo do agendamento</h3>
                  <div className="space-y-1">
                    <p className="font-bold">{selectedService.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {selectedTime}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> {selectedProfessional === "no_preference" ? "Sem preferência" : professionals.find(p => p.id === selectedProfessional)?.name}
                    </p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-sm font-medium">Total</span>
                    <span className="font-bold text-lg">{formatPrice(selectedService.price_cents)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-tight">Você paga agora (Sinal de {selectedService.deposit_percent}%)</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice((selectedService.price_cents * (selectedService.deposit_percent || 0)) / 100)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">Restante no salão</p>
                      <p className="font-bold">{formatPrice(selectedService.price_cents - (selectedService.price_cents * (selectedService.deposit_percent || 0)) / 100)}</p>
                    </div>
                  </div>

                  <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-2 gap-3">
                    <div>
                      <RadioGroupItem value="pix" id="pix" className="sr-only" />
                      <Label htmlFor="pix" className={cn(
                        "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all gap-2",
                        paymentMethod === "pix" ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      )}>
                        <QrCode className="h-6 w-6" />
                        <span className="font-bold">PIX</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="card" id="card" className="sr-only" />
                      <Label htmlFor="card" className={cn(
                        "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all gap-2",
                        paymentMethod === "card" ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      )}>
                        <CreditCard className="h-6 w-6" />
                        <span className="font-bold">Cartão</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "pix" && (
                    <div className="flex flex-col items-center text-center space-y-4 pt-2">
                      <div className="bg-white p-4 border rounded-xl">
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020126330014br.gov.bcb.pix0111123456789015204000053039865802BR5913BarbeariaJoao6009SaoPaulo62070503***6304" 
                          alt="QR Code PIX Mock" 
                          className={cn("w-40 h-40", isPixConfirmed && "opacity-20")}
                        />
                      </div>
                      {!isPixConfirmed ? (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-orange-600 flex items-center justify-center gap-2">
                              <Clock className="h-4 w-4" /> Expira em {formatTimeLeft(pixTimeLeft)}
                            </p>
                            <p className="text-xs text-muted-foreground">Aguardando confirmação do pagamento...</p>
                          </div>
                          <Button variant="outline" className="w-full flex gap-2" onClick={() => toast.success("Código Copiado!")}>
                            <Copy className="h-4 w-4" /> Copiar código PIX
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8" />
                          </div>
                          <p className="font-bold text-green-600">Pagamento confirmado!</p>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="bg-muted p-8 rounded-lg text-center space-y-3">
                      <CreditCard className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground italic">Integração com gateway de cartão disponível na versão pro.</p>
                      <Button className="w-full" onClick={handleConfirmBooking}>Pagar agora</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {bookingStep === 6 && (
              <div className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Agendamento Confirmado!</h3>
                  <p className="text-muted-foreground">Você receberá todos os detalhes e o lembrete no seu WhatsApp.</p>
                </div>
                <div className="bg-muted p-4 rounded-lg w-full">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Protocolo</p>
                  <p className="text-xl font-mono font-bold">#{protocol}</p>
                </div>
                <div className="w-full space-y-3">
                  <Button className="w-full h-12">Ver meus agendamentos</Button>
                  <Button variant="ghost" className="w-full" onClick={() => setIsBookingOpen(false)}>Fechar</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
