import { getTokens, setAccessToken } from "../auth/authStorage";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:8000" : "");

async function parseError(res: Response): Promise<ApiError> {
  let details: unknown = undefined;
  try {
    details = await res.json();
  } catch {
    // ignore
  }

  const message =
    typeof details === "object" && details && "detail" in (details as any)
      ? String((details as any).detail)
      : res.statusText || "Request failed";

  return { status: res.status, message, details };
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  auth?: boolean;
  retryOn401?: boolean;
};

function withQuery(path: string, query?: RequestOptions["query"]) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const auth = options.auth ?? true;
  const retryOn401 = options.retryOn401 ?? true;

  const url = `${API_BASE}${withQuery(path, options.query)}`;
  const tokens = auth ? getTokens() : null;

  const res = await fetch(url, {
    method,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (res.status === 401 && auth && retryOn401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...options, retryOn401: false });
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

type TokenResponse = { access_token: string; refresh_token: string; token_type: "bearer" | string };
type UserResponse = { id: number; name: string; email: string; is_active: boolean };

export type Account = {
  id: number;
  name: string;
  type: string;
  currency: string;
  opening_balance: string | number;
  current_balance: string | number;
  is_active: boolean;
};

export type Category = {
  id: number;
  name: string;
  type: "income" | "expense" | string;
  is_active: boolean;
};

export type Transaction = {
  id: number;
  type: "income" | "expense" | "transfer" | string;
  amount: string | number;
  account_id: number;
  category_id?: number | null;
  date: string;
  note?: string | null;
  reference?: string | null;
  transfer_account_id?: number | null;
  tags?: { id: number; name: string; color?: string | null }[];
};

export type Paginated<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type TransactionImportRowError = {
  row_number: number;
  message: string;
  raw: Record<string, string | null | undefined>;
};

export type TransactionImportResponse = {
  total_rows: number;
  imported: number;
  failed: number;
  skipped: number;
  dry_run: boolean;
  mode: string;
  errors: TransactionImportRowError[];
};

export type DashboardSummary = {
  total_balance: string | number;
  this_month_income: string | number;
  this_month_expense: string | number;
  this_month_savings: string | number;
  recent_transactions: any[];
  expense_by_category: any[];
  account_balances: any[];
};

export async function login(email: string, password: string) {
  return request<TokenResponse>("/api/v1/auth/login", { method: "POST", auth: false, body: { email, password } });
}

export async function register(name: string, email: string, password: string) {
  return request<UserResponse>("/api/v1/auth/register", { method: "POST", auth: false, body: { name, email, password } });
}

export async function me() {
  return request<UserResponse>("/api/v1/auth/me", { method: "GET" });
}

export async function refreshAccessToken(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return false;
  try {
    const res = await request<{ access_token: string; token_type: string }>("/api/v1/auth/refresh", {
      method: "POST",
      auth: false,
      body: { refresh_token: tokens.refreshToken },
      retryOn401: false
    });
    if (!res?.access_token) return false;
    setAccessToken(res.access_token);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  request,
  login,
  register,
  me,
  refreshAccessToken
};

export async function getAccounts(includeInactive = false) {
  return request<Account[]>("/api/v1/accounts/", { query: { include_inactive: includeInactive } });
}

export async function createAccount(body: { name: string; type: string; currency: string; opening_balance: number }) {
  return request<Account>("/api/v1/accounts/", { method: "POST", body });
}

export async function updateAccount(id: number, body: { name?: string; type?: string; currency?: string; is_active?: boolean }) {
  return request<Account>(`/api/v1/accounts/${id}`, { method: "PUT", body });
}

export async function archiveAccount(id: number) {
  return request<void>(`/api/v1/accounts/${id}`, { method: "DELETE" });
}

export async function getCategories(categoryType?: string, includeInactive = false) {
  return request<Category[]>("/api/v1/categories/", { query: { category_type: categoryType, include_inactive: includeInactive } });
}

export async function createCategory(body: { name: string; type: string }) {
  return request<Category>("/api/v1/categories/", { method: "POST", body });
}

export async function updateCategory(id: number, body: { name?: string; type?: string; is_active?: boolean }) {
  return request<Category>(`/api/v1/categories/${id}`, { method: "PUT", body });
}

export async function deleteCategory(id: number) {
  return request<void>(`/api/v1/categories/${id}`, { method: "DELETE" });
}

export async function getTransactions(filters: {
  from_date?: string;
  to_date?: string;
  account_id?: number;
  category_id?: number;
  type?: string;
  search?: string;
  tag_id?: number;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  limit?: number;
}) {
  return request<Paginated<Transaction>>("/api/v1/transactions/", { query: filters as any });
}

export async function getTransaction(id: number) {
  return request<Transaction>(`/api/v1/transactions/${id}`);
}

export async function createTransaction(body: Omit<Transaction, "id">) {
  return request<Transaction>("/api/v1/transactions/", { method: "POST", body });
}

export async function updateTransaction(id: number, body: Partial<Omit<Transaction, "id">>) {
  return request<Transaction>(`/api/v1/transactions/${id}`, { method: "PUT", body });
}

export async function deleteTransaction(id: number) {
  return request<void>(`/api/v1/transactions/${id}`, { method: "DELETE" });
}

export function exportTransactionsUrl(filters: {
  from_date?: string;
  to_date?: string;
  account_id?: number;
  category_id?: number;
  type?: string;
  search?: string;
  tag_id?: number;
  min_amount?: number;
  max_amount?: number;
}) {
  const params = new URLSearchParams();
  if (filters.from_date) params.set("from_date", filters.from_date);
  if (filters.to_date) params.set("to_date", filters.to_date);
  if (filters.account_id) params.set("account_id", String(filters.account_id));
  if (filters.category_id) params.set("category_id", String(filters.category_id));
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.tag_id) params.set("tag_id", String(filters.tag_id));
  if (filters.min_amount !== undefined) params.set("min_amount", String(filters.min_amount));
  if (filters.max_amount !== undefined) params.set("max_amount", String(filters.max_amount));

  const API_BASE =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.DEV ? "http://localhost:8000" : "");

  const qs = params.toString();
  return `${API_BASE}/api/v1/transactions/export${qs ? `?${qs}` : ""}`;
}

export function importTransactionsTemplateUrl() {
  const API_BASE =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.DEV ? "http://localhost:8000" : "");
  return `${API_BASE}/api/v1/transactions/import-template`;
}

export async function importTransactionsCsv(
  file: File,
  options: { mode?: "partial" | "all_or_nothing"; dry_run?: boolean; default_account_id?: number } = {}
) {
  const API_BASE =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.DEV ? "http://localhost:8000" : "");

  const params = new URLSearchParams();
  if (options.mode) params.set("mode", options.mode);
  if (options.dry_run) params.set("dry_run", "true");
  if (options.default_account_id) params.set("default_account_id", String(options.default_account_id));

  const url = `${API_BASE}/api/v1/transactions/import${params.toString() ? `?${params.toString()}` : ""}`;
  const tokens = getTokens();

  const form = new FormData();
  form.append("file", file);

  async function doFetch() {
    return fetch(url, {
      method: "POST",
      headers: {
        ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {})
      },
      body: form
    });
  }

  let res = await doFetch();
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const nextTokens = getTokens();
      res = await fetch(url, {
        method: "POST",
        headers: {
          ...(nextTokens ? { Authorization: `Bearer ${nextTokens.accessToken}` } : {})
        },
        body: form
      });
    }
  }

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as TransactionImportResponse;
}

export async function importTransactionsPdf(
  file: File,
  options: {
    default_account_id: number;
    pdf_password?: string;
    mode?: "partial" | "all_or_nothing";
    dry_run?: boolean;
  }
) {
  const API_BASE =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.DEV ? "http://localhost:8000" : "");

  const params = new URLSearchParams();
  params.set("default_account_id", String(options.default_account_id));
  if (options.mode) params.set("mode", options.mode);
  if (options.dry_run) params.set("dry_run", "true");

  const url = `${API_BASE}/api/v1/transactions/import-pdf${params.toString() ? `?${params.toString()}` : ""}`;
  const tokens = getTokens();

  const form = new FormData();
  form.append("file", file);
  if (options.pdf_password) form.append("pdf_password", options.pdf_password);

  async function doFetch() {
    return fetch(url, {
      method: "POST",
      headers: {
        ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {})
      },
      body: form
    });
  }

  let res = await doFetch();
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const nextTokens = getTokens();
      res = await fetch(url, {
        method: "POST",
        headers: {
          ...(nextTokens ? { Authorization: `Bearer ${nextTokens.accessToken}` } : {})
        },
        body: form
      });
    }
  }

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as TransactionImportResponse;
}

export async function getDashboardSummary() {
  return request<DashboardSummary>("/api/v1/dashboard/summary");
}

export async function getBudgets(monthIso?: string) {
  return request<any[]>("/api/v1/budgets/", { query: { month: monthIso, include_progress: true } });
}

export async function createBudget(body: { category_id: number; month: string; amount: number }) {
  return request<any>("/api/v1/budgets/", { method: "POST", body });
}

export async function updateBudget(id: number, body: { amount: number }) {
  return request<any>(`/api/v1/budgets/${id}`, { method: "PUT", body });
}

export async function deleteBudget(id: number) {
  return request<void>(`/api/v1/budgets/${id}`, { method: "DELETE" });
}

export async function getMonthlySummary(monthIso: string) {
  return request<any>("/api/v1/reports/monthly-summary", { query: { month: monthIso } });
}

export async function getCategoryExpense(monthIso: string) {
  return request<any>("/api/v1/reports/category-expense", { query: { month: monthIso } });
}

export async function getAccountBalances() {
  return request<any>("/api/v1/reports/account-balances");
}

export async function getCashflowSeries(filters: { from_date: string; to_date: string; bucket?: "day" | "month" }) {
  return request<any>("/api/v1/reports/cashflow-series", { query: filters as any });
}

export type Contact = {
  id: number;
  user_id: number;
  name: string;
  phone?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoanEntry = {
  id: number;
  user_id: number;
  loan_id: number;
  kind: "disbursement" | "repayment" | string;
  amount: string | number;
  occurred_at: string;
  note?: string | null;
  created_at: string;
};

export type Loan = {
  id: number;
  user_id: number;
  contact_id: number;
  direction: "lent" | "borrowed" | string;
  status: "open" | "closed" | string;
  title?: string | null;
  currency: string;
  interest_rate?: string | number | null;
  start_date: string;
  due_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  contact_name: string;
  total_disbursed: string | number;
  total_repaid: string | number;
  outstanding: string | number;
  last_activity_at?: string | null;
  entries?: LoanEntry[];
};

export async function getContacts(includeInactive = false) {
  return request<Contact[]>("/api/v1/contacts/", { query: { include_inactive: includeInactive } });
}

export async function createContact(body: { name: string; phone?: string; notes?: string }) {
  return request<Contact>("/api/v1/contacts/", { method: "POST", body });
}

export async function updateContact(id: number, body: { name?: string; phone?: string; notes?: string; is_active?: boolean }) {
  return request<Contact>(`/api/v1/contacts/${id}`, { method: "PUT", body });
}

export async function archiveContact(id: number) {
  return request<void>(`/api/v1/contacts/${id}`, { method: "DELETE" });
}

export async function getLoans(filters: {
  direction?: string;
  status?: string;
  contact_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return request<Paginated<Loan>>("/api/v1/loans/", { query: filters as any });
}

export async function getLoan(id: number) {
  return request<Loan>(`/api/v1/loans/${id}`);
}

export async function createLoan(body: {
  contact_id: number;
  direction: "lent" | "borrowed";
  title?: string;
  currency?: string;
  interest_rate?: string | number;
  start_date: string;
  due_date?: string;
  notes?: string;
  initial_amount: string | number;
  initial_occurred_at?: string;
  initial_note?: string;
}) {
  return request<Loan>("/api/v1/loans/", { method: "POST", body });
}

export async function updateLoan(id: number, body: Partial<Omit<Loan, "id" | "user_id" | "contact_name" | "total_disbursed" | "total_repaid" | "outstanding" | "entries">>) {
  return request<Loan>(`/api/v1/loans/${id}`, { method: "PUT", body });
}

export async function deleteLoan(id: number) {
  return request<void>(`/api/v1/loans/${id}`, { method: "DELETE" });
}

export async function getLoanEntries(loanId: number) {
  return request<LoanEntry[]>(`/api/v1/loans/${loanId}/entries`);
}

export async function addLoanEntry(loanId: number, body: { kind: "disbursement" | "repayment"; amount: string | number; occurred_at?: string; note?: string }) {
  return request<LoanEntry>(`/api/v1/loans/${loanId}/entries`, { method: "POST", body });
}

export async function deleteLoanEntry(loanId: number, entryId: number) {
  return request<void>(`/api/v1/loans/${loanId}/entries/${entryId}`, { method: "DELETE" });
}

// Recurring Transactions
export type RecurringTransaction = {
  id: number;
  user_id: number;
  account_id: number;
  category_id?: number | null;
  type: "income" | "expense" | "transfer";
  amount: string | number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  start_date: string;
  end_date?: string | null;
  next_occurrence: string;
  note?: string | null;
  reference?: string | null;
  transfer_account_id?: number | null;
  is_active: boolean;
  last_processed?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function getRecurringTransactions(includeInactive = false) {
  return request<{ items: RecurringTransaction[]; total: number }>("/api/v1/recurring/", {
    query: { include_inactive: includeInactive }
  });
}

export async function createRecurringTransaction(body: {
  account_id: number;
  category_id?: number;
  type: "income" | "expense" | "transfer";
  amount: number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  start_date: string;
  end_date?: string;
  note?: string;
  reference?: string;
  transfer_account_id?: number;
}) {
  return request<RecurringTransaction>("/api/v1/recurring/", { method: "POST", body });
}

export async function updateRecurringTransaction(id: number, body: Partial<Omit<RecurringTransaction, "id" | "user_id">>) {
  return request<RecurringTransaction>(`/api/v1/recurring/${id}`, { method: "PUT", body });
}

export async function deleteRecurringTransaction(id: number) {
  return request<void>(`/api/v1/recurring/${id}`, { method: "DELETE" });
}

export async function processRecurringTransactions() {
  return request<{ message: string; created_count: number }>("/api/v1/recurring/process", { method: "POST" });
}

// Tags
export type Tag = {
  id: number;
  user_id: number;
  name: string;
  color?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function getTags(search?: string) {
  return request<{ items: Tag[]; total: number }>("/api/v1/tags/", {
    query: search ? { search } : {}
  });
}

export async function createTag(body: { name: string; color?: string }) {
  return request<Tag>("/api/v1/tags/", { method: "POST", body });
}

export async function updateTag(id: number, body: { name?: string; color?: string }) {
  return request<Tag>(`/api/v1/tags/${id}`, { method: "PUT", body });
}

export async function deleteTag(id: number) {
  return request<void>(`/api/v1/tags/${id}`, { method: "DELETE" });
}

// Goals
export type Goal = {
  id: number;
  user_id: number;
  name: string;
  currency: string;
  target_amount: string | number;
  start_date: string;
  target_date?: string | null;
  note?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  saved_amount: string | number;
  remaining_amount: string | number;
  progress_pct: number;
  is_completed: boolean;
  contributions_count: number;
};

export type GoalContribution = {
  id: number;
  user_id: number;
  goal_id: number;
  amount: string | number;
  date: string;
  note?: string | null;
  created_at: string;
};

export async function getGoals(includeInactive = false) {
  return request<Goal[]>("/api/v1/goals/", { query: { include_inactive: includeInactive } });
}

export async function createGoal(body: {
  name: string;
  currency?: string;
  target_amount: number;
  start_date: string;
  target_date?: string;
  note?: string;
}) {
  return request<Goal>("/api/v1/goals/", { method: "POST", body });
}

export async function updateGoal(
  id: number,
  body: Partial<{
    name: string;
    currency: string;
    target_amount: number;
    start_date: string;
    target_date: string;
    note: string;
    is_active: boolean;
  }>
) {
  return request<Goal>(`/api/v1/goals/${id}`, { method: "PUT", body });
}

export async function deleteGoal(id: number) {
  return request<void>(`/api/v1/goals/${id}`, { method: "DELETE" });
}

export async function getGoalContributions(goalId: number) {
  return request<GoalContribution[]>(`/api/v1/goals/${goalId}/contributions`);
}

export async function addGoalContribution(goalId: number, body: { amount: number; date?: string; note?: string }) {
  return request<GoalContribution>(`/api/v1/goals/${goalId}/contributions`, { method: "POST", body });
}

export async function deleteGoalContribution(goalId: number, contributionId: number) {
  return request<void>(`/api/v1/goals/${goalId}/contributions/${contributionId}`, { method: "DELETE" });
}

// Password reset
export async function forgotPassword(email: string) {
  return request<{ message: string; reset_token?: string | null }>("/api/v1/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email }
  });
}

export async function resetPassword(body: { token: string; new_password: string }) {
  return request<{ message: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    auth: false,
    body
  });
}
