# Frontend tasks: fin-plan

<!-- spec: mandatory-payments -->

## 1. Типы (`src/lib/types.ts`)

Добавить:
```typescript
export type MandatoryPaymentRecurrence =
  | "daily" | "weekly" | "monthly"
  | "quarterly" | "semi_annual" | "yearly";

export type MandatoryPayment = {
  id: number;
  title: string;
  amount: number;        // копейки
  tag: TransactionTag;
  recurrence: MandatoryPaymentRecurrence;
  next_payment_date: string; // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
};

export type CreateMandatoryPaymentInput = {
  title: string;
  amount: number;        // копейки
  tag_id: number;
  recurrence: MandatoryPaymentRecurrence;
  next_payment_date: string;
};
```

---

## 2. API-функции (`src/lib/api.ts`)

Добавить:
```typescript
export function fetchMandatoryPayments() {
  return apiClient<DataResponse<MandatoryPayment[]>>("/api/v1/mandatory-payments");
}
export function createMandatoryPayment(body: CreateMandatoryPaymentInput) {
  return apiClient<DataResponse<MandatoryPayment>>("/api/v1/mandatory-payments", {
    method: "POST", body,
  });
}
export function updateMandatoryPayment(id: number, body: CreateMandatoryPaymentInput) {
  return apiClient<DataResponse<MandatoryPayment>>(`/api/v1/mandatory-payments/${id}`, {
    method: "PUT", body,
  });
}
export function deleteMandatoryPayment(id: number) {
  return apiClient<void>(`/api/v1/mandatory-payments/${id}`, { method: "DELETE" });
}
export function duplicateMandatoryPayment(id: number) {
  return apiClient<DataResponse<MandatoryPayment>>(
    `/api/v1/mandatory-payments/${id}/duplicate`, { method: "POST" }
  );
}
export function markMandatoryPaymentPaid(id: number) {
  return apiClient<DataResponse<MandatoryPayment>>(
    `/api/v1/mandatory-payments/${id}/mark-paid`, { method: "POST" }
  );
}
```

---

## 3. Утилита подсветки даты (`src/lib/mandatory-payments.ts`)

Создать новый файл:
```typescript
export type DateHighlight = "warn" | "normal";

export function getDateHighlight(dateStr: string): DateHighlight {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diffDays >= 0 && diffDays <= 3) return "warn";
  return "normal";
}

export const RECURRENCE_LABELS: Record<string, string> = {
  daily:       "Ежедневно",
  weekly:      "Еженедельно",
  monthly:     "Ежемесячно",
  quarterly:   "Ежеквартально",
  semi_annual: "Раз в полгода",
  yearly:      "Ежегодно",
};
```

---

## 4. Sheet формы (`src/features/mandatory-payments/components/MandatoryPaymentSheet.tsx`)

Создать файл. Аналогично `TransactionFormSheet`, но без переключателя Расход/Доход, без комментария и ссылки.

Поля:
- `title` — `<Input placeholder="Наименование" />`
- `amount` — `<Input placeholder="Сумма" />` (parseRublesInput при сохранении)
- `tagId` — `<TagFormPicker tags={...} value={tagId} onChange={setTagId} />`
- `recurrence` — `<Select>` с 6 вариантами из `RECURRENCE_LABELS`
- `nextPaymentDate` — `<Input type="date" />`

Состояние:
```typescript
const [title, setTitle] = useState("");
const [amount, setAmount] = useState("");
const [tagId, setTagId] = useState("");
const [recurrence, setRecurrence] = useState<MandatoryPaymentRecurrence>("monthly");
const [nextPaymentDate, setNextPaymentDate] = useState(new Date().toISOString().slice(0, 10));
const [formError, setFormError] = useState<string | null>(null);
```

Валидация (клиентская):
- title не пустой
- amount > 0
- tagId выбран
- nextPaymentDate заполнен

`saveMutation` — `createMandatoryPayment` или `updateMandatoryPayment` в зависимости от `payment: MandatoryPayment | null`.

Кнопки: «Сохранить» + «Сохранить и ещё» (только при создании, аналогично `TransactionFormSheet`).

При успехе: `onSaved()` + инвалидация `["mandatory-payments"]`.

---

## 5. Страница (`src/features/mandatory-payments/pages/MandatoryPaymentsPage.tsx`)

Заменить заглушку полной реализацией.

### 5.1 Структура компонента

```typescript
export function MandatoryPaymentsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MandatoryPayment | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mandatory-payments"],
    queryFn: async () => (await fetchMandatoryPayments()).data,
  });

  // ... mutations (delete, duplicate, markPaid)
  // ... columns
  // ... render
}
```

### 5.2 Колонки таблицы

Определить `columns: ColumnDef<MandatoryPayment>[]`:

| id | header | cell |
|---|---|---|
| `title` | Наименование | `row.original.title` |
| `amount` | Сумма | `formatKopecks(row.original.amount) + " ₽"` (цвет `text-[hsl(var(--expense))]`) |
| `tag` | Категория | `<TagPills tag={row.original.tag} />` |
| `recurrence` | Периодичность | `RECURRENCE_LABELS[row.original.recurrence]` |
| `next_payment_date` | Дата платежа | условный `cn(...)`: `getDateHighlight === "warn"` → `"rounded-md px-2 py-0.5 bg-amber-50 text-amber-700 font-medium"`, иначе обычный текст |
| `paid` | — (чекбокс) | `<input type="checkbox" checked={false} onChange={() => markPaidMutation.mutate(row.original.id)} />` |
| `actions` | — | Dropdown: Редактировать / Дублировать / Удалить |

### 5.3 Mutations

```typescript
const markPaidMutation = useMutation({
  mutationFn: (id: number) => markMandatoryPaymentPaid(id),
  onSuccess: (res) => {
    qc.setQueryData<MandatoryPayment[]>(["mandatory-payments"], (old) =>
      old?.map((p) => (p.id === res.data.id ? res.data : p)) ?? []
    );
  },
});

const deleteMutation = useMutation({
  mutationFn: (id: number) => deleteMandatoryPayment(id),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["mandatory-payments"] }),
});

const duplicateMutation = useMutation({
  mutationFn: (id: number) => duplicateMandatoryPayment(id),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["mandatory-payments"] }),
});
```

### 5.4 Рендер

```tsx
return (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="page-title">Обязательные платежи</h1>
        <p className="page-subtitle">Регулярные платежи и подписки</p>
      </div>
      <Button className="rounded-xl" onClick={() => { setEditing(null); setSheetOpen(true); }}>
        + Добавить
      </Button>
    </div>

    <div className="surface-card p-1 overflow-hidden">
      {isLoading ? (/* skeleton */) : isError ? (/* ошибка */) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4 text-lg">Нет платежей</p>
          <Button onClick={() => setSheetOpen(true)}>Добавить первый платёж</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>

    <MandatoryPaymentSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      payment={editing}
      onSaved={() => {
        qc.invalidateQueries({ queryKey: ["mandatory-payments"] });
        setSheetOpen(false);
      }}
    />
  </div>
);
```

---

## 6. Навигация (`src/components/layout/AppLayout.tsx`)

Пункт «Обязательные платежи» уже должен присутствовать в `navItems`. Проверить:
- путь: `/mandatory-payments`
- иконка: `CalendarClock` из lucide-react
- label: `"Обязательные"` (или сокращённо)

Если пункта нет — добавить.

---

## 7. Тест (`tests/mandatory-payments.test.ts`)

```typescript
import { describe, it, expect } from "vitest";
import { getDateHighlight } from "../src/lib/mandatory-payments";

describe("getDateHighlight", () => {
  function dateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  it("сегодня → warn", () => expect(getDateHighlight(dateOffset(0))).toBe("warn"));
  it("через 1 день → warn", () => expect(getDateHighlight(dateOffset(1))).toBe("warn"));
  it("через 3 дня → warn", () => expect(getDateHighlight(dateOffset(3))).toBe("warn"));
  it("через 4 дня → normal", () => expect(getDateHighlight(dateOffset(4))).toBe("normal"));
  it("вчера → normal", () => expect(getDateHighlight(dateOffset(-1))).toBe("normal"));
  it("неделю назад → normal", () => expect(getDateHighlight(dateOffset(-7))).toBe("normal"));
});
```
