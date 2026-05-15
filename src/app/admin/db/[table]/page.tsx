"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAbsoluteUrl } from "@/lib/app-url";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, RefreshCw, Search, Trash2, Edit } from "lucide-react";

type ColumnMeta = {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
};

type MetaResponse = {
  success: boolean;
  table: string;
  primaryKeys: string[];
  columns: ColumnMeta[];
  error?: string;
};

type RowsResponse = {
  success: boolean;
  table: string;
  primaryKeys: string[];
  columns: ColumnMeta[];
  pagination: { limit: number; offset: number; total: number };
  rows: any[];
  error?: string;
};

function isLargeValue(v: any) {
  if (v == null) return false;
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 120;
}

function stringifyCell(v: any) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default function AdminTableManager() {
  const params = useParams<{ table: string }>();
  const table = params.table;

  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [data, setData] = useState<RowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const limit = 25;

  const pk = meta?.primaryKeys?.[0] || data?.primaryKeys?.[0] || null;

  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const columns = Array.isArray(meta?.columns) ? meta.columns : (Array.isArray(data?.columns) ? data.columns : []);

  const selectionSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  async function loadMeta() {
    const res = await fetch(`/api/admin/db/${table}/meta`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = (await res.json()) as MetaResponse;
    if (!json.success) throw new Error(json.error || "Failed to load table metadata");
    setMeta(json);
  }

  async function loadRows(nextPage = page, nextQ = q) {
    const offset = nextPage * limit;
    const url = new URL(getAbsoluteUrl(`/api/admin/db/${table}`), getAppOrigin());
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    if (nextQ.trim()) url.searchParams.set("q", nextQ.trim());

    const res = await fetch(url.toString(), {
      credentials: "include",
      cache: "no-store",
    });
    const json = (await res.json()) as RowsResponse;
    if (!json.success) throw new Error(json.error || "Failed to load rows");
    const rowsArray = Array.isArray(json.rows) ? json.rows : [];
    setData({ ...json, rows: rowsArray });
  }

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      await loadMeta();
      await loadRows(0, q);
      setPage(0);
      setSelectedIds([]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function getRowId(row: any): string | null {
    if (!pk) return null;
    const v = row?.[pk];
    if (v == null) return null;
    return String(v);
  }

  function toggleAll() {
    if (!pk) return;
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => String(r[pk])));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function applySearch() {
    setLoading(true);
    setError(null);
    try {
      await loadRows(0, q);
      setPage(0);
      setSelectedIds([]);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function bulkDelete() {
    if (!selectedIds.length) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/db/${table}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      await loadRows(page, q);
      setSelectedIds([]);
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function createRecord(payload: Record<string, any>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/db/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: payload }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Create failed");
      await loadRows(0, q);
      setPage(0);
    } catch (e: any) {
      setError(e?.message || "Create failed");
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function updateRecord(id: string, payload: Record<string, any>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/db/${table}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, data: payload }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Update failed");
      await loadRows(page, q);
    } catch (e: any) {
      setError(e?.message || "Update failed");
      throw e;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/db">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tables
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-semibold font-mono">{table}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{total} records</span>
              {pk ? <Badge variant="secondary">PK: {pk}</Badge> : <Badge variant="destructive">No PK</Badge>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
            />
          </div>
          <Button variant="outline" onClick={applySearch} disabled={loading}>
            Search
          </Button>
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <CreateEditDialog
            mode="create"
            columns={columns}
            saving={saving}
            onSubmit={createRecord}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </CreateEditDialog>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Records</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                onClick={bulkDelete}
                disabled={saving || selectedIds.length === 0 || !pk}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Select rows for bulk actions. Click Edit to update a record.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[480px] sm:min-w-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44px]">
                    <Checkbox
                        checked={pk !== null && selectedIds.length > 0 && selectedIds.length === rows.length}
                      onCheckedChange={toggleAll}
                      disabled={!pk || rows.length === 0}
                    />
                  </TableHead>
                  {(columns.slice(0, 8) || []).map((c, idx) => (
                    <TableHead key={`col-${idx}-${c.name}`} className="whitespace-nowrap">
                      <span className="font-mono text-xs">{c.name}</span>
                    </TableHead>
                  ))}
                  {columns.length > 8 && <TableHead className="whitespace-nowrap">…</TableHead>}
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : !Array.isArray(rows) || rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const id = getRowId(row);
                    const checked = id ? selectionSet.has(id) : false;
                    return (
                      <TableRow key={id || JSON.stringify(row)}>
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => id && toggleOne(id)}
                            disabled={!id}
                          />
                        </TableCell>
                        {columns.slice(0, 8).map((c, idx) => {
                          const v = row?.[c.name];
                          const s = stringifyCell(v);
                          return (
                            <TableCell key={`cell-${idx}-${c.name}`} className="max-w-[240px]">
                              {isLargeValue(v) ? (
                                <span className="font-mono text-xs text-muted-foreground">{s.slice(0, 120)}…</span>
                              ) : (
                                <span className="font-mono text-xs">{s}</span>
                              )}
                            </TableCell>
                          );
                        })}
                        {columns.length > 8 && <TableCell className="text-muted-foreground">…</TableCell>}
                        <TableCell>
                          <div className="flex gap-2">
                            <CreateEditDialog
                              mode="edit"
                              columns={columns}
                              initialValue={row}
                              saving={saving}
                              disabled={!id}
                              onSubmit={(payload) => updateRecord(String(id), payload)}
                            >
                              <Button size="sm" variant="outline" disabled={!id}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </CreateEditDialog>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!id || saving}
                              onClick={async () => {
                                if (!id) return;
                                setSelectedIds([id]);
                                await bulkDelete();
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={loading || page <= 0}
                onClick={async () => {
                  const next = Math.max(0, page - 1);
                  setPage(next);
                  setLoading(true);
                  try {
                    await loadRows(next, q);
                    setSelectedIds([]);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                disabled={loading || page >= totalPages - 1}
                onClick={async () => {
                  const next = Math.min(totalPages - 1, page + 1);
                  setPage(next);
                  setLoading(true);
                  try {
                    await loadRows(next, q);
                    setSelectedIds([]);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateEditDialog({
  mode,
  columns,
  initialValue,
  saving,
  disabled,
  onSubmit,
  children,
}: {
  mode: "create" | "edit";
  columns: ColumnMeta[];
  initialValue?: Record<string, any>;
  saving: boolean;
  disabled?: boolean;
  onSubmit: (payload: Record<string, any>) => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const editableColumns = useMemo(() => {
    return columns.filter((c) => {
      if (mode === "create") {
        // hide generated PKs (default like gen_random_uuid())
        if (c.isPrimaryKey && c.defaultValue) return false;
      }
      return true;
    });
  }, [columns, mode]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialValue) {
      const next: Record<string, any> = {};
      for (const c of editableColumns) next[c.name] = initialValue[c.name] ?? "";
      setValues(next);
    } else {
      const next: Record<string, any> = {};
      for (const c of editableColumns) next[c.name] = "";
      setValues(next);
    }
    setFieldErrors({});
  }, [open, mode, initialValue, editableColumns]);

  const title = mode === "create" ? "Create record" : "Edit record";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {editableColumns.map((c, idx) => {
            const v = values[c.name] ?? "";
            const err = fieldErrors[c.name];
            const type = c.dataType.toLowerCase();
            const isJson = type.includes("json");
            const isText = type.includes("text") || type.includes("character");
            const isBool = type.includes("boolean");

            return (
              <div key={`field-${idx}-${c.name}`} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="font-mono text-xs">{c.name}</Label>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {c.dataType}
                  </Badge>
                </div>
                {isBool ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={v === true || v === "true" || v === 1 || v === "1"}
                      onCheckedChange={(checked) =>
                        setValues((prev) => ({ ...prev, [c.name]: Boolean(checked) }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {c.isNullable ? "Optional" : "Required"}
                    </span>
                  </div>
                ) : isJson || (isText && String(v).length > 120) ? (
                  <Textarea
                    value={typeof v === "string" ? v : stringifyCell(v)}
                    onChange={(e) => setValues((prev) => ({ ...prev, [c.name]: e.target.value }))}
                    placeholder={c.isNullable ? "Optional" : "Required"}
                    className="min-h-[90px] font-mono text-xs"
                  />
                ) : (
                  <Input
                    value={typeof v === "string" ? v : String(v)}
                    onChange={(e) => setValues((prev) => ({ ...prev, [c.name]: e.target.value }))}
                    placeholder={c.isNullable ? "Optional" : "Required"}
                    className="font-mono text-xs"
                  />
                )}
                {err && <p className="text-xs text-destructive">{err}</p>}
              </div>
            );
          })}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setFieldErrors({});
              try {
                await onSubmit(values);
                setOpen(false);
              } catch (e: any) {
                const fe = e?.fieldErrors;
                if (fe && typeof fe === "object") setFieldErrors(fe);
              }
            }}
            disabled={saving || disabled}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

