"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAbsoluteUrl, getAppOrigin } from "@/lib/app-url";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Search, Activity } from "lucide-react";

type ActiveUserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  active_sessions: number;
  session_expires_at: string;
};

export default function AdminActiveUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<ActiveUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/admin/active-users", window.location.origin)
      if (q.trim()) url.searchParams.set("q", q.trim())
      const res = await fetch(url.toString(), { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load active users");
      const usersArray = Array.isArray(data.users) ? data.users : [];
      setUsers(usersArray);
      setTotal(Number(data.total ?? usersArray.length));
    } catch (e: any) {
      setError(e?.message || "Failed to load active users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[color:var(--marketing-accent)]" />
            <h2 className="text-xl font-semibold">Active Users</h2>
            <Badge variant="secondary">{total}</Badge>
          </div>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Search</CardTitle>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative w-full md:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, phone..."
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
              />
            </div>
            <Button onClick={load} disabled={loading}>
              Apply
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Session Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(users) || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No active users.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.first_name} {u.last_name}</TableCell>
                      <TableCell className="font-mono text-xs">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={String(u.role).toUpperCase() === "ADMIN" ? "default" : "secondary"}>
                          {String(u.role).toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(u.active_sessions || 0)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.session_expires_at ? new Date(u.session_expires_at).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

