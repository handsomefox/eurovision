import { describe, expect, it } from "vitest";
import { getInitialLocale, getLocalizedContest } from "../src/lib/i18n";
import type { Contest } from "../src/types";

const contest = {
  id: "test",
  year: 2026,
  family: "eurovision",
  region: "eu",
  label: "English label",
  title: "English title",
  badge: "English badge",
  status: "complete",
  description: "English description",
  sourceUrl: "https://example.com",
  i18n: {
    ru: {
      title: "Русский заголовок",
      description: "Русское описание"
    }
  },
  entries: []
} satisfies Contest;

describe("i18n", () => {
  it("uses saved locale before browser locale", () => {
    expect(getInitialLocale({ getItem: () => "en" }, ["ru-RU"])).toBe("en");
  });

  it("detects Russian browser locale", () => {
    expect(getInitialLocale({ getItem: () => null }, ["uk-UA", "ru-RU"])).toBe("ru");
  });

  it("defaults to English", () => {
    expect(getInitialLocale({ getItem: () => null }, ["uk-UA"])).toBe("en");
  });

  it("falls back to top-level contest text when localized fields are missing", () => {
    expect(getLocalizedContest(contest, "ru")).toMatchObject({
      label: "English label",
      title: "Русский заголовок",
      badge: "English badge",
      description: "Русское описание"
    });
  });
});
