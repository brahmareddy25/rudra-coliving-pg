"use client";

import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { FloorManagement } from "@/components/beds/FloorManagement";

export default function AdminBedsPage() {
  return (
    <AdminLayout title="Visual Floor & Bed Allocation">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Floor-Plan & Bed Allocation Hub
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive management across 4 floors, 24 rooms, and 80 maximum beds. Click any bed tile to assign, move-out, or service.
          </p>
        </div>

        <FloorManagement />
      </div>
    </AdminLayout>
  );
}
