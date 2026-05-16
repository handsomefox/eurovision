import { KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";

type KeyGateProps = {
  onSubmit: (key: string) => void;
};

export default function KeyGate({ onSubmit }: KeyGateProps) {
  const [value, setValue] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextKey = value.trim();
    if (nextKey) onSubmit(nextKey);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 bg-[linear-gradient(135deg,#020617_0%,#111827_50%,#134e4a_100%)] text-white">
      <section className="relative mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
        <form
          onSubmit={submit}
          className="w-full rounded-[2rem] border border-white/10 bg-white/8 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7"
        >
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-0.012em] sm:text-4xl">Eurovision Ranker</h1>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Введи личный ключ, чтобы загрузить или сохранить свой рейтинг. Это не логин, а общий секрет для отдельного пространства
            рейтингов.
          </p>

          <label className="mt-6 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/45">Personal key</span>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoFocus
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60"
              placeholder="for example: vienna-night"
            />
          </label>

          <button
            type="submit"
            disabled={!value.trim()}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
