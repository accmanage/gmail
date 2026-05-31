import React from "react";
import ReactDOM from "react-dom/client";
import {
  Bell,
  Check,
  Copy,
  Heart,
  History,
  KeyRound,
  LifeBuoy,
  LogOut,
  Settings,
  ShieldCheck,
  Star,
  UserCircle2,
  Wifi
} from "lucide-react";
import { io } from "socket.io-client";
import { api } from "./api";
import { useAuth } from "./store";
import "./styles.css";

type Account = {
  accessId: number;
  email: string;
  password: string;
  poolName?: string;
  favorite: boolean;
  validUntil?: string | null;
  status: string;
};

function Login() {
  const login = useAuth((state) => state.login);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form
        className="glass w-full max-w-sm animate-rise rounded-[2rem] p-7"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await login(username, password);
          } catch (err: any) {
            setError(err.response?.data?.message ?? "Login failed");
          }
        }}
      >
        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-mint">Secure OTP</p>
          <h1 className="mt-3 font-display text-3xl font-bold">Your access vault</h1>
        </div>
        <input
          className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-mint"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-mint"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-4 rounded-xl bg-coral/20 px-4 py-2 text-sm text-red-100">{error}</p>}
        <button className="mt-5 w-full rounded-2xl bg-mint px-4 py-3 font-black text-night">Login</button>
      </form>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-3xl p-4">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function formatOtp(code: string) {
  if (!/^\d{6}$/.test(code)) return code;
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

function OtpModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const [code, setCode] = React.useState("------");
  const [remaining, setRemaining] = React.useState(30);
  const [copied, setCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const fetchOtp = React.useCallback(async () => {
    setLoading(true);
    const response = await api.post("/api/otp/generate", { accessId: account.accessId });
    setCode(response.data.data.code);
    setRemaining(response.data.data.remaining);
    setLoading(false);
  }, [account.accessId]);

  React.useEffect(() => {
    void fetchOtp();
    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          void fetchOtp();
          return 30;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [fetchOtp]);

  const progress = Math.max(6, (remaining / 30) * 100);
  const emailName = account.email.split("@")[0] || "Secure";
  const titleBadge = emailName.charAt(0).toUpperCase();
  const validityText = account.validUntil ? new Date(account.validUntil).toLocaleDateString() : "Lifetime";

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/65 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="otp-sheet w-full max-w-[24rem] animate-rise overflow-hidden rounded-[2rem] px-6 pb-7 pt-5 text-slate-700">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="mt-5 flex justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-500 text-xl font-black text-white shadow-[0_10px_28px_rgba(93,76,255,0.36)]">
            {titleBadge}
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              <UserCircle2 className="h-4 w-4" />
              User ID
            </div>
            <div className="flex items-center gap-2">
              <span className="max-w-[12rem] truncate text-sm font-bold text-slate-700">{account.email}</span>
              <button
                className="rounded-lg p-1 text-blue-500 transition hover:bg-blue-50"
                onClick={() => void navigator.clipboard.writeText(account.email)}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 py-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Pass</div>
            <div className="flex items-center gap-2">
              <span className="max-w-[12rem] truncate text-sm font-bold text-slate-700">{account.password}</span>
              <button
                className="rounded-lg p-1 text-blue-500 transition hover:bg-blue-50"
                onClick={() => void navigator.clipboard.writeText(account.password)}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Access</div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
              <span>{validityText}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600">
                {account.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[1.6rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          <p className="text-sm font-black uppercase tracking-[0.08em] text-slate-400">Verification Code</p>
          <div className={`mt-4 font-display text-5xl font-bold tracking-[0.22em] text-slate-800 transition ${loading ? "opacity-50" : "opacity-100"}`}>
            {formatOtp(code)}
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-sm font-medium text-slate-400">
            Refresh in <span className="font-black text-indigo-500">{remaining}s</span>
          </p>
          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-500">
            <Wifi className="h-4 w-4" />
            Active
          </div>
        </div>

        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-500 px-4 py-4 font-black text-white shadow-[0_14px_32px_rgba(79,70,229,0.32)] transition hover:-translate-y-0.5"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          {copied ? "Copied" : "Copy OTP"}
        </button>

        <button className="mt-6 block w-full text-center text-sm font-bold text-rose-400 transition hover:text-rose-500" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = React.useState({ assignedAccounts: 0, otpRequestsToday: 0, activeAccess: 0, expiringSoon: 0 });
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [history, setHistory] = React.useState<any[]>([]);
  const [modal, setModal] = React.useState<Account | null>(null);
  const [tab, setTab] = React.useState("accounts");
  const token = useAuth((state) => state.token);
  const logout = useAuth((state) => state.logout);

  const load = React.useCallback(() => {
    api.get("/api/me/dashboard").then((response) => setStats(response.data.data));
    api.get("/api/me/accounts").then((response) => setAccounts(response.data.data));
    api.get("/api/otp/history").then((response) => setHistory(response.data.data));
  }, []);

  React.useEffect(load, [load]);

  React.useEffect(() => {
    if (!token) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL ?? window.location.origin, { auth: { token }, withCredentials: true });
    const heartbeat = async () => {
      const battery = "getBattery" in navigator ? await (navigator as any).getBattery().then((b: any) => b.level).catch(() => null) : null;
      const payload = {
        device: navigator.userAgent,
        browser: navigator.userAgent,
        os: navigator.platform,
        battery,
        online: navigator.onLine,
        screen: `${window.screen.width}x${window.screen.height}`
      };
      socket.emit("heartbeat", payload);
      api.post("/api/tracking/heartbeat", payload).catch(() => undefined);
    };
    void heartbeat();
    const interval = window.setInterval(() => {
      void heartbeat();
    }, 5000);
    return () => {
      window.clearInterval(interval);
      socket.disconnect();
    };
  }, [token]);

  const nav = [
    ["accounts", KeyRound],
    ["history", History],
    ["favorites", Heart],
    ["notifications", Bell],
    ["settings", Settings],
    ["support", LifeBuoy]
  ] as const;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-mint">User Panel</p>
          <h1 className="font-display text-3xl font-bold">Access dashboard</h1>
        </div>
        <button className="rounded-2xl bg-white/10 p-3" onClick={logout}>
          <LogOut className="h-5 w-5" />
        </button>
      </header>
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Assigned Accounts" value={stats.assignedAccounts} />
        <Metric label="OTP Today" value={stats.otpRequestsToday} />
        <Metric label="Active Access" value={stats.activeAccess} />
        <Metric label="Expiring Soon" value={stats.expiringSoon} />
      </section>
      <section className="mt-6">
        {tab === "accounts" && (
          <div className="grid gap-3">
            {accounts.map((account) => (
              <article key={account.accessId} className="glass rounded-[1.75rem] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.09]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{account.email}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {account.validUntil ? `Valid until ${new Date(account.validUntil).toLocaleDateString()}` : "Lifetime access"} | {account.poolName ?? "No pool"}
                    </p>
                  </div>
                  <Star className={`h-5 w-5 ${account.favorite ? "fill-mint text-mint" : "text-slate-500"}`} />
                </div>
                <button
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-500 px-4 py-3 font-black text-white shadow-[0_14px_32px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5"
                  onClick={() => setModal(account)}
                >
                  <ShieldCheck className="h-5 w-5" /> Get OTP
                </button>
              </article>
            ))}
            {!accounts.length && <div className="glass rounded-3xl p-8 text-center text-slate-300">No assigned accounts yet.</div>}
          </div>
        )}
        {tab === "history" && (
          <div className="glass rounded-3xl p-4">
            {history.map((item) => (
              <div key={item.id} className="flex justify-between border-b border-white/10 py-3 text-sm">
                <span>{item.account.email}</span>
                <span className="text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "favorites" && (
          <div className="grid gap-3">
            {accounts.filter((a) => a.favorite).map((account) => (
              <article key={account.accessId} className="glass rounded-3xl p-4">
                {account.email}
              </article>
            ))}
          </div>
        )}
        {tab === "notifications" && (
          <Info
            title="Notifications"
            text="Telegram login, OTP, and expiry alerts are managed from preferences. WhatsApp delivery is provider-ready in the backend queue model."
          />
        )}
        {tab === "settings" && <SettingsPanel />}
        {tab === "support" && <Info title="Support" text="Contact your administrator with your username and assignment email if access expires or an OTP is not accepted." />}
      </section>
      <nav className="fixed inset-x-0 bottom-0 mx-auto grid max-w-5xl grid-cols-6 gap-1 border-t border-white/10 bg-night/90 px-3 py-3 backdrop-blur">
        {nav.map(([name, Icon]) => (
          <button
            key={name}
            className={`grid place-items-center rounded-2xl py-2 ${tab === name ? "bg-mint text-night" : "text-slate-300"}`}
            onClick={() => setTab(name)}
          >
            <Icon className="h-5 w-5" />
            <span className="mt-1 text-[10px] capitalize">{name}</span>
          </button>
        ))}
      </nav>
      {modal && (
        <OtpModal
          account={modal}
          onClose={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </main>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="glass rounded-3xl p-6">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-3 text-slate-300">{text}</p>
    </div>
  );
}

function SettingsPanel() {
  const [form, setForm] = React.useState({
    telegram_chat_id: "",
    notify_on_login: true,
    notify_on_expiry: true,
    notify_on_otp: false
  });
  const [saved, setSaved] = React.useState(false);
  return (
    <form
      className="glass rounded-3xl p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await api.post("/api/preferences/update", form);
        setSaved(true);
      }}
    >
      <h2 className="font-display text-2xl font-bold">Notification settings</h2>
      <input
        className="mt-4 w-full rounded-2xl bg-black/25 px-4 py-3"
        placeholder="Telegram chat ID"
        value={form.telegram_chat_id}
        onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
      />
      {(["notify_on_login", "notify_on_expiry", "notify_on_otp"] as const).map((key) => (
        <label key={key} className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <span>{key.replaceAll("_", " ")}</span>
          <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
        </label>
      ))}
      <button className="mt-5 w-full rounded-2xl bg-mint px-4 py-3 font-black text-night">Save preferences</button>
      {saved && <p className="mt-3 text-center text-sm text-mint">Saved</p>}
    </form>
  );
}

function App() {
  const token = useAuth((state) => state.token);
  return token ? <Dashboard /> : <Login />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
