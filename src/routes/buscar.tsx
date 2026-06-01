import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MapPin, Star, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { searchTenants } from "@/lib/functions/marketplace.functions";

export const Route = createFileRoute("/buscar")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Buscar salões e barbearias — Agendaki" },
      { name: "description", content: "Encontre salões, barbearias e clínicas de estética próximos a você. Agende online em segundos." },
    ],
  }),
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [submitted, setSubmitted] = useState({ q: "", city: "", state: "", page: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ["search-tenants", submitted],
    queryFn: () => searchTenants({ data: submitted }),
    enabled: !!(submitted.q || submitted.city || submitted.state),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 md:px-8 py-4">
        <Link to="/" className="font-bold text-lg text-primary">Agendaki</Link>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Encontre seu salão</h1>
          <p className="text-muted-foreground text-sm">Busque por nome, cidade ou estado.</p>
        </div>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Nome do salão" value={q} onChange={e => setQ(e.target.value)} />
            <Input placeholder="Cidade" value={city} onChange={e => setCity(e.target.value)} />
            <Input placeholder="UF" maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())} />
            <Button onClick={() => setSubmitted({ q, city, state, page: 0 })}>
              <Search className="w-4 h-4 mr-2" /> Buscar
            </Button>
          </CardContent>
        </Card>

        {isLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}

        {data && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{data.totalCount} salão(ões) encontrado(s)</p>
            {data.results.map((t: any) => (
              <Link key={t.id} to="/$slug" params={{ slug: t.slug }} className="block">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {t.logo_url ? <img src={t.logo_url} alt="" className="w-full h-full object-cover rounded-full" /> : t.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{t.name}</h3>
                      {t.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {t.city}{t.state ? `, ${t.state}` : ""}
                        </p>
                      )}
                      {t.review_count > 0 && (
                        <p className="text-xs flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {t.avg_rating} ({t.review_count})
                        </p>
                      )}
                      {t.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{t.description}</p>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {data.hasMore && (
              <div className="text-center pt-2">
                <Button variant="outline" onClick={() => setSubmitted(s => ({ ...s, page: s.page + 1 }))}>
                  Ver mais
                </Button>
              </div>
            )}
            {data.results.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum salão encontrado.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
