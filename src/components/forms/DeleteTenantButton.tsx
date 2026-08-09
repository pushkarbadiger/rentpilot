"use client";

import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { deleteTenantAction } from "@/app/dashboard/tenants/actions";

export function DeleteTenantButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" type="button">
          <Trash2 className="h-4 w-4 text-red-500" />
          Delete
        </Button>
      }
      title="Delete tenant"
      description={`Are you sure you want to delete "${name}"? This can't be undone.`}
      confirmLabel="Delete tenant"
      onConfirm={() => deleteTenantAction(id)}
    />
  );
}
