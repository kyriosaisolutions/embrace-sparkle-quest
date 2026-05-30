# Agendaki — PRD Competitivo (vs. Fresha & Trinks)

> Documento de produto para tornar o Agendaki competitivo frente aos líderes de
> mercado: **Fresha** (global) e **Trinks** (Brasil). Objetivo: mapear todo o
> conjunto de funcionalidades dos concorrentes, comparar com o estado atual do
> Agendaki, e definir o backlog priorizado. Mercado-alvo: salões, barbearias,
> clínicas de estética, esmalterias e spas no Brasil.

Última atualização: 2026-05-30

---

## 1. Estado atual do Agendaki

| Área | Implementado |
|------|--------------|
| Página pública do salão (`/$slug`) | ✅ catálogo de serviços, equipe, avaliações com paginação |
| Agendamento online | ✅ fluxo cliente → serviço → profissional → horário |
| Autenticação | ✅ admin (e-mail/senha), cliente (Google OAuth), guards, logout |
| Onboarding (`/cadastro`) | ✅ wizard 5 passos + ViaCEP |
| Área do cliente (`/minha-area`) | ✅ próximos, histórico, cancelamento, "Meus Salões" |
| Avaliações | ✅ janela de 7 dias, paginação, média dinâmica |
| Admin — agenda | ✅ calendário, escopo por papel (owner/profissional) |
| Admin — financeiro | ✅ KPIs reais, comissão por profissional, export CSV |
| Admin — equipe / serviços | ✅ CRUD + upload de imagem (Storage) |
| Controle de acesso | ✅ `access_level` owner/professional |
| Banco | ✅ Supabase + RLS em todas as tabelas |

**Lacunas de alto nível:** pagamentos online, lembretes/WhatsApp, fidelidade,
clube de assinatura, estoque, comanda/POS, marketplace de descoberta, app móvel,
relatórios avançados, NF-e, multi-unidade.

---

## 2. Matriz competitiva (Fresha × Trinks × Agendaki)

Legenda: ✅ tem · 🟡 parcial · ❌ não tem

| Funcionalidade | Fresha | Trinks | Agendaki |
|----------------|:------:|:------:|:--------:|
| Agendamento online 24/7 | ✅ | ✅ | ✅ |
| Página/perfil público do negócio | ✅ | ✅ | ✅ |
| App do cliente (iOS/Android) | ✅ | ✅ | ❌ |
| App do profissional (iOS/Android) | ✅ | ✅ | ❌ |
| Lembretes automáticos (SMS/e-mail) | ✅ | ✅ | ❌ |
| Lembretes/confirmação via WhatsApp | 🟡 | ✅ | ❌ |
| Pagamento online / depósito / sinal | ✅ | ✅ | ❌ |
| Maquininha / POS presencial | ✅ | ✅ | ❌ |
| Proteção contra no-show (cobrança) | ✅ | ✅ | ❌ |
| Comanda / fechamento de conta | ✅ | ✅ | ❌ |
| Comissão de profissionais | ✅ | ✅ | 🟡 (cálculo, sem repasse) |
| Estoque / produtos / venda de produtos | ✅ | ✅ | ❌ |
| Clube de assinatura / planos recorrentes | ✅ | ✅ | ❌ |
| Programa de fidelidade / pontos | ✅ | ✅ | ❌ |
| Pacotes pré-pagos / créditos | ✅ | ✅ | ❌ |
| Gift cards / vale-presente | ✅ | 🟡 | ❌ |
| Marketing (campanhas e-mail/SMS) | ✅ | ✅ | ❌ |
| Segmentação de clientes | ✅ | ✅ | ❌ |
| Lista de espera (waitlist) | ✅ | 🟡 | ❌ |
| Marketplace de descoberta | ✅ | ✅ | ❌ |
| Avaliações / reviews | ✅ | ✅ | ✅ |
| Relatórios avançados (100+) | ✅ | ✅ (130+) | 🟡 |
| Multi-unidade / rede | ✅ | ✅ | ❌ |
| Ficha de cliente / anamnese / fotos | ✅ | ✅ | ❌ |
| NF-e / emissão fiscal | 🟡 | ✅ | ❌ |
| Integração Instagram/Facebook agendamento | ✅ | ✅ | ❌ |
| Google Reserve / "Reservar com Google" | ✅ | 🟡 | ❌ |
| Bloqueios / folgas / horário por profissional | ✅ | ✅ | 🟡 (tabelas existem) |
| Recorrência de agendamento | ✅ | ✅ | ❌ |
| Cancelamento / reagendamento self-service | ✅ | ✅ | 🟡 (só cancelar) |

---

## 3. Épicos do novo PRD

Cada épico abaixo lista funcionalidades atômicas. Prioridade: **P0** (paridade
crítica), **P1** (diferenciação/retenção), **P2** (escala/avançado).

### EPIC A — Pagamentos & Proteção de Receita `P0`
1. Gateway de pagamento online (PIX + cartão) no fluxo de agendamento.
2. Sinal/depósito configurável por serviço (% ou valor fixo).
3. Política de no-show: cobrança automática de cartão salvo em caso de falta.
4. Cartão tokenizado (salvar meio de pagamento do cliente).
5. Taxa de cancelamento tardio automática.
6. Split de pagamento (repasse de comissão direto ao profissional).
7. POS presencial / fechamento de comanda com múltiplos meios de pagamento.
8. Integração maquininha (tap-to-pay / terminal).
9. Recibo digital por e-mail/WhatsApp.

### EPIC B — Comunicação & Lembretes `P0`
1. Lembrete automático configurável (X horas antes) por e-mail.
2. Lembrete via WhatsApp (template aprovado / API oficial).
3. Confirmação de agendamento (cliente confirma presença).
4. Notificação de cancelamento/reagendamento para ambos os lados.
5. Mensagens personalizáveis por estabelecimento.
6. Notificações push (quando houver app/PWA).
7. Pesquisa de satisfação pós-atendimento automática.

### EPIC C — Fidelização & Recorrência `P1`
1. **Clube de assinatura**: planos recorrentes com cobrança mensal (Payment Link / PIX recorrente).
2. Programa de fidelidade por pontos (acúmulo + resgate).
3. Pacotes pré-pagos / créditos de serviço.
4. Gift cards / vale-presente.
5. Agendamento recorrente (ex.: toda 4ª semana).
6. Cupons / descontos promocionais.
7. Indicação (referral) com recompensa.
8. Aniversário do cliente → oferta automática.

### EPIC D — Marketing & Aquisição `P1`
1. Campanhas de e-mail/SMS com templates.
2. Segmentação inteligente (novos, recorrentes, inativos).
3. Marketplace Agendaki (descoberta de salões por localização/serviço).
4. Perfil otimizado para SEO + página de busca pública.
5. Botão "Agendar" para Instagram/Facebook/bio.
6. Integração "Reservar com Google".
7. Reativação de clientes inativos (campanha automática).
8. Link de divulgação rastreável + QR Code.

### EPIC E — Gestão Operacional `P0/P1`
1. Estoque: cadastro de produtos, controle de saldo, alerta de reposição. `P1`
2. Venda de produtos (avulsa e na comanda). `P1`
3. Lista de espera (waitlist) para horários cheios. `P1`
4. Bloqueios, folgas e horário individual por profissional. `P0` (tabelas já existem)
5. Reagendamento self-service pelo cliente. `P0`
6. Ficha do cliente: histórico, anamnese, fotos antes/depois, observações. `P1`
7. Comissão avançada: por serviço, por produto, faixas, repasse e relatório de fechamento. `P1`
8. Multi-unidade / rede com gestão centralizada. `P2`
9. Controle de caixa (abertura/fechamento diário, sangria, suprimento). `P1`

### EPIC F — Relatórios & Inteligência `P1`
1. Dashboard executivo (faturamento, ocupação, ticket médio, no-show rate).
2. Relatório de ocupação por profissional/horário.
3. Relatório de retenção e recorrência de clientes.
4. Relatório de produtos/estoque.
5. Relatório de comissões e fechamento.
6. Exportação CSV/Excel/PDF de todos os relatórios.
7. Metas e acompanhamento por profissional.

### EPIC G — Apps & Presença Digital `P2`
1. PWA instalável (cliente + admin) como ponte para app nativo.
2. App nativo do cliente (iOS/Android).
3. App nativo do profissional (agenda, comissão, notificações).
4. Modo offline básico para a agenda.

### EPIC H — Fiscal & Compliance (Brasil) `P2`
1. Emissão de NF-e / NFS-e integrada.
2. Relatórios fiscais e fechamento contábil.
3. Conformidade LGPD: consentimento, exportação e exclusão de dados do cliente.
4. Termo de consentimento de anamnese/imagem.

---

## 4. Roadmap sugerido

| Fase | Foco | Épicos |
|------|------|--------|
| **Fase 1 — Paridade essencial** | Não perder cliente por falta de básico | A (pagamento + no-show), B (lembretes WhatsApp), E.4/E.5 (folgas, reagendamento) |
| **Fase 2 — Retenção** | Fazer o salão ficar | C (clube de assinatura, fidelidade, pacotes), E.6 (ficha cliente), E.9 (caixa) |
| **Fase 3 — Crescimento** | Trazer novos clientes | D (marketing, marketplace, integrações sociais), E.1–E.3 (estoque, produtos, waitlist) |
| **Fase 4 — Escala** | Competir em redes e fiscal | F (relatórios avançados), G (apps/PWA), H (NF-e, LGPD), E.8 (multi-unidade) |

---

## 5. Observações de diferenciação

- **Clube de assinatura** é o recurso de maior tração para **barbearias** no
  Brasil (Trinks vende isso como carro-chefe). Priorizar no EPIC C.
- **WhatsApp** é canal dominante no Brasil — lembrete por WhatsApp tem mais peso
  que SMS/e-mail (vantagem do Trinks sobre o Fresha).
- **Marketplace** é o grande motor de aquisição do Fresha; sem ele, dependemos do
  salão trazer o próprio tráfego.
- Várias tabelas necessárias já existem no schema (`professional_breaks`,
  `professional_working_hours`, `commission_logs`, `verification_codes`) — parte
  do EPIC E/B é "ligar" o que já está modelado.

---

## Fontes

- [Fresha — Features](https://www.fresha.com/for-business/features)
- [Fresha — Pricing](https://www.fresha.com/pricing)
- [Fresha — Marketplace](https://www.fresha.com/for-business/features/marketplace)
- [Fresha — Gift cards, packages, memberships](https://www.fresha.com/help-center/knowledge-base/gift-cards)
- [Fresha — Payments](https://www.fresha.com/for-business/features/payments)
- [Trinks — Negócios](https://negocios.trinks.com/)
- [Trinks — Sistema para barbearia](https://negocios.trinks.com/negocios/barbearias/)
- [Trinks — Clube de Assinaturas](https://ajuda.trinks.com/clube-de-assinaturass)
- [Trinks — Programa de Fidelidade](https://ajuda.trinks.com/o-que-%C3%A9-o-programa-de-fidelidade-central-de-ajuda-do-trinks)
- [Trinks — Fechar a conta (comanda)](https://ajuda.trinks.com/como-fechar-a-conta-dos-clientes)
