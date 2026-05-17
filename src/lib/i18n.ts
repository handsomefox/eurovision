import type { Contest, Locale } from "../types";

export const LOCALE_STORAGE_KEY = "eurovision-ranker-locale";

export type TranslationKey =
  | "add.empty"
  | "add.heading"
  | "add.remaining"
  | "actions.add"
  | "actions.addNext"
  | "actions.cancel"
  | "actions.changeKey"
  | "actions.clear"
  | "actions.closeImport"
  | "actions.continue"
  | "actions.copyTop"
  | "actions.import"
  | "actions.openArtistWiki"
  | "actions.openSongWiki"
  | "actions.refresh"
  | "actions.replaceRanking"
  | "actions.topCopied"
  | "app.title"
  | "clipboard.empty"
  | "comparison.better"
  | "comparison.same"
  | "comparison.unranked"
  | "comparison.worse"
  | "confirm.clear"
  | "contest.choose"
  | "empty.body"
  | "empty.title"
  | "footer"
  | "header.headline"
  | "import.description"
  | "import.example"
  | "import.found"
  | "import.heading"
  | "import.unmatched"
  | "import.warning"
  | "key.description"
  | "key.label"
  | "key.placeholder"
  | "label.official"
  | "label.points"
  | "label.running"
  | "locale.english"
  | "locale.russian"
  | "mode.compare"
  | "mode.ranking"
  | "mode.results"
  | "next.label"
  | "photo.flag"
  | "placeholder.notice"
  | "progress.added"
  | "progress.photos"
  | "ranking.count"
  | "ranking.heading"
  | "ranking.pending"
  | "results.finalists"
  | "results.heading"
  | "save.loadError"
  | "save.loading"
  | "save.ready"
  | "save.saveError"
  | "save.saved"
  | "save.saving"
  | "summary.empty"
  | "summary.heading"
  | "update.body"
  | "update.heading";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    "add.empty": "All matching entries are already in your ranking.",
    "add.heading": "Add entry",
    "add.remaining": "remaining",
    "actions.add": "Add",
    "actions.addNext": "Add next",
    "actions.cancel": "Cancel",
    "actions.changeKey": "Change key",
    "actions.clear": "Clear",
    "actions.closeImport": "Close import",
    "actions.continue": "Continue",
    "actions.copyTop": "Copy top",
    "actions.import": "Import",
    "actions.openArtistWiki": "Open artist wiki",
    "actions.openSongWiki": "Open song wiki",
    "actions.refresh": "Refresh",
    "actions.replaceRanking": "Replace ranking",
    "actions.topCopied": "Top copied",
    "app.title": "Eurovision Ranker",
    "clipboard.empty": "Nobody is in the ranking yet.",
    "comparison.better": "higher",
    "comparison.same": "same",
    "comparison.unranked": "not in your ranking",
    "comparison.worse": "lower",
    "confirm.clear": "Clear the whole ranking?",
    "contest.choose": "Choose competition",
    "empty.body": "Add entries from the right, or use Add next as they perform.",
    "empty.title": "Ranking is empty",
    footer:
      "The ranking is saved on the server for the selected key and contest. Wiki buttons open pages directly. If no good photo is found, the flag fallback is shown.",
    "header.headline": "Build your ranking during the show",
    "import.description": 'Paste a numbered list in the format "country: artist - song".',
    "import.example": "1. Denmark: Sissal - Hallucination",
    "import.found": "Found",
    "import.heading": "Import ranking",
    "import.unmatched": "unmatched",
    "import.warning": "Check",
    "key.description":
      "Enter a personal key to load or save your ranking. This is not a login, just a shared secret for one ranking space.",
    "key.label": "Personal key",
    "key.placeholder": "for example: vienna-night",
    "label.official": "Official",
    "label.points": "pts",
    "label.running": "Running",
    "locale.english": "English",
    "locale.russian": "Russian",
    "mode.compare": "Compare",
    "mode.ranking": "My ranking",
    "mode.results": "Results",
    "next.label": "Next by running order:",
    "photo.flag": "flag",
    "placeholder.notice": "This is a placeholder contest: entry data will be updated in JSON as it appears.",
    "progress.added": "added",
    "progress.photos": "photos",
    "ranking.count": "in top",
    "ranking.heading": "My ranking",
    "ranking.pending": "waiting for first scores",
    "results.finalists": "finalists",
    "results.heading": "Official results",
    "save.loadError": "load error",
    "save.loading": "loading",
    "save.ready": "ready",
    "save.saveError": "save error",
    "save.saved": "saved",
    "save.saving": "saving",
    "summary.empty": "Empty for now",
    "summary.heading": "Current leader",
    "update.body": "Refresh the app to get the latest changes.",
    "update.heading": "A new version is ready"
  },
  ru: {
    "add.empty": "Все подходящие участники уже в рейтинге.",
    "add.heading": "Добавить участника",
    "add.remaining": "осталось",
    "actions.add": "Добавить",
    "actions.addNext": "Добавить следующего",
    "actions.cancel": "Отмена",
    "actions.changeKey": "Сменить ключ",
    "actions.clear": "Очистить",
    "actions.closeImport": "Закрыть импорт",
    "actions.continue": "Продолжить",
    "actions.copyTop": "Скопировать топ",
    "actions.import": "Импорт",
    "actions.openArtistWiki": "Открыть wiki артиста",
    "actions.openSongWiki": "Открыть wiki песни",
    "actions.refresh": "Обновить",
    "actions.replaceRanking": "Заменить рейтинг",
    "actions.topCopied": "Топ скопирован",
    "app.title": "Eurovision Ranker",
    "clipboard.empty": "Пока никого нет в рейтинге.",
    "comparison.better": "выше",
    "comparison.same": "так же",
    "comparison.unranked": "нет в твоем рейтинге",
    "comparison.worse": "ниже",
    "confirm.clear": "Очистить весь рейтинг?",
    "contest.choose": "Выбрать конкурс",
    "empty.body": 'Добавляй участников справа или кнопкой "Добавить следующего", когда они выступают.',
    "empty.title": "Рейтинг пустой",
    footer:
      "Рейтинг сохраняется на сервере для выбранного ключа и конкурса. Wiki-кнопки открывают страницы напрямую. Если фото не нашлось или оно сомнительное, показывается флаг-заглушка.",
    "header.headline": "Собирай рейтинг по ходу шоу",
    "import.description": 'Вставь нумерованный список в формате "страна: артист - песня".',
    "import.example": "1. Denmark: Sissal - Hallucination",
    "import.found": "Найдено",
    "import.heading": "Импорт рейтинга",
    "import.unmatched": "не распознано",
    "import.warning": "Проверь",
    "key.description":
      "Введи личный ключ, чтобы загрузить или сохранить свой рейтинг. Это не логин, а общий секрет для отдельного пространства рейтингов.",
    "key.label": "Личный ключ",
    "key.placeholder": "например: vienna-night",
    "label.official": "Официально",
    "label.points": "баллов",
    "label.running": "Очередь",
    "locale.english": "Английский",
    "locale.russian": "Русский",
    "mode.compare": "Сравнение",
    "mode.ranking": "Мой рейтинг",
    "mode.results": "Результаты",
    "next.label": "Следующий по running order:",
    "photo.flag": "флаг",
    "placeholder.notice": "Это placeholder-конкурс: данные участников будут обновляться в JSON по мере появления.",
    "progress.added": "добавлено",
    "progress.photos": "фото",
    "ranking.count": "в топе",
    "ranking.heading": "Мой рейтинг",
    "ranking.pending": "ждет первых оценок",
    "results.finalists": "финалистов",
    "results.heading": "Официальные результаты",
    "save.loadError": "ошибка загрузки",
    "save.loading": "загрузка",
    "save.ready": "готово",
    "save.saveError": "ошибка сохранения",
    "save.saved": "сохранено",
    "save.saving": "сохранение",
    "summary.empty": "Пока пусто",
    "summary.heading": "Сейчас в рейтинге",
    "update.body": "Обнови приложение, чтобы получить последние изменения.",
    "update.heading": "Новая версия готова"
  }
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ru";
}

export function getInitialLocale(
  storage: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage,
  languages: readonly string[] = typeof navigator === "undefined" ? [] : [navigator.language, ...navigator.languages]
): Locale {
  const savedLocale = storage?.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(savedLocale)) return savedLocale;

  return languages.some((language) => language.toLowerCase().startsWith("ru")) ? "ru" : "en";
}

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] || translations.en[key];
}

export function getLocalizedContest(contest: Contest, locale: Locale): Contest {
  if (locale === "en") return contest;

  const localized = contest.i18n?.[locale] ?? {};
  return { ...contest, ...localized };
}
