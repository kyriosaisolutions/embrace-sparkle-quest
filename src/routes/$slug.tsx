import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
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
  QrCode,
  Loader2
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
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getTenantBySlug, getTenantReviews } from "@/server/functions/tenants";
import { createAppointment } from "@/server/functions/appointments";

export const Route = createFileRoute("/$slug")({
  component: TenantPublicPage,
});

function TenantPublicPage() {
  const { slug } = Route.useParams();
  
  const { data: tenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => getTenantBySlug({ data: slug }),
  });

  const [reviewPage, setReviewPage] = useState(0);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState({ totalCount: 0, avgRating: 0, hasMore: false });

  const { data: reviewsResult, isFetching: isLoadingReviews } = useQuery({
    queryKey: ["reviews", tenant?.id, reviewPage],
    queryFn: () => getTenantReviews({ data: { tenantId: tenant!.id, page: reviewPage } }),
    enabled: !!tenant?.id,
  });

  useEffect(() => {
    if (!reviewsResult) return;
    setAllReviews(prev =>
      reviewPage === 0
        ? reviewsResult.reviews
        : [...prev, ...reviewsResult.reviews.filter(r => !prev.some((p: any) => p.id === r.id))]
    );
    setReviewsMeta({ totalCount: reviewsResult.totalCount, avgRating: reviewsResult.avgRating, hasMore: reviewsResult.hasMore });
  }, [reviewsResult]);

  const [isLoggedIn] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | "no_preference">("no_preference");
  
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pixTimeLeft, setPixTimeLeft] = useState(600);
  const [isPixConfirmed, setIsPixConfirmed] = useState(false);
  const [protocol, setProtocol] = useState("");

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const categories = useMemo(() => {
    if (!tenant?.services) return [];
    return Array.from(new Set(tenant.services.map((s: any) => s.category)));
  }, [tenant]);

  const featuredServices = useMemo(() => {
    if (!tenant?.services) return [];
    return tenant.services.slice(0, 3);
  }, [tenant]);

  const professionals = useMemo(() => {
    if (!tenant?.professionals) return [];
    return [...tenant.professionals].sort((a: any, b: any) => 
      (b.recommendations_count || 0) - (a.recommendations_count || 0)
    );
  }, [tenant]);

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
    if (!selectedDate || !tenant?.working_hours) return [];
    const dayOfWeek = selectedDate.getDay();
    const config = (tenant.working_hours as any)[dayOfWeek.toString()];
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
  }, [selectedDate, tenant]);

  const handleOpenBooking = (service?: any) => {
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
    setIsCreatingAppointment(false);
  };

  const handleSendOtp = () => {
    if (!phone || !name) return;
    setIsOtpSent(true);
  };

  const handleVerifyOtp = async () => {
    if (otp.length === 6) {
      if (selectedService?.deposit_percent && selectedService.deposit_percent > 0) {
        setBookingStep(5);
      } else {
        await handleConfirmBooking();
      }
    }
  };

  const handleConfirmBooking = async () => {
    if (!tenant || !selectedService || !selectedDate || !selectedTime) return;
    
    setIsCreatingAppointment(true);
    try {
      const startsAt = new Date(selectedDate);
      const [h, m] = selectedTime.split(":").map(Number);
      startsAt.setHours(h, m, 0, 0);
      
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + selectedService.duration_minutes);

      const apt = await createAppointment({
        data: {
          tenant_id: tenant.id,
          professional_id: selectedProfessional === "no_preference" ? professionals[0].id : selectedProfessional,
          service_id: selectedService.id,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          total_cents: selectedService.price_cents,
          payment_method: paymentMethod,
          client_data: { name, phone }
        }
      });
      
      setProtocol(apt.protocol);
      setBookingStep(6);
    } catch (error) {
      toast.error("Erro ao realizar agendamento.");
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (bookingStep === 5 && paymentMethod === "pix" && pixTimeLeft > 0 && !isPixConfirmed) {
      timer = setInterval(() => {
        setPixTimeLeft((prev) => prev - 1);
      }, 1000);
      
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

  if (isLoadingTenant) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!tenant) {
    return <div className="min-h-screen flex items-center justify-center text-center p-4"><div><h1 className="text-2xl font-bold">Salão não encontrado</h1><p className="text-muted-foreground mt-2">Verifique se a URL está correta.</p></div></div>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: tenant.name,
    image: tenant.logo_url || undefined,
    description: tenant.description || undefined,
    telephone: tenant.phone || undefined,
    address: tenant.address ? {
      "@type": "PostalAddress",
      streetAddress: tenant.address,
      addressLocality: tenant.city,
      addressRegion: tenant.state,
      postalCode: tenant.zip_code,
      addressCountry: "BR",
    } : undefined,
    aggregateRating: reviewsMeta.totalCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: reviewsMeta.avgRating,
      reviewCount: reviewsMeta.totalCount,
    } : undefined,
    makesOffer: (tenant.services || []).map((s: any) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name },
      price: ((s.price_cents ?? 0) / 100).toFixed(2),
      priceCurrency: "BRL",
    })),
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="relative bg-primary text-primary-foreground py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <img src={tenant.logo_url} alt={tenant.name} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover" />
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{tenant.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <div className="flex items-center text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="ml-1 font-bold text-white">
                  {reviewsMeta.avgRating > 0 ? reviewsMeta.avgRating.toFixed(1) : "–"}
                </span>
              </div>
              <span className="text-primary-foreground/80">
                ({reviewsMeta.totalCount} {reviewsMeta.totalCount === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
              {tenant.social_instagram && <a href={tenant.social_instagram} target="_blank" rel="noreferrer"><Instagram className="w-6 h-6" /></a>}
              {tenant.social_facebook && <a href={tenant.social_facebook} target="_blank" rel="noreferrer"><Facebook className="w-6 h-6" /></a>}
            </div>
          </div>
          <div className="hidden md:block">
            <Button size="lg" variant="secondary" className="font-bold text-lg px-8" onClick={() => handleOpenBooking()}>Agendar Agora</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6">Mais Agendados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredServices.map((service: any) => (
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

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">O que dizem nossos clientes</h2>
              {reviewsMeta.totalCount > 0 && (
                <span className="text-sm text-muted-foreground">{reviewsMeta.totalCount} avaliações</span>
              )}
            </div>
            {allReviews.length === 0 && !isLoadingReviews && (
              <p className="text-muted-foreground text-sm">Nenhuma avaliação ainda.</p>
            )}
            <div className="space-y-4">
              {allReviews.map((review: any) => (
                <div key={review.id} className="bg-card border rounded-xl p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{review.clients?.name ?? "Cliente"}</p>
                      <div className="flex gap-0.5 text-yellow-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-current" : "text-muted")} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {review.comment && <p className="text-muted-foreground text-sm leading-relaxed italic">"{review.comment}"</p>}
                </div>
              ))}
            </div>
            {reviewsMeta.hasMore && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setReviewPage(p => p + 1)}
                disabled={isLoadingReviews}
              >
                {isLoadingReviews ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Ver mais avaliações
              </Button>
            )}
          </section>

          {professionals.length > 1 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Nossa Equipe</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {professionals.map((pro: any) => (
                  <Card key={pro.id}><CardContent className="p-6"><div className="flex gap-4"><Avatar className="w-16 h-16"><AvatarImage src={pro.photo_url} /><AvatarFallback>{pro.name[0]}</AvatarFallback></Avatar>
                  <div className="flex-1"><div className="flex justify-between"><h3>{pro.name}</h3><div className="flex items-center text-rose-500 text-sm"><Heart className="w-4 h-4 mr-1 fill-current" />{pro.recommendations_count || 0}</div></div><p className="text-primary text-sm">{pro.role}</p></div></div><Button className="w-full mt-6" variant="outline" size="sm" onClick={() => handleOpenBooking()}>Ver disponibilidades</Button></CardContent></Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold mb-6">Todos os Serviços</h2>
            <div className="space-y-8">
              {categories.map((category: any) => (
                <div key={String(category)}><h3 className="text-lg font-bold border-b pb-2 mb-4">{String(category)}</h3><div className="space-y-4">
                  {tenant.services.filter((s: any) => s.category === category).map((service: any) => (
                    <div key={service.id} onClick={() => handleOpenBooking(service)} className="flex items-center justify-between p-4 bg-card rounded-lg border cursor-pointer hover:border-primary">
                      <div className="flex-1"><h4 className="font-bold">{service.name}</h4><div className="flex items-center gap-3 text-sm text-muted-foreground"><span>{service.duration_minutes} min</span><span>•</span><span className="font-semibold text-foreground">{formatPrice(service.price_cents)}</span></div></div><Button variant="ghost" size="icon"><ChevronRight /></Button></div>
                  ))}
                </div></div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section><h3 className="font-bold text-xl mb-3">Sobre nós</h3><p className="text-muted-foreground leading-relaxed">{tenant.description}</p></section>
          <section className="bg-muted/50 p-6 rounded-xl"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Horários</h3><ul className="space-y-2">{tenant.working_hours && Object.entries(tenant.working_hours).map(([day, config]: [string, any]) => {
            const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            return (<li key={day} className="flex justify-between text-sm"><span>{dayNames[parseInt(day)]}</span><span className="text-muted-foreground">{config.closed ? "Fechado" : `${config.open} - ${config.close}`}</span></li>);
          })}</ul></section>
          <section className="space-y-4"><div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-primary mt-1" /><div><p className="font-bold">Endereço</p><p className="text-sm text-muted-foreground">{tenant.address || "Endereço não informado"}</p></div></div><div className="flex items-center gap-3"><Phone className="w-5 h-5 text-primary" /><div><p className="font-bold">Telefone</p><p className="text-sm text-muted-foreground">{tenant.phone || "Não informado"}</p></div></div></section>
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
                {bookingStep === 1 && "Selecione o serviço"}{bookingStep === 2 && "Data e horário"}{bookingStep === 3 && "Profissional"}{bookingStep === 4 && "Identificação"}{bookingStep === 5 && "Pagamento do sinal"}{bookingStep === 6 && "Agendamento Confirmado"}
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
                {tenant.services.map((service: any) => (
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
                      const isClosed = (tenant.working_hours as any)[date.getDay().toString()]?.closed;
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
                {professionals.map((pro: any) => (
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
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {selectedTime}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> {selectedProfessional === "no_preference" ? "Sem preferência" : professionals.find((p: any) => p.id === selectedProfessional)?.name}</p>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center"><span className="text-sm font-medium">Total</span><span className="font-bold text-lg">{formatPrice(selectedService.price_cents)}</span></div>
                </div>

                <div className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex justify-between items-center">
                    <div><p className="text-xs font-bold text-primary uppercase tracking-tight">Pagar agora (Sinal de {selectedService.deposit_percent}%)</p><p className="text-2xl font-bold text-primary">{formatPrice((selectedService.price_cents * (selectedService.deposit_percent || 0)) / 100)}</p></div>
                    <div className="text-right"><p className="text-[10px] text-muted-foreground uppercase">No salão</p><p className="font-bold">{formatPrice(selectedService.price_cents - (selectedService.price_cents * (selectedService.deposit_percent || 0)) / 100)}</p></div>
                  </div>

                  <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-2 gap-3">
                    <div><RadioGroupItem value="pix" id="pix" className="sr-only" /><Label htmlFor="pix" className={cn("flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all gap-2", paymentMethod === "pix" ? "border-primary bg-primary/5" : "hover:border-primary/50")}><QrCode className="h-6 w-6" /><span className="font-bold">PIX</span></Label></div>
                    <div><RadioGroupItem value="card" id="card" className="sr-only" /><Label htmlFor="card" className={cn("flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all gap-2", paymentMethod === "card" ? "border-primary bg-primary/5" : "hover:border-primary/50")}><CreditCard className="h-6 w-6" /><span className="font-bold">Cartão</span></Label></div>
                  </RadioGroup>

                  {paymentMethod === "pix" && (
                    <div className="flex flex-col items-center text-center space-y-4 pt-2">
                      <div className="bg-white p-4 border rounded-xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020126330014br.gov.bcb.pix0111123456789015204000053039865802BR5913BarbeariaJoao6009SaoPaulo62070503***6304`} alt="QR Code PIX" className={cn("w-40 h-40", isPixConfirmed && "opacity-20")} /></div>
                      {!isPixConfirmed ? (
                        <><div className="space-y-1"><p className="text-sm font-bold text-orange-600 flex items-center justify-center gap-2"><Clock className="h-4 w-4" /> Expira em {formatTimeLeft(pixTimeLeft)}</p><p className="text-xs text-muted-foreground">Aguardando confirmação...</p></div><Button variant="outline" className="w-full flex gap-2" onClick={() => toast.success("Copiado!")}><Copy className="h-4 w-4" /> Copiar PIX</Button></>
                      ) : (<div className="flex flex-col items-center gap-2 py-4"><div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 className="h-8 w-8" /></div><p className="font-bold text-green-600">Pago!</p></div>)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {bookingStep === 6 && (
              <div className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 className="h-12 w-12" /></div>
                <div className="space-y-2"><h3 className="text-2xl font-bold">Confirmado!</h3><p className="text-muted-foreground">Enviamos os detalhes para seu WhatsApp.</p></div>
                <div className="bg-muted p-4 rounded-lg w-full"><p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Protocolo</p><p className="text-xl font-mono font-bold">#{protocol}</p></div>
                <div className="w-full space-y-3"><Button className="w-full h-12">Meus agendamentos</Button><Button variant="ghost" className="w-full" onClick={() => setIsBookingOpen(false)}>Fechar</Button></div>
              </div>
            )}
          </div>
          {isCreatingAppointment && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[100]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
