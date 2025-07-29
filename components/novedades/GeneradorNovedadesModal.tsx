import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GeneradorNovedadesModal({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const [cantidad, setCantidad] = useState(5);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");

  const handleGenerar = async () => {
    setLoading(true);
    setResultado("");
    try {
      const res = await fetch("/api/novedades/generar-fake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad }),
      });
      const data = await res.json();
      setResultado(data.message || "¡Novedades generadas!");
    } catch (e) {
      setResultado("Error al generar novedades");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar novedades aleatorias</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block">
            Cantidad de novedades por día:
            <input
              type="number"
              min={1}
              max={20}
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              className="border rounded px-2 py-1 ml-2 w-20"
            />
          </label>
          <Button onClick={handleGenerar} disabled={loading}>
            {loading ? "Generando..." : "Generar"}
          </Button>
          {resultado && <div className="text-sm mt-2">{resultado}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
} 