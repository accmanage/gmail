import React from "react";
import ReactDOM from "react-dom/client";
import { BarChart3, Boxes, KeyRound, ShieldCheck, Users, Waves } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, BarChart, Bar } from "recharts";
import Papa from "papaparse";
import { api } from "./api";
import { useAuth } from "./store";
import { createAdminSocket } from "./socket";
import "./styles.css";

type StatsResponse = {
  cards: Record<string, number>;
  dailyOtp: { date: string; count: number }[];
  recentActivity: any[];
};

function Login() {
  const login = useAuth((state) => state.login);
  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("ChangeMe123!");
  const [error, setError] = React.useState("");

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 shadow-glow backdrop-blur"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await login(username, password);
          } catch (err: any) {
            setError(err.response?.data?.message ?? "Login failed");
          }
        }}
      >
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-aurora">Secure Admin</p>
          <h1 className="mt-3 font-display text-4xl font-bold">2FA inventory command deck</h1>
        </div>
        <label className="text-sm text-slate-300">Username</label>
        <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-aurora" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label className="mt-5 block text-sm text-slate-300">Password</label>
        <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-aurora" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p>}
        <button className="mt-6 w-full rounded-2xl bg-aurora px-4 py-3 font-bold text-ink shadow-glow">Enter admin panel</button>
      </form>
    </main>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className="h-5 w-5 text-aurora" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = React.useState<StatsResponse | null>(null);
  const [liveUsers, setLiveUsers] = React.useState<any[]>([]);
  const token = useAuth((state) => state.token);

  React.useEffect(() => {
    api.get("/api/dashboard/stats").then((response) => setStats(response.data.data));
  }, []);

  React.useEffect(() => {
    if (!token) return;
    const socket = createAdminSocket(token);
    socket.on("live-users", setLiveUsers);
    socket.on("activity:new", () => api.get("/api/dashboard/stats").then((response) => setStats(response.data.data)));
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const cards = stats?.cards ?? {};
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-aurora">Realtime cockpit</p>
        <h1 className="font-display text-4xl font-bold">Inventory, access, and OTP pulse</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={cards.totalUsers ?? 0} icon={Users} />
        <StatCard label="Total Inventory" value={cards.totalInventory ?? 0} icon={Boxes} />
        <StatCard label="Active Assignments" value={cards.activeAssignments ?? 0} icon={ShieldCheck} />
        <StatCard label="OTP Requests Today" value={cards.otpRequestsToday ?? 0} icon={KeyRound} />
        <StatCard label="Live Users" value={liveUsers.length || cards.liveUsers || 0} icon={Waves} />
        <StatCard label="Expiring Access" value={cards.expiringAccess ?? 0} icon={BarChart3} />
        <StatCard label="Available Accounts" value={cards.availableAccounts ?? 0} icon={Boxes} />
        <StatCard label="Used Accounts" value={cards.usedAccounts ?? 0} icon={ShieldCheck} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
          <h2 className="font-display text-xl font-bold">Daily OTP usage</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyOtp ?? []}>
                <XAxis dataKey="date" stroke="#8fb7c5" />
                <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(255,255,255,.12)" }} />
                <Area type="monotone" dataKey="count" stroke="#50e3c2" fill="#50e3c244" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
          <h2 className="font-display text-xl font-bold">Assignment stats</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: "Available", count: cards.availableAccounts ?? 0 }, { name: "Used", count: cards.usedAccounts ?? 0 }]}>
                <XAxis dataKey="name" stroke="#8fb7c5" />
                <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(255,255,255,.12)" }} />
                <Bar dataKey="count" fill="#ffb86b" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
        <h2 className="font-display text-xl font-bold">Live activity feed</h2>
        <div className="mt-4 grid gap-3">
          {(stats?.recentActivity ?? []).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between rounded-2xl bg-black/20 px-4 py-3 text-sm">
              <span>{item.user?.username ?? "System"}: {item.action}</span>
              <span className="text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({ username: "", password: "", role: "user", validity_days: 30 });
  const load = () => api.get("/api/users").then((response) => setUsers(response.data.data));
  React.useEffect(() => {
    void load();
  }, []);
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
      <h2 className="font-display text-2xl font-bold">User management</h2>
      <form className="mt-5 grid gap-3 md:grid-cols-5" onSubmit={async (e) => { e.preventDefault(); await api.post("/api/users", { ...form, is_active: true, auto_assign_enabled: false }); setForm({ ...form, username: "", password: "" }); load(); }}>
        <input className="rounded-xl bg-black/30 px-3 py-2" placeholder="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="rounded-xl bg-black/30 px-3 py-2" placeholder="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="rounded-xl bg-black/30 px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">user</option><option value="reseller">reseller</option><option value="admin">admin</option><option value="super_admin">super_admin</option>
        </select>
        <input className="rounded-xl bg-black/30 px-3 py-2" type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: Number(e.target.value) })} />
        <button className="rounded-xl bg-aurora px-4 py-2 font-bold text-ink">Add user</button>
      </form>
      <table className="data-table mt-6 w-full min-w-[700px]">
        <thead><tr><th>User</th><th>Role</th><th>Active</th><th>Assignments</th><th>Sessions</th><th>Action</th></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id}><td>{u.username}</td><td>{u.role}</td><td>{String(u.isActive)}</td><td>{u._count.assignments}</td><td>{u._count.sessions}</td><td><button className="text-red-300" onClick={() => api.delete(`/api/users/${u.id}`).then(load)}>Delete</button></td></tr>)}</tbody>
      </table>
    </section>
  );
}

function InventoryPanel() {
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [csv, setCsv] = React.useState("");
  const [form, setForm] = React.useState({ email: "", password: "", app_password: "", secret_key: "", pool_name: "Fresh Accounts" });
  const load = () => api.get("/api/accounts").then((response) => setAccounts(response.data.data));
  React.useEffect(() => {
    void load();
  }, []);
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Inventory management</h2>
        <a className="rounded-xl border border-white/10 px-4 py-2 text-sm" href="/api/accounts/export">Export CSV</a>
      </div>
      <form className="mt-6 grid gap-4 lg:grid-cols-5" onSubmit={async (e) => { e.preventDefault(); await api.post("/api/accounts", form); setForm({ ...form, email: "", password: "", secret_key: "" }); load(); }}>
        {(["email", "password", "secret_key", "pool_name"] as const).map((key) => <input key={key} className="rounded-xl bg-black/30 px-3 py-2" placeholder={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
        <button className="rounded-xl bg-aurora px-4 py-2 font-bold text-ink">Add</button>
      </form>
      <div className="overflow-x-auto">
        <table className="data-table mt-6 w-full min-w-[900px]">
          <thead><tr><th>Email</th><th>Pool</th><th>Status</th><th>Favorite</th><th>Assigned To</th><th>Action</th></tr></thead>
          <tbody>{accounts.map((a) => <tr key={a.id}><td>{a.email}</td><td>{a.pool?.name ?? "-"}</td><td>{a.status}</td><td>{String(a.favorite)}</td><td>{a.assignments?.[0]?.user?.username ?? "-"}</td><td><button className="text-red-300" onClick={() => api.delete(`/api/accounts/${a.id}`).then(load)}>Delete</button></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function AccessPanel() {
  const [users, setUsers] = React.useState([]);
  const [accounts, setAccounts] = React.useState([]);

  const [selectedUser, setSelectedUser] = React.useState("");
  const [selectedAccounts, setSelectedAccounts] = React.useState<number[]>([]);

  React.useEffect(() => {
    fetchUsers();
    fetchAccounts();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get("/api/users");
      setUsers(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchAccounts() {
    try {
      const res = await api.get("/api/accounts");
      setAccounts(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api.post("/api/access/assign", {
        user_id: Number(selectedUser),
        account_ids: selectedAccounts,
        lifetime: true
      });

      alert("Access assigned successfully");

      setSelectedUser("");
      setSelectedAccounts([]);
    } catch (err) {
      console.error(err);
      alert("Assignment failed");
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
      <h2 className="font-display text-2xl font-bold">
        Access Control
      </h2>

      <form
        className="mt-5 grid gap-4"
        onSubmit={handleAssign}
      >
        {/* USER DROPDOWN */}
        <select
          className="rounded-xl bg-black/30 px-3 py-2"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          required
        >
          <option value="">Select User</option>

          {users.map((user: any) => (
            <option key={user.id} value={user.id}>
              #{user.id} - {user.username}
            </option>
          ))}
        </select>

        {/* ACCOUNT MULTI SELECT */}
        <select
          multiple
          className="rounded-xl bg-black/30 px-3 py-2 min-h-[200px]"
          onChange={(e) => {
            const values = Array.from(
              e.target.selectedOptions,
              (option) => Number(option.value)
            );

            setSelectedAccounts(values);
          }}
        >
          {accounts.map((account: any) => (
            <option key={account.id} value={account.id}>
              #{account.id} - {account.email}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-xl bg-aurora px-4 py-2 font-bold text-ink"
        >
          Assign Lifetime Access
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-400">
        Select one user and multiple accounts.
      </p>
    </section>
  );
}

function App() {
  const token = useAuth((state) => state.token);
  const logout = useAuth((state) => state.logout);
  const [tab, setTab] = React.useState("dashboard");
  if (!token) return <Login />;
  const nav = ["dashboard", "users", "inventory", "access"];
  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-white/10 bg-black/20 p-5 backdrop-blur">
        <h1 className="font-display text-2xl font-bold">Secure Admin</h1>
        <p className="mt-2 text-sm text-slate-400">2FA Inventory & OTP Access</p>
        <nav className="mt-8 grid gap-2">
          {nav.map((item) => <button key={item} className={`rounded-2xl px-4 py-3 text-left capitalize ${tab === item ? "bg-aurora text-ink" : "bg-white/[0.04] text-slate-200"}`} onClick={() => setTab(item)}>{item}</button>)}
        </nav>
        <button className="mt-8 text-sm text-red-200" onClick={logout}>Logout</button>
      </aside>
      <main className="overflow-x-hidden p-5 lg:p-8">{tab === "dashboard" && <Dashboard />}{tab === "users" && <UsersPanel />}{tab === "inventory" && <InventoryPanel />}{tab === "access" && <AccessPanel />}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
