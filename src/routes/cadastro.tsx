import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, ArrowRight, ArrowLeft, Loader2, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cadastro")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/admin" });
  },
  component: CadastroPage,
});

const STEPS = ["Conta", "Negócio", "Localização", "Horários", "Primeiro Serviço"];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SERVICE_CATEGORIES = ["Corte", "Barba", "Coloração", "Tratamento", "Estética", "Unhas", "Outro"];

function CadastroPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [business, setBusiness] = useState({ salonName: "", slug: "", phone: "", description: "" });
  const [location, setLocation] = useState({ cep: "", address: "", complement: "", city: "", state: "" });
  const [workingHours, setWorkingHours] = useState<Record<string, any>>({
    "0": { closed: true, open: "09:00", close: "18:00" },
    "1": { closed: false, open: "09:00", close: "18:00" },
    "2": { closed: false, open: "09:00", close: "18:00" },
    "3": { closed: false, open: "09:00", close: "18:00" },
    "4": { closed: false, open: "09:00", close: "18:00" },
    "5": { closed: false, open: "09:00", close: "18:00" },
    "6": { closed: true, open: "09:00", close: "18:00" },
  });
  const [service, setService] = useState({ name: "", category: "Corte", price: "", duration: "30" });

  const fetchCep = async () => {
    const cep = location.cep.replace(/\D/g, "");
    if (cep.length !== 8) { toast.error("CEP deve ter 8 dígitos."); return; }
    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado."); return; }
      setLocation(prev => ({
        ...prev,
        address: `${data.logradouro}${data.bairro ? ", " + data.bairro : ""}`,
        city: data.localidade,
        state: data.uf,
      }));
      toast.success("Endereço preenchido!");
    } catch {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return account.name && account.email && account.password.length >= 6;
    if (step === 2) return business.salonName && business.slug && business.phone;
    if (step === 3) return location.address && location.city && location.state;
    if (step === 4) return true;
    if (step === 5) return service.name && service.price && Number(service.price) > 0;
    return false;
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { full_name: account.name } },
      });
      if (authError) throw authError;

      const fullAddress = [location.address, location.complement, location.city, location.state]
        .filter(Boolean).join(", ");

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: business.salonName,
          slug: business.slug.toLowerCase().replace(/\s+/g, "-"),
          phone: business.phone,
          description: business.description,
          address: fullAddress,
          city: location.city,
          state: location.state,
          zip_code: location.cep,
          working_hours: workingHours,
          payment_methods: ["pix"],
          cancellation_hours: 2,
          slot_interval_minutes: 30,
        } as any)
        .select("id")
        .single();
      if (tenantError) throw tenantError;

      await supabase.from("professionals").insert({
        tenant_id: tenant.id,
        name: account.name,
        access_level: "owner",
        is_active: true,
      } as any);

      await supabase.from("services").insert({
        tenant_id: tenant.id,
        name: service.name,
        category: service.category,
        price: parseFloat(service.price.replace(",", ".")),
        price_cents: Math.round(parseFloat(service.price.replace(",", ".")) * 100),
        duration_minutes: parseInt(service.duration),
        enabled: true,
        sort_order: 0,
      });

      toast.success("Salão criado! Bem-vindo ao Agendaki!");
      navigate({ to: "/admin" });
    } catch (e: any) {
      if (e.message?.includes("already registered")) {
        toast.error("Este e-mail já está cadastrado.");
      } else {
        toast.error(e.message || "Erro ao criar conta.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-2xl text-primary">
            <Calendar className="w-8 h-8" />
            <span>Agendaki</span>
          </div>
          <p className="text-muted-foreground text-sm">Configure seu salão em 5 passos</p>
        </div>

        <div className="flex items-center gap-1">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0",
                i + 1 < step ? "bg-primary text-white" :
                i + 1 === step ? "bg-primary text-white ring-4 ring-primary/20" :
                "bg-slate-200 text-slate-500"
              )}>
                {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-1", i + 1 < step ? "bg-primary" : "bg-slate-200")} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold">Passo {step}: {STEPS[step - 1]}</h2>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome completo</Label>
                  <Input id="name" placeholder="João Silva" value={account.name}
                    onChange={e => setAccount(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="joao@barbearia.com" value={account.email}
                    onChange={e => setAccount(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha (mínimo 6 caracteres)</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={account.password}
                    onChange={e => setAccount(p => ({ ...p, password: e.target.value }))} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do estabelecimento</Label>
                  <Input placeholder="Barbearia do João" value={business.salonName}
                    onChange={e => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                      setBusiness(p => ({ ...p, salonName: name, slug }));
                    }} />
                </div>
                <div className="space-y-2">
                  <Label>Link do seu salão</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm shrink-0">agendaki.com/</span>
                    <Input placeholder="barbearia-joao" value={business.slug}
                      onChange={e => setBusiness(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input placeholder="(11) 99999-9999" value={business.phone}
                    onChange={e => setBusiness(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea placeholder="Barbearia especializada em cortes modernos..." value={business.description}
                    onChange={e => setBusiness(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-2">
                    <Label>CEP</Label>
                    <Input placeholder="00000-000" value={location.cep}
                      onChange={e => setLocation(p => ({ ...p, cep: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && fetchCep()} />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <Button variant="outline" className="w-full" onClick={fetchCep} disabled={isLoadingCep}>
                      {isLoadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input placeholder="Rua, Número, Bairro" value={location.address}
                    onChange={e => setLocation(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Complemento (opcional)</Label>
                  <Input placeholder="Sala 1, 2º andar..." value={location.complement}
                    onChange={e => setLocation(p => ({ ...p, complement: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input placeholder="São Paulo" value={location.city}
                      onChange={e => setLocation(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input placeholder="SP" maxLength={2} value={location.state}
                      onChange={e => setLocation(p => ({ ...p, state: e.target.value.toUpperCase() }))} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Configure os horários de funcionamento.</p>
                {Object.entries(workingHours).map(([dayIdx, config]) => (
                  <div key={dayIdx} className="flex items-center gap-3 p-3 border rounded-lg">
                    <span className="w-8 font-bold text-sm text-slate-600">{DAYS[parseInt(dayIdx)]}</span>
                    <Switch
                      checked={!config.closed}
                      onCheckedChange={open => setWorkingHours(p => ({ ...p, [dayIdx]: { ...p[dayIdx], closed: !open } }))}
                    />
                    {!config.closed ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input type="time" value={config.open} className="h-8 text-sm"
                          onChange={e => setWorkingHours(p => ({ ...p, [dayIdx]: { ...p[dayIdx], open: e.target.value } }))} />
                        <span className="text-muted-foreground text-xs">até</span>
                        <Input type="time" value={config.close} className="h-8 text-sm"
                          onChange={e => setWorkingHours(p => ({ ...p, [dayIdx]: { ...p[dayIdx], close: e.target.value } }))} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground flex-1">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Adicione o primeiro serviço do seu salão.</p>
                <div className="space-y-2">
                  <Label>Nome do serviço</Label>
                  <Input placeholder="Corte Masculino" value={service.name}
                    onChange={e => setService(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={service.category}
                      onChange={e => setService(p => ({ ...p, category: e.target.value }))}>
                      {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duração (minutos)</Label>
                    <Input type="number" min="15" step="15" placeholder="30" value={service.duration}
                      onChange={e => setService(p => ({ ...p, duration: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input placeholder="45,00" value={service.price}
                    onChange={e => setService(p => ({ ...p, price: e.target.value }))} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={isLoading}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!canProceed() || isLoading}
            onClick={() => step < 5 ? setStep(s => s + 1) : handleComplete()}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {step === 5 ? "Criar meu salão" : "Próximo"}
            {step < 5 && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <a href="/admin-login" className="text-primary hover:underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}
