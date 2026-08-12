"use client";

import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { deleteRentPaymentAction } from "@/app/dashboard/rent/actions";

export function DeleteRentPaymentButton({
  id,
  tenantName,
  compact = false,
}: {
  id: string;
  tenantName: string;
  compact?: boolean;
}) {
  return (
    <ConfirmDialog
      trigger={
        compact ? (
          <Button variant="ghost" size="sm" type="button" aria-label="Delete payment">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" type="button">
            <Trash2 className="h-4 w-4 text-red-500" />
            Delete
          </Button>
        )
      }
      title="Delete payment"
      description={`Are you sure you want to delete the rent payment for "${tenantName}"? This can't be undone.`}
      confirmLabel="Delete payment"
      onConfirm={() => deleteRentPaymentAction(id)}
    />
  );
}
