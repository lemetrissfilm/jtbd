import { describe, expect, it } from "vitest";
import { rehypeRussianTypography, typografy } from "./typography";

const NBSP = " ";

describe("typografy", () => {
  it("превращает прямые кавычки в ёлочки", () => {
    expect(typografy('Метафора "найма" — ключевая')).toBe(`Метафора «найма»${NBSP}— ключевая`);
    expect(typografy('"Я привык", — сказал он.')).toContain("«Я");
  });
  it("ставит неразрывный пробел после коротких слов и перед тире", () => {
    expect(typografy("Он пошёл в магазин и купил хлеб")).toBe(`Он пошёл в${NBSP}магазин и${NBSP}купил хлеб`);
    expect(typografy("Работа — это результат")).toBe(`Работа${NBSP}— это${NBSP}результат`);
    expect(typografy("Что-то не так")).toBe(`Что-то не${NBSP}так`);
  });
  it("не склеивает длинные слова и части слов", () => {
    expect(typografy("Заказ оформлен")).toBe("Заказ оформлен");
    expect(typografy("атака на сервис")).toBe(`атака на${NBSP}сервис`);
  });
  it("приклеивает частицы и единицы измерения", () => {
    expect(typografy("Он бы пришёл")).toBe(`Он${NBSP}бы пришёл`);
    expect(typografy("за 10 минут и 80 %")).toContain(`10${NBSP}минут`);
  });
  it("заменяет диапазоны и многоточие, не трогая даты", () => {
    expect(typografy("3-5 человек")).toBe(`3–5${NBSP}человек`);
    expect(typografy("2026-11-26")).toBe("2026-11-26");
    expect(typografy("и далее...")).toBe(`и${NBSP}далее…`);
  });
});

describe("rehypeRussianTypography", () => {
  it("обрабатывает текст, но пропускает код и формулы", () => {
    const tree = {
      type: "root",
      children: [
        { type: "element", tagName: "p", children: [{ type: "text", value: 'Метафора "найма"' }] },
        { type: "element", tagName: "code", children: [{ type: "text", value: 'x = "в доме"' }] },
        { type: "element", tagName: "span", properties: { className: ["katex"] }, children: [{ type: "text", value: "a - b" }] },
      ],
    };
    rehypeRussianTypography()(tree);
    expect(tree.children[0].children![0].value).toBe("Метафора «найма»");
    expect(tree.children[1].children![0].value).toBe('x = "в доме"');
    expect(tree.children[2].children![0].value).toBe("a - b");
  });
});
