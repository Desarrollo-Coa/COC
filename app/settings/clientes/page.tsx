"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Skeleton from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";

interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Cargar clientes al iniciar
  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    const res = await fetch("/api/clientes");
    const data = await res.json();
    setClientes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_cliente: nombre })
      });
      if (!res.ok) throw new Error("Error al crear cliente");
      setSuccess("Cliente creado correctamente");
      setNombre("");
      fetchClientes();
    } catch (err) {
      setError("No se pudo crear el cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditId(cliente.id_cliente);
    setEditNombre(cliente.nombre_cliente);
  };

  const handleEditSave = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_cliente: id, nombre_cliente: editNombre })
      });
      if (!res.ok) throw new Error("Error al editar cliente");
      toast.success("Cliente editado correctamente");
      setEditId(null);
      setEditNombre("");
      fetchClientes();
    } catch (err) {
      toast.error("No se pudo editar el cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clientes?id_cliente=${id}`, { method: "DELETE" });
      if (res.status === 409) {
        const data = await res.json();
        toast.error(data.error || "No se puede eliminar: el cliente tiene puntos asociados.");
      } else if (!res.ok) {
        throw new Error("Error al eliminar cliente");
      } else {
        toast.success("Cliente eliminado correctamente");
        fetchClientes();
      }
    } catch (err) {
      toast.error("No se pudo eliminar el cliente");
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestionar Clientes</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Crear nuevo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del cliente"
              required
              className="w-64"
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear"}
            </Button>
          </form>
          {error && <div className="text-red-500 mt-2">{error}</div>}
          {success && <div className="text-green-600 mt-2">{success}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lista de clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && clientes.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-2 flex gap-2"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : (
                clientes.map(cliente => (
                  <tr key={cliente.id_cliente}>
                    <td className="px-4 py-2">{cliente.id_cliente}</td>
                    <td className="px-4 py-2">
                      {editId === cliente.id_cliente ? (
                        <Input
                          value={editNombre}
                          onChange={e => setEditNombre(e.target.value)}
                          className="w-48"
                          autoFocus
                        />
                      ) : (
                        cliente.nombre_cliente
                      )}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      {editId === cliente.id_cliente ? (
                        <>
                          <Button size="sm" onClick={() => handleEditSave(cliente.id_cliente)} disabled={loading}>
                            Guardar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(cliente)}>
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={loading} onClick={() => setDeleteId(cliente.id_cliente)}>
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Seguro que deseas eliminar este cliente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Si el cliente tiene puntos de marcación asociados, no se eliminará.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(cliente.id_cliente)} disabled={loading}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 