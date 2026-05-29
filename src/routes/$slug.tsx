import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

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

function TenantPublicPage() {
  const { slug } = Route.useParams();
  const [isLoggedIn] = useState(false); // Placeholder for auth check

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const categories = Array.from(new Set(MOCK_SERVICES.map(s => s.category)));
  const featuredServices = MOCK_SERVICES.filter(s => s.featured);
  const professionals = MOCK_PROFESSIONALS.sort((a, b) => b.recommendations_count - a.recommendations_count);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header / Hero */}
      <header className="relative bg-primary text-primary-foreground py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <img 
            src={MOCK_TENANT.logo_url} 
            alt={MOCK_TENANT.name} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover"
          />
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
              <a href={MOCK_TENANT.socials.instagram} target="_blank" rel="noreferrer">
                <Instagram className="w-6 h-6 hover:text-accent transition-colors" />
              </a>
              <a href={MOCK_TENANT.socials.facebook} target="_blank" rel="noreferrer">
                <Facebook className="w-6 h-6 hover:text-accent transition-colors" />
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            <Button size="lg" variant="secondary" className="font-bold text-lg px-8">
              Agendar Agora
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Catalog Section */}
        <div className="md:col-span-2 space-y-12">
          {isLoggedIn && (
            <div className="bg-accent/10 border border-accent rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Bem-vindo de volta!</p>
                <p className="text-sm text-muted-foreground">Quer repetir seu último serviço?</p>
              </div>
              <Button variant="outline" size="sm">Repetir Último</Button>
            </div>
          )}

          {/* Featured Services */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Mais Agendados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredServices.map(service => (
                <Card key={service.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <img src={service.image_url} alt={service.name} className="w-full h-40 object-cover" />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{service.name}</h3>
                      {service.discount_percent > 0 && (
                        <Badge variant="destructive">-{service.discount_percent}%</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-1" /> {service.duration_minutes} min
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        {service.price_from && <span className="text-xs font-normal text-muted-foreground mr-1">A partir de</span>}
                        {formatPrice(service.price_cents)}
                      </span>
                      <Button size="sm">Agendar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Professionals Section */}
          {professionals.length > 1 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Nossa Equipe</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {professionals.map(pro => (
                  <Card key={pro.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Avatar className="w-16 h-16 border-2 border-primary/10">
                          <AvatarImage src={pro.photo_url} alt={pro.name} className="object-cover" />
                          <AvatarFallback>{pro.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg leading-tight">{pro.name}</h3>
                            <div className="flex items-center text-rose-500 text-sm font-semibold">
                              <Heart className="w-4 h-4 mr-1 fill-current" />
                              {pro.recommendations_count}
                            </div>
                          </div>
                          <p className="text-primary font-medium text-sm">{pro.role}</p>
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Especialidades</p>
                            <div className="flex flex-wrap gap-1">
                              {pro.services.map(svc => (
                                <Badge key={svc} variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {svc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full mt-6" variant="outline" size="sm">
                        Ver disponibilidades
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* All Services by Category */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Todos os Serviços</h2>
            <div className="space-y-8">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-lg font-bold border-b pb-2 mb-4">{category}</h3>
                  <div className="space-y-4">
                    {MOCK_SERVICES.filter(s => s.category === category).map(service => (
                      <div key={service.id} className="flex items-center justify-between p-4 bg-card rounded-lg border hover:border-primary transition-colors cursor-pointer group">
                        <div className="flex-1">
                          <h4 className="font-bold group-hover:text-primary transition-colors">{service.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{service.duration_minutes} min</span>
                            <span>•</span>
                            <span className="font-semibold text-foreground">
                               {service.price_from && <span className="text-xs font-normal text-muted-foreground mr-1">A partir de</span>}
                               {formatPrice(service.price_cents)}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-8">
          {/* Description */}
          <section>
            <h3 className="font-bold text-xl mb-3">Sobre nós</h3>
            <p className="text-muted-foreground leading-relaxed">
              {MOCK_TENANT.description}
            </p>
          </section>

          {/* Opening Hours */}
          <section className="bg-muted/50 p-6 rounded-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Horários
            </h3>
            <ul className="space-y-2">
              {MOCK_TENANT.opening_hours.map((item, idx) => (
                <li key={idx} className="flex justify-between text-sm">
                  <span className="font-medium">{item.day}</span>
                  <span className="text-muted-foreground">{item.hours}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Address & Contact */}
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-bold">Endereço</p>
                <p className="text-sm text-muted-foreground">{MOCK_TENANT.address}</p>
              </div>
            </div>
            {/* Static Google Maps Embed Placeholder */}
            <div className="w-full h-48 bg-muted rounded-lg overflow-hidden border">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                style={{ border: 0 }}
                src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY_HERE&q=São+Paulo+SP" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-bold">Telefone</p>
                <p className="text-sm text-muted-foreground">{MOCK_TENANT.phone}</p>
              </div>
            </div>
          </section>

          {/* Payment & Facilities */}
          <div className="grid grid-cols-2 gap-4">
            <section>
              <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Pagamento</h3>
              <div className="flex flex-wrap gap-2">
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-bold bg-muted px-2 py-1 rounded">PIX</span>
              </div>
            </section>
            <section>
              <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Facilidades</h3>
              <div className="flex flex-wrap gap-3">
                <Wifi className="w-5 h-5" />
                <Car className="w-5 h-5" />
                <Accessibility className="w-5 h-5" />
              </div>
            </section>
          </div>
        </aside>
      </main>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden z-50">
        <Button className="w-full h-12 font-bold text-lg">
          Agendar Agora
        </Button>
      </div>
    </div>
  );
}
