import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useListUsers, useCreateUser, useUpdateUser, useDeleteUser, useUpdateUserPermissions,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Plus, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Role = "admin" | "operator" | "viewer";
type Status = "active" | "inactive" | "suspended";

const ALL_PERMISSIONS = [
  "view_metrics", "acknowledge_alerts", "manage_users",
  "view_admin", "manage_settings", "export_data",
];

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: Role;
  status: Status;
  permissions: string[];
}

const defaultForm: UserFormData = {
  name: "", email: "", password: "", role: "viewer", status: "active", permissions: ["view_metrics"],
};

function UserForm({
  initial, onSubmit, onCancel, isLoading, mode,
}: {
  initial?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}) {
  const [form, setForm] = useState<UserFormData>({ ...defaultForm, ...initial });

  function toggle(perm: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-card-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{mode === "create" ? "Create User" : "Edit User"}</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="h-8 text-xs" />
          </div>
          {mode === "create" && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="h-8 text-xs" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              className="w-full h-8 text-xs bg-background border border-border rounded-md px-2 text-foreground"
            >
              <option value="viewer">Viewer</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
              className="w-full h-8 text-xs bg-background border border-border rounded-md px-2 text-foreground"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Permissions</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => toggle(perm)}
                  className={cn("w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors", {
                    "bg-primary border-primary": form.permissions.includes(perm),
                    "border-border": !form.permissions.includes(perm),
                  })}
                >
                  {form.permissions.includes(perm) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground capitalize">{perm.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => onSubmit(form)} disabled={isLoading}>
            {isLoading ? "Saving..." : mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { isAdmin, user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: users, isLoading } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const createMutation = useCreateUser({ mutation: { onSuccess() { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); setShowCreate(false); } } });
  const updateMutation = useUpdateUser({ mutation: { onSuccess() { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); setEditingId(null); } } });
  const deleteMutation = useDeleteUser({ mutation: { onSuccess() { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); setDeletingId(null); } } });
  const permsMutation = useUpdateUserPermissions({ mutation: { onSuccess() { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); } } });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-base font-semibold text-foreground">Access Denied</p>
        <p className="text-xs text-muted-foreground">This page is only accessible to admins.</p>
      </div>
    );
  }

  const editingUser = users?.find((u) => u.id === editingId);

  return (
    <div className="p-6 space-y-6">
      {showCreate && (
        <UserForm
          mode="create"
          onCancel={() => setShowCreate(false)}
          isLoading={createMutation.isPending}
          onSubmit={(form) => createMutation.mutate({ data: { name: form.name, email: form.email, password: form.password, role: form.role, permissions: form.permissions } })}
        />
      )}
      {editingUser && (
        <UserForm
          mode="edit"
          initial={{ name: editingUser.name, email: editingUser.email, role: editingUser.role as Role, status: editingUser.status as Status, permissions: editingUser.permissions ?? [] }}
          onCancel={() => setEditingId(null)}
          isLoading={updateMutation.isPending}
          onSubmit={(form) => updateMutation.mutate({ id: editingUser.id, data: { name: form.name, email: form.email, role: form.role, status: form.status } })}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{users?.length ?? 0} users registered</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" /> Create User
        </Button>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-background/30">
                {["User", "Email", "Role", "Status", "Permissions", "Last Login", "Created", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 first:px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading users...</td></tr>
              )}
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-background/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {u.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{u.name}</span>
                      {u.id === currentUser?.id && <span className="text-xs text-primary">(you)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", {
                      "bg-red-500/10 text-red-400": u.role === "admin",
                      "bg-blue-500/10 text-blue-400": u.role === "operator",
                      "bg-secondary text-muted-foreground": u.role === "viewer",
                    })}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", {
                      "bg-emerald-500/10 text-emerald-400": u.status === "active",
                      "bg-secondary text-muted-foreground": u.status === "inactive",
                      "bg-red-500/10 text-red-400": u.status === "suspended",
                    })}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(u.permissions ?? []).slice(0, 2).map((p) => (
                        <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{p.replace(/_/g, " ")}</span>
                      ))}
                      {(u.permissions ?? []).length > 2 && (
                        <span className="text-xs text-muted-foreground">+{(u.permissions ?? []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(u.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Edit user"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            if (deletingId === u.id) {
                              deleteMutation.mutate({ id: u.id });
                            } else {
                              setDeletingId(u.id);
                              setTimeout(() => setDeletingId(null), 3000);
                            }
                          }}
                          className={cn("p-1.5 rounded transition-colors", {
                            "text-red-400 bg-red-500/10": deletingId === u.id,
                            "text-muted-foreground hover:text-red-400 hover:bg-red-500/10": deletingId !== u.id,
                          })}
                          title={deletingId === u.id ? "Click again to confirm delete" : "Delete user"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
