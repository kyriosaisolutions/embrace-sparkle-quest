# PRD — Próximos 5 Passos (Fechar Lacunas de Integração)

> Documento focado nos 5 itens que transformam o backend já entregue em
> funcionalidade **end-to-end**. Após esta fase, todas as features descritas no
> resumo competitivo passam de "API only" para "usuário do salão consegue usar".

Última atualização: 2026-05-30
Branch alvo: `claude/nifty-albattani-TV3Pq`
Pré-requisito: migração `20260530120000_phase2_internal_features.sql` aplicada.

---

## Resumo executivo

| # | Item | Tipo | Esforço | Impacto |
|---|------|------|---------|---------|
| 1 | Geração de slots respeitando `professional_working_hours` + `professional_breaks` | Lógica core | M (1–2 dias) | 🔥🔥🔥 paridade real com Trinks/Fresha |
| 2 | Acúmulo automático de pontos de fidelidade ao completar agendamento | Trigger SQL | S (2h) | 🔥🔥 fidelidade vira útil |
| 3 | Fechamento de comanda gera `cash_movement` e calcula comissão | Lógica server | S (3h) | 🔥🔥 caixa+comissão ficam consistentes |
| 4 | Aplicar cupom + gift card + pacote no fluxo de agendamento (`/$slug`) | UI + lógica | M (1 dia) | 🔥🔥 retenção/promoção entra no funil |
| 5 | Telas admin essenciais: Comandas, Caixa, Estoque, Fidelidade | UI extensa | L (3–5 dias) | 🔥🔥🔥 dono do salão consegue operar |

Total estimado: **6–9 dias de 1 dev sênior**.

---

## Passo 1 — Slot generation com `working_hours` + `breaks` por profissional

### Problema atual
A função que lista horários disponíveis em `/$slug` usa apenas o
`working_hours` do **tenant** (mesmo horário para todos). Ignora:
- `professional_working_hours` (horário individual)
- `professional_breaks` (folgas/férias/almoço)
- Conflito com `appointments` já marcados para o mesmo profissional

Resultado: cliente consegue marcar em hora que o profissional não atende, ou
no mesmo slot de outro cliente.

### Escopo
Reescrever `getAvailableSlots(tenantId, serviceId, professionalId, date)` para:
1. Determinar janela do dia: usar `professional_working_hours[day_of_week]` se
   existir; caso contrário cair para `tenants.working_hours[day_of_week]`.
2. Subtrair janelas de `professional_breaks` que cruzam o dia.
3. Subtrair `appointments` do profissional com status ≠ `cancelled` no dia.
4. Gerar slots de `slot_interval_minutes` (tenant) que comportam
   `service.duration_minutes` inteiro dentro de uma janela contínua.
5. Filtrar slots cujo início < `now + cancellation_hours` (opcional, configurável).

### Arquivo
- `src/server/functions/appointments.ts` → função `getAvailableSlots` (criar
  se não existe, substituir se existe).
- `src/routes/$slug.tsx` → consumir a função via `useQuery`.

### Critérios de aceitação
- [ ] Profissional A com horário 9–18 e profissional B com 14–20 retornam
      slots diferentes para o mesmo serviço.
- [ ] Folga cadastrada de 12–13h some das opções.
- [ ] Agendamento confirmado para 15:00 não permite outro cliente marcar 15:00–15:30
      com o mesmo profissional.
- [ ] Serviço de 60min em janela que termina às 18h **não** mostra 17:30.
- [ ] Mudar `tenant.slot_interval_minutes` de 30→15 dobra os slots.
- [ ] Marcar todos os dias da semana como "fechado" para o profissional zera os slots.

### Não-escopo
- Buffer entre atendimentos (item futuro).
- Capacidade simultânea (>1 cliente no mesmo profissional).

---

## Passo 2 — Acúmulo automático de pontos de fidelidade

### Problema atual
`loyalty_ledger` aceita inserts, mas nada chama. Cliente nunca acumula pontos
ao concluir um agendamento.

### Escopo
Trigger SQL `AFTER UPDATE ON appointments`:
- Disparar quando `OLD.status <> 'completed'` e `NEW.status = 'completed'`.
- Consultar `loyalty_rules` do `tenant_id`. Se `enabled = false`, sair.
- Calcular `points = floor(NEW.total_cents / currency_unit_cents) * points_per_currency_unit`.
- Inserir em `loyalty_ledger` com:
  - `delta = points`
  - `balance_after = (saldo atual do cliente neste tenant) + points`
  - `reason = 'appointment_completed'`
  - `appointment_id = NEW.id`
  - `expires_at = NEW.starts_at + expires_in_days` se regra define expiração.

Bonus: trigger inverso em `status = 'cancelled'` após já ter sido `completed`
(estorno de pontos). Versão 1 pode ignorar.

### Arquivo
- Nova migração: `supabase/migrations/<timestamp>_loyalty_auto_accrual.sql`.
- Server: nenhum (lógica fica no banco).

### Critérios de aceitação
- [ ] Concluir um agendamento de R$ 100 com regra `1 ponto a cada R$ 1` insere
      100 pontos no ledger.
- [ ] Saldo retornado por `getClientPoints` reflete o acúmulo.
- [ ] Mudar regra para `2 pontos a cada R$ 1` afeta agendamentos futuros, não
      retroativos.
- [ ] Tenant com `loyalty_rules.enabled = false` não acumula nada.
- [ ] Expiração: `expires_in_days = 365` grava `expires_at` correto.

---

## Passo 3 — Comanda fechada vira `cash_movement` + comissão

### Problema atual
`closeComanda` apenas marca a comanda como `paid` e decrementa estoque. Não:
- Cria registro em `cash_movements` (caixa fica fora de sincronia)
- Calcula comissão por item para `commission_logs` por profissional

### Escopo
Alterar `closeComanda` (`src/server/functions/comandas.ts`) para, dentro da
mesma operação:
1. Buscar a sessão de caixa aberta do tenant. Se não houver, lançar erro
   "Não há caixa aberto" (forçar disciplina) **ou** opcionalmente criar
   movimento "sem sessão" (decisão de produto — recomendar erro).
2. Inserir 1 `cash_movement` por método de pagamento utilizado:
   - `kind = 'sale'`
   - `amount_cents = comanda.total_cents`
   - `payment_method = data.payment_method`
   - `appointment_id` se `comanda.appointment_id` existir
3. Para cada item `kind = 'service'`, se o `professional_id` tem regra em
   `professional_service_commissions` (ou fallback `professionals.commission_value`):
   - Calcular comissão (% sobre `total_cents` do item, ou valor fixo).
   - Inserir `commission_logs(professional_id, appointment_id, amount_cents, commission_cents, paid=false)`.

### Arquivo
- `src/server/functions/comandas.ts` — função `closeComanda`.

### Critérios de aceitação
- [ ] Fechar comanda com 1 serviço de R$ 80 e 1 produto de R$ 20 gera 1
      `cash_movement` de R$ 100.
- [ ] Profissional com `commission_value = 30` (= 30%) na mesma comanda gera
      `commission_logs.commission_cents = 2400` (30% de 80).
- [ ] Tentar fechar com nenhum caixa aberto falha com mensagem clara.
- [ ] Fechar comanda paga via 2 métodos (split — futuro): comportamento atual
      = 1 movimento com método dominante (registrar isto como limitação).

### Não-escopo
- Pagamento parcelado (cartão).
- Pagamento dividido em múltiplos métodos.

---

## Passo 4 — Cupom, gift card e pacote no fluxo de agendamento `/$slug`

### Problema atual
Tabelas `coupons`, `gift_cards`, `client_packages` existem; `appointments`
tem colunas para vincular. Mas a UI do `/$slug` (dialog de booking) **não tem
campos** para o cliente aplicar nenhum dos três.

### Escopo
Estender o dialog de agendamento em `src/routes/$slug.tsx`:

**A) Cupom**
- Campo "Cupom" + botão "Aplicar".
- Ao aplicar, chamar `validateCoupon` com `tenant_id`, `code`, `total_cents`,
  `service_id`.
- Se válido, mostrar desconto em verde, atualizar total exibido, guardar
  `coupon_id` no state.
- Ao criar agendamento, enviar `coupon_id` + `discount_cents`; após criar,
  chamar `redeemCoupon`.

**B) Gift card**
- Campo "Vale-presente" + botão "Consultar saldo".
- Se válido, oferecer "Usar até R$ X do meu vale" (até o menor entre saldo e total).
- Guardar `gift_card_id` + valor a aplicar; aplicar `redeemGiftCard` após o
  agendamento ser criado.

**C) Pacote do cliente** (apenas se cliente logado)
- Buscar `getClientPackages` filtrando pelos que cobrem o `service_id` do
  serviço escolhido e `sessions_remaining > 0`.
- Exibir opção "Usar 1 sessão do pacote Y (restam X)" com radio.
- Se selecionado, total = R$ 0 (ou diferença se serviço > preço pago) e
  `client_package_id` é vinculado; `consumeSession` é chamado após criar.

**D) Stacking**
- Versão 1: **mutuamente exclusivos** (cliente escolhe **um** entre os três).
  Justificativa: simplicidade + evitar arbitragem (gift card de R$ 50 + cupom
  50% = grátis em serviço de R$ 100).
- Documentar regra na UI: "Você pode aplicar apenas um benefício por agendamento."

### Arquivo
- `src/routes/$slug.tsx` (UI do dialog)
- `src/server/functions/appointments.ts` (createAppointment aceita
  `coupon_id`, `gift_card_id`, `client_package_id`, `discount_cents`)

### Critérios de aceitação
- [ ] Cupom percentual 10% em serviço de R$ 100 mostra desconto de R$ 10,
      total final R$ 90, e cria `appointment.discount_cents = 1000`.
- [ ] Cupom expirado/inativo retorna mensagem clara.
- [ ] Gift card com saldo R$ 30 aplicado em serviço de R$ 50 cobra R$ 20
      "no salão" e debita R$ 30 do gift card.
- [ ] Pacote com 5 sessões: agendar consome 1, ledger fica em 4. Mostrar
      sessões restantes no `/minha-area`.
- [ ] Trocar de "cupom" para "gift card" no dialog limpa o cupom aplicado.

### Não-escopo
- Aplicar benefício diretamente na **comanda** (mais flexível, depois).
- Geração de PDF de gift card para enviar ao destinatário.

---

## Passo 5 — Telas admin essenciais (Comandas, Caixa, Estoque, Fidelidade)

### Problema atual
13 server functions sem UI no admin. Dono do salão não opera.

### Escopo
Adicionar 4 tabs ao `src/routes/admin.tsx` (ou rotas filhas):

### 5.1 Tab "Comandas" (PDV)
- Lista de **comandas abertas** (`listOpenComandas`).
- Botão "Nova comanda" — escolhe cliente (autocomplete) + agendamento opcional.
- Comanda aberta: editor de itens com 2 colunas
  - Esquerda: catálogo de serviços + produtos filtráveis (busca + categoria)
  - Direita: itens adicionados, com qty/preço editável, total ao vivo
- Aplicar desconto (R$ ou %).
- Botão "Fechar" → seletor de método de pagamento (dinheiro/PIX/débito/crédito)
  → confirma → chama `closeComanda`.

### 5.2 Tab "Caixa"
- Estado da sessão: aberto/fechado/diferença.
- Botão "Abrir caixa" (input: valor inicial em dinheiro).
- Lista movimentos do dia agrupados por tipo (venda/sangria/suprimento/despesa).
- Botão "Sangria" e "Suprimento" com diálogo de valor + motivo.
- Botão "Fechar caixa" → confirma valor contado → chama `closeCashSession`,
  mostra diferença em verde/vermelho.
- Histórico das últimas 30 sessões (link para detalhes).

### 5.3 Tab "Estoque"
- Lista de produtos (`listProducts`) com colunas: nome, categoria, preço,
  estoque, status.
- Linha em vermelho se `stock_qty <= min_stock_qty`.
- Botão "Novo produto" → formulário (`upsertProduct`).
- Botão "Ajustar" por linha → diálogo com tipo (entrada/saída/perda/ajuste) +
  quantidade + motivo → `adjustStock`.
- Filtro "Apenas estoque baixo" reutilizando `getLowStock`.

### 5.4 Tab "Fidelidade"
- Card de configuração de regras (`getLoyaltyRules` / `upsertLoyaltyRules`):
  switch enabled, "X pontos a cada R$ Y", "Z pontos = R$ W de desconto",
  mínimo para resgate, dias para expirar.
- Card de simulação: "Cliente gasta R$ 100 → ganha N pontos".
- Lista dos top 10 clientes por saldo (consulta agregada — função nova
  `getTopLoyaltyClients`).

### Critérios de aceitação
- [ ] Abrir caixa, abrir comanda, adicionar 1 serviço + 1 produto, fechar
      como "dinheiro" → caixa mostra +R$ no mesmo valor.
- [ ] Tentar abrir 2 caixas simultâneos é bloqueado pelo backend (já é).
- [ ] Ajuste de estoque -2 em produto com 10 deixa em 8 e cria stock_movement.
- [ ] Mudar regra de fidelidade salva e simulação reflete imediatamente.
- [ ] Layout mobile usável (>= 360px) — comandas e caixa são operados em tablet.

### Não-escopo
- Telas de pacotes, gift cards, cupons, ficha do cliente, lista de espera,
  anamnese, relatórios visuais com gráficos. Ficam para passo 6.

---

## Itens transversais

### Permissão por papel
Manter o gate atual: `professional` (não owner) vê **só** "Comandas" e
"Caixa" (operação diária). "Estoque" e "Fidelidade" exigem `owner`.

### Telemetria mínima
Logar via `console.info` (sem provedor externo ainda):
- `comanda_closed` `{tenant, total, method}`
- `cash_opened` / `cash_closed` `{tenant, difference}`
- `coupon_redeemed` / `gift_card_redeemed` / `package_consumed`

### LGPD
Nenhum impacto novo — todas as ações usam `clientId` já consentido.

### Testes manuais sugeridos
Roteiro único de smoke test (`docs/SMOKE-TEST.md` a criar):
1. Aplicar migração.
2. Configurar 2 profissionais com horários diferentes + uma folga.
3. Cliente A agenda no profissional 1 às 15h.
4. Cliente B tenta às 15h no profissional 1 — bloqueado.
5. Cliente B agenda às 15h no profissional 2 — ok.
6. Concluir agendamento de R$ 50 com fidelidade habilitada → cliente acumula
   50 pontos.
7. Abrir caixa R$ 100. Abrir comanda do agendamento. Fechar como PIX. Caixa
   mostra +R$ 50.
8. Criar cupom 20%. Cliente C agenda com cupom → desconto aplicado.
9. Emitir gift card R$ 100. Aplicar metade num agendamento. Saldo = R$ 50.

---

## Riscos & decisões pendentes

| Risco / decisão | Recomendação |
|-----------------|--------------|
| Fechar comanda sem caixa aberto | **Bloquear** (forçar disciplina) |
| Cupom + gift card no mesmo agendamento | **Bloquear** (mutuamente exclusivos) na V1 |
| Estorno de pontos ao cancelar agendamento já completado | **Adiar** para V2 |
| Buffer entre atendimentos | **Adiar** para V2 |
| Múltiplos métodos de pagamento em uma comanda | **Adiar** para V2 (só método dominante) |
| Pacote cobre serviço de preço maior | Cobrar diferença em dinheiro no fechamento |

---

## Pronto quando

- ✅ Smoke test completo passa.
- ✅ Cliente consegue: marcar respeitando folgas, aplicar cupom/gift/pacote.
- ✅ Salão consegue: operar comandas e caixa diariamente sem mexer no DB.
- ✅ Pontos de fidelidade acumulam sozinhos.
- ✅ Diferença de caixa aparece no fechamento.

Após este passo, **Agendaki tem paridade operacional real com Trinks** para
o caso de uso "salão pequeno/médio sem pagamento online ainda". O próximo PRD
deve cobrir EPIC A (pagamentos) ou o Google Calendar bidirecional.
