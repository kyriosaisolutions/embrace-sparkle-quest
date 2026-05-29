import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Calendar, 
  Scissors, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  LayoutDashboard,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agendaki - Sistema de Agendamento para Salões e Barbearias" },
      { name: "description", content: "A plataforma completa para gerir sua agenda, equipe e financeiro." },
      { property: "og:title", content: "Agendaki" },
      { property: "og:description", content: "Sistema de Agendamento para Salões e Barbearias" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="h-16 bg-white border-b flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <Calendar className="w-8 h-8" />
            <span>Agendaki</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/admin">Entrar como Admin</Link>
            </Button>
            <Button asChild>
              <Link to="/barbearia-joao">Ver Demo Pública</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-white border-b">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 px-4 py-1">O SaaS definitivo para Salões</Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Sua agenda completa, <span className="text-primary">em um só lugar.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Agendamento online, controle financeiro, comissões automáticas e área do cliente. Tudo o que seu negócio precisa para crescer.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2" asChild>
              <Link to="/admin">Começar Agora <ArrowRight className="w-5 h-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold" asChild>
              <Link to="/barbearia-joao">Ver Exemplo de Salão</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Features */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-8 space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Agendamento 24h</h3>
            <p className="text-muted-foreground">Seus clientes agendam pelo link do seu salão em qualquer horário, sem precisar de você.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-8 space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Gestão de Equipe</h3>
            <p className="text-muted-foreground">Controle agendas individuais, comissões personalizadas e níveis de acesso por profissional.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-8 space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Financeiro Integrado</h3>
            <p className="text-muted-foreground">Pagamento de sinal via PIX, controle de caixa e relatórios de faturamento detalhados.</p>
          </CardContent>
        </Card>
      </section>

      {/* Admin Demo Preview */}
      <section className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl font-bold leading-tight">Potencialize sua gestão com o Painel Admin</h2>
            <ul className="space-y-4">
              {[
                "Visão de agenda estilo calendário",
                "Gestão de comissões por serviço",
                "Log de auditoria financeira",
                "Configuração completa do estabelecimento"
              ].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/admin">Acessar Painel Admin</Link>
            </Button>
          </div>
          <div className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 rounded-lg h-64 flex items-center justify-center">
               <div className="text-center space-y-2 opacity-50">
                 <LayoutDashboard className="w-12 h-12 mx-auto" />
                 <p className="text-xs uppercase tracking-widest font-bold">Dashboard Admin Preview</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t bg-white mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-primary opacity-50">
            <Calendar className="w-5 h-5" />
            <span>Agendaki</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Agendaki SaaS. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full text-xs font-medium", className)}>
      {children}
    </span>
  );
}
