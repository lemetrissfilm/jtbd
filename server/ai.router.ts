import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load book content once at startup
let bookContent: string;
try {
  bookContent = readFileSync(resolve(__dirname, "book_content.md"), "utf-8");
} catch {
  bookContent = "Книга Synthetic JTBD — методология объединяющая Jobs to Be Done с AI для исследования пользователей.";
}

// Truncate to ~80k chars to fit in context window
const BOOK_CONTEXT = bookContent.length > 80000 ? bookContent.slice(0, 80000) + "\n\n[...контент обрезан для экономии токенов]" : bookContent;

const BOOK_SYSTEM_PROMPT = `Ты — эксперт по методологии Synthetic JTBD (Jobs to Be Done с AI). 
Ты помогаешь читателям книги "Synthetic JTBD" разобраться в методологии.
Отвечай на русском языке, структурированно и по делу.
Ссылайся на конкретные главы и концепции из книги, когда это уместно.

Вот полное содержание книги для контекста:

---
${BOOK_CONTEXT}
---

Отвечай только на вопросы связанные с JTBD, UX-исследованиями, продуктовым дизайном и методологией из этой книги.
Если вопрос не по теме — вежливо перенаправь к теме книги.`;

const TRAINER_SYSTEM_PROMPT = `Ты — строгий, но доброжелательный ментор по методологии Synthetic JTBD.
Твоя задача — проверять артефакты UX-исследований и давать конструктивную обратную связь.

Вот содержание книги для эталонного сравнения:

---
${BOOK_CONTEXT}
---

При проверке артефакта:
1. Определи тип артефакта
2. Оцени по критериям методологии (1-10 по каждому критерию)
3. Укажи конкретные сильные стороны
4. Укажи конкретные слабые стороны с примерами исправлений
5. Дай итоговую оценку и рекомендации

Специальные критерии для Job Chain:
- Правильно ли размечены джобы по трём типам: основной / налоговый / лишний?
- Указаны ли критерии выполнения (desired outcomes) для каждого шага?
- Есть ли в цепочке налоговые джобы? Правильно ли они идентифицированы?
- Есть ли лишние джобы, которых не должно быть в идеальном сценарии?
- Связана ли цепочка с конкретным Context Canvas (Kто, Когда, Где, Зачем)?
- Можно ли из налоговых джобов вывести инновационные возможности для продукта?

Специальные критерии для Opportunity Score:
- Правильно ли применена формула: OS = Важность + max(Важность − Удовлетворённость, 0)?
  Пример расчёта: Важность=8, Удовлетворённость=3 → OS = 8 + (8-3) = 13. Если удовлетворённость выше важности — прибавка равна 0.
- Соответствуют ли пороговые значения методологии: OS > 15 = критический приоритет, OS 10–15 = высокий, OS < 10 = низкий?
- Взяты ли все работы из Job Chain конкретного персонажа (не придуманы произвольно)?
- Обоснованы ли оценки важности и удовлетворённости (есть ли ссылка на данные, интервью или Context Canvas)?
- Соответствует ли итоговый вывод о приоритетах числовым значениям OS в таблице?
- Есть ли связь с Context Canvas: указан ли контекст (триггер, дедлайн, ситуация), из которого взяты работы?
- Представлены ли результаты в виде таблицы с колонками: Работа, Важность, Удовлетворённость, OS, Приоритет?

Будь конкретным, давай примеры улучшений. Используй русский язык.`;


const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const aiRouter = router({
  // Chat endpoint - ask questions about the book
  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(MessageSchema),
      })
    )
    .mutation(async ({ input }) => {
      const messages = [
        { role: "system" as const, content: BOOK_SYSTEM_PROMPT },
        ...input.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const response = await invokeLLM({ messages });
      const content = response.choices?.[0]?.message?.content ?? "Извините, не удалось получить ответ.";
      return { content };
    }),

  // Generate a fresh example artifact for the trainer
  generateExample: publicProcedure
    .input(
      z.object({
        artifactType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const typeLabels: Record<string, string> = {
        job_story: "Job Story",
        job_chain: "Job Chain",
        jtbd_statement: "JTBD Statement",
        synthetic_persona: "Синтетический персонаж",
        interview_guide: "Гайд для интервью",
        job_map: "Job Map",
        opportunity_score: "Opportunity Score",
        other: "Артефакт",
      };
      const label = typeLabels[input.artifactType] || input.artifactType;
      const prompt = `Сгенерируй реалистичный пример артефакта типа «${label}» по методологии Synthetic JTBD.
Каждый раз придумывай новый контекст: другой продукт, другого персонажа, другую ситуацию.
Выбери случайный домен из: финтех, edtech, healthtech, e-commerce, B2B SaaS, медиа, транспорт, HR-tech.
Верни только сам артефакт без пояснений и без заголовка «Пример:».
Артефакт должен быть реалистичным, детальным и соответствовать критериям методологии.`;

      const response = await invokeLLM({
        messages: [
          { role: "system" as const, content: TRAINER_SYSTEM_PROMPT },
          { role: "user" as const, content: prompt },
        ],
      });
      const content = response.choices?.[0]?.message?.content ?? "";
      return { content };
    }),

  // Trainer endpoint - evaluate JTBD artifacts
  evaluate: publicProcedure
    .input(
      z.object({
        artifact: z.string().min(10, "Артефакт слишком короткий"),
        artifactType: z.string().optional(),
        messages: z.array(MessageSchema).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const userMessage = input.messages && input.messages.length > 0
        ? input.messages[input.messages.length - 1].content
        : `Проверь этот артефакт${input.artifactType ? ` (тип: ${input.artifactType})` : ""}:\n\n${input.artifact}`;

      const conversationHistory = input.messages && input.messages.length > 1
        ? input.messages.slice(0, -1).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        : [];

      const messages = [
        { role: "system" as const, content: TRAINER_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user" as const, content: userMessage },
      ];

      const response = await invokeLLM({ messages });
      const content = response.choices?.[0]?.message?.content ?? "Извините, не удалось получить оценку.";
      return { content };
    }),
});
