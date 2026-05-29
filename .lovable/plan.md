O sistema atual possui uma estrutura robusta, mas os dados ainda estao isolados em constantes `MOCK` nos arquivos de rota. Abaixo, o levantamento do que precisa ser integrado ao banco de dados:

### 1. Pagina Publica (`src/routes/$slug.tsx`)
- **Dados do estabelecimento**: Substituir `MOCK_TENANT` por busca na tabela `tenants` via slug.
- **Catalogo de Servicos**: Substituir `MOCK_SERVICES` por busca na tabela `services` filtrando por `tenant_id`.
- **Equipe**: Substituir `MOCK_PROFESSIONALS` por busca na tabela `professionals` com juncao em `professional_services`.
- **Avaliacoes**: Substituir `MOCK_REVIEWS` por busca na tabela `reviews`.
- **Fluxo de Agendamento**:
  - Salvar novo cliente na tabela `clients`.
  - Criar registro na tabela `appointments` ao finalizar o PIX.
  - Validar disponibilidade real consultando conflitos em `appointments`.

### 2. Minha Area (`src/routes/minha-area.tsx`)
- **Autenticacao**: Ativar o middleware do Supabase para identificar o `client_id`.
- **Agendamentos**: Substituir `MOCK_MY_APPOINTMENTS` e `MOCK_HISTORY` por consultas reais em `appointments` filtrando pelo cliente logado.
- **Favoritos**: Buscar tenants onde o cliente ja realizou servicos.
- **Avaliacoes**: Enviar dados reais para a tabela `reviews` vinculada ao `appointment_id`.

### 3. Painel Admin (`src/routes/admin.tsx`)
- **Agenda**: Substituir `MOCK_AGENDA` por stream em tempo real da tabela `appointments`.
- **Equipe e Servicos**: Implementar CRUD completo refletindo nas tabelas `professionals` e `services`.
- **Financeiro**:
  - Consolidar dados de `appointments` (receita) e `commission_logs` (despesas).
  - Listagem real dos logs de auditoria.

### 4. Infraestrutura de Auth
- **WhatsApp OTP**: Implementar a logica de geracao/validacao na tabela `verification_codes`.
- **Google Auth**: Configurar o provedor no Lovable Cloud.

### Proximos Passos Sugeridos:
1. Criar funcoes de servidor (`createServerFn`) para buscar dados do Tenant por slug.
2. Implementar hooks do `tanstack/react-query` para gerenciar o estado global desses dados.
3. Migrar o formulário de agendamento para persistir no banco.

Deseja começar pela integração da **Página Pública** ou pelo **Painel Admin**?
