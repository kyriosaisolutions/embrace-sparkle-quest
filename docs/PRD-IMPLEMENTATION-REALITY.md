# PRD — Implementação na Vida Real (Brasil)

> Complemento ao `PRD-COMPETITIVE.md`. Para cada épico, mapeia provedores reais,
> requisitos legais (CNPJ, ICP-Brasil, LGPD), modelo de custo, esforço de
> integração e armadilhas conhecidas. Foco: **o que precisa estar pronto antes
> de digitar a primeira linha de código**.

Última atualização: 2026-05-30

---

## EPIC A — Pagamentos & Proteção de Receita

### A.1–A.5 — PIX + Cartão + Cartão salvo + No-show

**Provedores candidatos (Brasil):**

| Provedor | PIX | Cartão | Cartão salvo (token) | Split nativo | NF-e da taxa | Onboarding |
|----------|-----|--------|----------------------|--------------|--------------|------------|
| **Asaas** | ✅ | ✅ | ✅ | ✅ | ✅ | CPF ou CNPJ; rápido |
| **Pagar.me (Stone)** | ✅ | ✅ | ✅ | ✅ | ✅ | CNPJ obrigatório, KYC mais rigoroso |
| **Mercado Pago** | ✅ | ✅ | ✅ | 🟡 (limitado) | ✅ | CPF/CNPJ; rápido |
| **Stripe** | ✅ | ✅ | ✅ | ✅ (Connect) | 🟡 | CPF ou CNPJ; pré-set de tax ID **não pode mudar depois** |
| **PagBank/PagSeguro** | ✅ | ✅ | ✅ | ✅ | ✅ | CPF/CNPJ |

**Custos típicos (referência 2026):**
- **PIX:** 0% a 0,49% por transação (varia; Asaas/Mercado Pago ~0,99% + R$0,19 fora de pacote)
- **Cartão crédito à vista:** 3,98% a 4,98%
- **Cartão débito:** ~1,99%
- **Boleto:** R$ 2,90 a R$ 4,90 (não recomendado p/ salão, prazo de compensação)

**Recomendação:** **Asaas** (foco PME Brasil, API limpa, split nativo, sub-contas
permitem onboarding com CPF — bom para profissional autônomo) **ou** **Pagar.me**
(se priorizar volumes e antifraude robusto).

**Requisitos para começar:**
- ✅ Conta no provedor (sandbox grátis em todos)
- ✅ Para produção: CPF ou CNPJ + conta bancária do recebedor
- ✅ Webhook HTTPS público (PIX recebido, cartão aprovado, chargeback)
- ✅ Política de privacidade + termos publicados (provedores exigem)
- ⚠️ Para salvar cartão (token): cumprir requisitos PCI DSS SAQ-A
  (token vem do provedor → nunca passa pelo nosso servidor; mantém escopo mínimo)
- ⚠️ Cobrança automática de no-show: **autorização prévia** do cliente (CDC art. 39)

**Esforço técnico:** ~3 semanas (checkout + webhook + reconciliação + UI de
configuração de sinal por serviço).

### A.6 — Split de pagamento (repasse comissão)

**Como funciona:** no momento do pagamento, o gateway divide automaticamente:
ex. 70% profissional / 30% salão. Cada parte vira saldo separado; "repasse" para
banco segue calendário do provedor (D+1 PIX, D+30 cartão é comum).

**Provedores que suportam bem:** Asaas, Pagar.me, Stripe Connect, PagBank, PagBrasil.

**Regulação:** Bacen Circular 3.682/2013 + Resolução 150/2021 (arranjo de pagamento).
Plataforma precisa estar em conformidade — usar provedor já licenciado **resolve isso para nós**.

**Requisitos:**
- ✅ Profissional precisa de CPF + conta bancária pessoal (PIX recebe em CPF)
- ✅ Onboarding KYC do profissional (provedor faz)
- ⚠️ Decisão: split por valor fixo, % ou regra híbrida (ex. produto 100% salão, serviço 70/30)

### A.7–A.8 — POS / Maquininha / Comanda

**Opções:**
- **Tap-to-Pay no iPhone/Android** (Stripe, Pagar.me, Stone): cobra com celular,
  sem maquininha física. Requer app nativo (não dá para web).
- **Maquininha física** integrada: Stone (link com Pagar.me), Cielo LIO, PagBank.
- **Comanda 100% software:** abre comanda → adiciona serviços/produtos → fecha
  → escolhe meio pagamento (qualquer combinação) → registra. Sem maquininha,
  paga "fora do sistema" e registra. Caminho mais rápido para começar.

**Recomendação:** começar com **comanda software-only + checkout PIX**, evoluir
para tap-to-pay quando tiver app nativo.

### A.9 — Recibo digital
Geração de PDF + envio por WhatsApp/e-mail. Pode usar `react-pdf` ou template
HTML→PDF (Puppeteer/Chromium em edge function). Sem dependência externa.

---

## EPIC B — Comunicação & Lembretes

### B.1 — E-mail
**Provedores:** Resend (mais simples), SendGrid, AWS SES.
- **Resend:** 3.000 e-mails/mês grátis, depois US$20/mês até 50k. API trivial.
- **SES:** US$0,10/1.000 e-mails; mais barato em escala, setup mais chato (DKIM/SPF).
- **Requisitos:** domínio próprio + DNS (SPF/DKIM/DMARC).

### B.2 — WhatsApp (decisão estratégica)

Duas rotas, cada uma com trade-off **forte**:

| | **WhatsApp Cloud API (Meta oficial)** | **Z-API / Evolution API (não-oficial)** |
|---|---|---|
| Como funciona | Conta Business verificada na Meta + número dedicado | Conecta um WhatsApp comum por QR code |
| Custo por msg | Utility: US$0,008 · Marketing: US$0,0625 · Auth: US$0,0315 | **Mensagens ilimitadas** com plano fixo (R$ 99–199/mês) |
| Templates aprovados | **Obrigatório** para mensagem proativa | Não precisa |
| Risco de banimento | Praticamente zero | **Alto** — Meta pode banir o número |
| Onboarding | Verificação de negócio (Meta Business), 2–7 dias | Instantâneo (escaneia QR) |
| Escalabilidade | Profissional, recomendado para volume | Bom para começar, frágil para escalar |
| Limite de número | 1 número por linha telefônica | 1 número por linha |

**Recomendação:** suportar **as duas**. Padrão = Z-API (barato, instantâneo,
funciona para 95% dos salões); plano Pro = Cloud API oficial (para redes/franquias).

**Requisitos Cloud API:**
- ✅ Conta Meta Business verificada (precisa CNPJ + site + e-mail corporativo)
- ✅ Número de telefone dedicado (não pode estar em WhatsApp pessoal)
- ✅ Templates aprovados (categorias: utility, marketing, auth)
- ✅ BSP (Business Solution Provider) ou integração direta

**Requisitos Z-API:**
- ✅ Conta Z-API (R$ 99/mês plano básico)
- ✅ Número WhatsApp que ficará dedicado ao bot
- ⚠️ Risco de banimento — Meta tem políticas anti-automação

### B.3–B.7 — Confirmação, notificações, satisfação
Tudo construído sobre o canal escolhido. Esforço: ~1 semana após canal pronto.

---

## EPIC C — Fidelização & Recorrência

### C.1 — Clube de assinatura

**Mecânica brasileira:**
- **PIX Automático (Banco Central, lançado 14/maio/2026):** cliente autoriza
  débito recorrente uma vez no app do banco; cobranças mensais entram automáticas.
  Reduz inadimplência em 64% e custo de cobrança em 91% (dados EBANX/MEF).
- **Cartão de crédito recorrente:** tokeniza no primeiro pagamento, cobra mensalmente.
- **Payment Link mensal:** Trinks usa essa rota — gera link novo a cada mês.

**Provedores:**
- **Asaas:** PIX Automático em GA, assinatura cartão, payment link recorrente.
- **Pagar.me:** assinatura cartão, PIX recorrente em rollout.
- **Inter Empresas:** PIX Automático nativo.

**Requisitos:**
- ✅ CNPJ do estabelecimento (PIX Automático **não aceita CPF** como recebedor de recorrência)
- ✅ Cadastro de "Jornada de Recorrência" no PSP do recebedor
- ⚠️ Cliente precisa de app bancário compatível (todos os grandes bancos já são)

**Esforço:** ~3 semanas (modelagem de plano, ciclo de cobrança, dunning, cancelamento).

### C.2 — Programa de fidelidade
100% interno, sem provedor externo. Tabela `loyalty_points` + regras
configuráveis (X pontos por R$ gasto, Y pontos viram desconto Z).
**Esforço:** ~1 semana.

### C.3–C.4 — Pacotes pré-pagos / Gift cards

**Aspecto legal (Gift Card):**
- ⚠️ Sem lei específica → CDC + Código Civil regem.
- ✅ Pode ter validade, **desde que destacada antes da compra** (mercado usa 6–12 meses).
- ⚠️ Se cliente usar valor parcial, **não pode confiscar a diferença** (CDC).
- ⚠️ Se passar a validade, jurisprudência divide-se — prudente: enviar lembrete
  30/15/7 dias antes do vencimento.

**Esforço:** ~2 semanas (cada um).

### C.5–C.8 — Recorrência, cupom, indicação, aniversário
Lógica interna + uso do canal de comunicação. **Esforço:** ~2 semanas total.

---

## EPIC D — Marketing & Aquisição

### D.1–D.2 — Campanhas e segmentação
Mesma stack do EPIC B (Resend/SES + WhatsApp).
**Requisito legal:** **opt-in explícito** para marketing (LGPD art. 7º/8º).
Separar consentimentos: transacional ≠ marketing.

### D.3–D.4 — Marketplace Agendaki
Construção interna. Requisitos:
- Página `/buscar?cidade=&servico=` indexável (SSR no TanStack Start já temos)
- Schema.org `LocalBusiness` + `Service` JSON-LD em cada perfil
- Sitemap dinâmico + robots.txt
- Geo-busca: PostGIS no Supabase (extensão disponível) ou cálculo Haversine

### D.6 — Reservar com Google

**Requisitos formais (críticos):**
- ✅ **Contrato direto** com cada estabelecimento (Google verifica)
- ✅ Cada estabelecimento precisa ter Google Business Profile **com endereço físico**
  validado e batendo com o Maps
- ✅ Aplicação ao **Reserve with Google Partner Program** (formulário + entrevista)
- ✅ Implementar feeds: `merchants_feed`, `services_feed`, `availability_feed`
  (formato proto/JSON) atualizados ao menos a cada 2h
- ✅ Implementar API de booking (criar, alterar, cancelar) que o Google chama
- ⚠️ Pagamento via CPF **não suportado no Brasil** — apenas CNPJ/cartão internacional
- ⚠️ Processo de aprovação leva 2–6 meses

**Esforço:** ~6 semanas + tempo de aprovação Google.

### D.7–D.8 — Reativação + link rastreável
Lógica de query (cliente sem visita há X dias) + UTM no link curto.
**Esforço:** ~1 semana.

---

## EPIC E — Gestão Operacional

### E.1–E.2 — Estoque + venda de produto
CRUD + integração na comanda. **Esforço:** ~2 semanas.

### E.3 — Lista de espera
Quando agendamento é cancelado, dispara notificação para fila do mesmo horário.
**Esforço:** ~1 semana.

### E.4–E.5 — Bloqueios, folgas, reagendamento
Tabelas `professional_breaks` e `professional_working_hours` **já existem** —
falta UI no admin + lógica de filtragem na geração de slots.
**Esforço:** ~1 semana.

### E.6 — Ficha do cliente (anamnese + fotos)
- Fotos: Supabase Storage (já temos).
- Anamnese: JSON flexível por estabelecimento (formulário customizável).
- ⚠️ **LGPD — dado de saúde é sensível** (art. 11) → consentimento separado +
  acesso restrito.

### E.9 — Controle de caixa
Sangria, suprimento, fechamento diário. **Esforço:** ~2 semanas.

---

## EPIC F — Relatórios & Inteligência

100% queries Supabase + agregações. Sem dependência externa.
**Esforço:** ~3 semanas para cobrir 30+ relatórios.

Considerar **materialized views** ou **Supabase Edge Function + cache** para
relatórios pesados (mensal/anual).

---

## EPIC G — Apps & Presença Digital

### G.1 — PWA (recomendado começar aqui)
Vite plugin PWA + manifest + service worker. Push notifications via Web Push API.
**Esforço:** ~1 semana. **Custo:** zero.

### G.2–G.3 — Apps nativos
**Opções:**
- **Expo/React Native:** reaproveita ~80% do código UI atual. Equipe pequena.
- **Capacitor:** embrulha a PWA em app nativo. Mais rápido, menos performante.
- **Nativo (Swift/Kotlin):** time específico, 3–4x o custo.

**Requisitos:**
- ✅ Apple Developer (US$99/ano) + Google Play (US$25 único)
- ✅ Conta DUNS para Apple (PJ) — gratuito mas demora ~1 semana
- ⚠️ Review da Apple: 1–2 semanas, política rígida sobre pagamentos (não pode
  cobrar mensalidade do salão pela App Store sem dar 30% pra Apple — usar web)

**Esforço:** ~3 meses MVP por plataforma (Expo).

---

## EPIC H — Fiscal & Compliance

### H.1 — NF-e / NFS-e

**Cenário atual (importante):**
- Desde **01/set/2023:** MEI prestador de serviço **obrigado** a emitir NFS-e
  Padrão Nacional.
- A partir de **01/set/2026:** ME e EPP do Simples Nacional **obrigados** a usar
  Padrão Nacional exclusivamente.

**Para integrar diretamente (gov.br):**
- ✅ Responsável legal do CNPJ com **selo Prata ou Ouro no GOV.BR**
- ✅ **Certificado digital ICP-Brasil** (A1 software ou A3 token) — custo R$ 200–400/ano
- ✅ Comunicação **mTLS** com certificado
- ✅ Implementar idempotência (não autorizar 2x a mesma NFS-e)
- ⚠️ Para municípios que ainda não aderiram ao Padrão Nacional → cada prefeitura
  tem API própria (~5.500 municípios, ~150 padrões diferentes)

**Recomendação:** **NÃO integrar direto**. Usar agregador:
- **Focus NFe:** US$50–200/mês, cobre maioria das prefeituras + Padrão Nacional
- **TecnoSpeed PlugNotas:** alternativa similar
- **NotaGateway, eNotas:** outras opções

**Requisitos do salão (cliente nosso):**
- ✅ CNPJ + Inscrição Municipal
- ✅ Certificado digital A1 (ele cadastra no nosso painel)
- ✅ Configuração de alíquota ISS por município

**Esforço integração:** ~3 semanas via agregador.

### H.3 — LGPD

**Funcionalidades obrigatórias:**
- ✅ **Consentimento granular** no cadastro (transacional vs. marketing vs. imagem)
- ✅ **Painel "Meus Dados"** no `/minha-area`: exportar (JSON), corrigir, excluir
- ✅ **Revogação de consentimento** a qualquer momento (botão "deixar de receber")
- ✅ Política de privacidade + termo de uso públicos
- ✅ **Registro de atividade de tratamento** (RAT) interno

**Encarregado (DPO):**
- ⚠️ **Agendaki** (controlador) precisa nomear encarregado público.
- ✅ Salões clientes pequenos (até PME) **dispensados** de DPO formal (Resolução
  CD/ANPD nº 2/2022) — mas precisam de canal de contato com titulares.

**Dado sensível (saúde — anamnese):**
- ⚠️ Consentimento **específico e destacado** (art. 11)
- ⚠️ Acesso restrito (RLS por profissional + log de acesso)

**Esforço:** ~2 semanas + revisão jurídica (não-engenharia).

---

## Resumo: o que precisa virar ação **antes do código**

| Ação | Quem resolve | Bloqueia |
|------|--------------|----------|
| Decidir gateway (Asaas vs Pagar.me) | Produto + financeiro | EPIC A |
| Abrir conta sandbox no gateway | Eng | EPIC A |
| Domínio + DNS para e-mail transacional | Eng | EPIC B |
| Conta Meta Business verificada (CNPJ Agendaki) | Jurídico/Operações | EPIC B (Cloud API) |
| Conta Z-API + número dedicado | Operações | EPIC B (rota barata) |
| Política de privacidade + termos públicos | Jurídico | EPIC A, B, D (LGPD) |
| Nomear DPO Agendaki + página de contato | Jurídico | EPIC H |
| Aplicação ao Reserve with Google | Parcerias | EPIC D.6 |
| Apple Developer + Google Play (CNPJ Agendaki) | Operações | EPIC G.2 |
| Contrato com agregador de NF (Focus/PlugNotas) | Financeiro | EPIC H.1 |
| Definir modelo de cobrança do salão (SaaS mensal? % do agendamento?) | Produto | Marca o gateway de cobrança a usar para nós mesmos |

---

## Estimativa total (engenharia, sequencial, 1 dev sênior FT)

| Fase | Escopo | Esforço |
|------|--------|---------|
| Fase 1 — Paridade | A (sem split + sem POS), B (Z-API), E.4/E.5 | **6–8 semanas** |
| Fase 2 — Retenção | C completo, E.6, E.9, A.6 (split) | **10–12 semanas** |
| Fase 3 — Crescimento | D (sem Reserve), E.1–E.3 | **8–10 semanas** |
| Fase 4 — Escala | F, G (PWA), H (NF via agregador + LGPD), G.2 (app Expo) | **16–20 semanas** |

Total realista para paridade completa: **~10 meses com 1 dev** ou **~5 meses com 2 devs**.

---

## Fontes

**Pagamentos:**
- [Asaas — Split de Pagamentos (docs)](https://docs.asaas.com/docs/split-de-pagamentos)
- [Asaas — Blog Split](https://blog.asaas.com/split-de-pagamento/)
- [Stripe — Brazil Connect onboarding](https://support.stripe.com/questions/brazil-updates-to-verification-requirements-for-connected-accounts-of-platforms)
- [Stripe — Brazil bank accounts](https://support.stripe.com/questions/supported-bank-accounts-in-brazil)
- [Pagar.me API docs](https://docs.pagar.me/)

**PIX:**
- [Banco Central — API PIX (GitHub)](https://github.com/bacen/pix-api)
- [PagBrasil — PIX Automático](https://www.pagbrasil.com/blog/pix/how-automatic-pix-works/)
- [Inter — API PIX Automático](https://developers.inter.co/references/pix-automatico)
- [EBANX — PIX Automático](https://insights.ebanx.com/en/pix-automatico/)

**WhatsApp:**
- [Meta — WhatsApp Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [Brazil pricing breakdown](https://www.messagecentral.com/blog/whatsapp-business-api-pricing-in-brazil)
- [Z-API](https://z-api.io/) · [Z-API docs](https://developer.z-api.io/)
- [Z-API vs API Oficial](https://developer.z-api.io/tips/Z-APIvsAPI-OFICIAL)

**NF-e / NFS-e:**
- [gov.br — NFS-e MEI](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/nota-fiscal/nota-fiscal-de-servico-eletronica-nfs-e)
- [Manual técnico API NFS-e Nacional (PDF)](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual/manual-contribuintes-emissor-publico-api-sistema-nacional-nfs-e-v1-2-out2025.pdf)
- [Focus NFe — API NFS-e Nacional](https://focusnfe.com.br/api-nfse-nacional/)
- [TecnoSpeed — API NFSe](https://blog.tecnospeed.com.br/api-nfse-nacional-o-que-e-e-como-integrar/)

**LGPD:**
- [Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Serpro — Como cumprir a LGPD](https://www.serpro.gov.br/lgpd/empresa/como-cumprir-a-lgpd)
- [Dispensa de DPO para PME (Resolução CD/ANPD nº 2/2022)](https://blog.bcompliance.com.br/2025/07/11/lgpd-pequenas-empresas-dispensa-dpo-canal-comunicacao/)

**Reserve with Google:**
- [Partner Program — Eligibility](https://developers.google.com/actions-center/verticals/reservations/e2e/overview)
- [Platform Policies](https://developers.google.com/actions-center/verticals/reservations/e2e/policies/platform-policies)
- [Get started](https://support.google.com/reserve/answer/9172607?hl=en)

**Gift card legal:**
- [Defensoria PR — Vale-presente tem validade?](https://www.defensoriapublica.pr.def.br/Noticia/Vale-presente-tem-prazo-de-validade)
- [CDC](https://www.consumidor.gov.br/pages/conteudo/publico/102)
