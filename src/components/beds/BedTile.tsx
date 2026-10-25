"use client";

import React from "react";
import { Bed as BedIcon, User as UserIcon, Wrench, ShieldAlert } from "lucide-react";
import { clsx } from "clsx";

export interface BedData {
  _id: string;
  roomId: string;
  floorNumber: number;
  roomNumber: number;
  bedNumber: string;
  monthlyRent: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentResidentId?: {
    _id: string;
    name: string;
    mobile: string;
    avatarUrl?: string;
  };
  allocation?: {
    id: string;
    startDate: string;
    monthlyRentAgreed: number;
    notes?: string;
  };
}

interface BedTileProps {
  bed: BedData;
  onClick: (bed: BedData) => void;
}

export function BedTile({ bed, onClick }: BedTileProps) {
  const isOccupied = bed.status === "occupied";
  const isAvailable = bed.status === "available";
  const isReserved = bed.status === "reserved";
  const isMaintenance = bed.status === "maintenance";

  const statusStyles = {
    available: "bg-emerald-50/70 border-emerald-200 hover:border-emerald-400 text-emerald-950",
    occupied: "bg-blue-50/70 border-blue-200 hover:border-blue-400 text-blue-950",
    reserved: "bg-amber-50/70 border-amber-200 hover:border-amber-400 text-amber-950",
    maintenance: "bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700",
  };

  const badgeStyles = {
    available: "bg-emerald-600 text-white",
    occupied: "bg-blue-600 text-white",
    reserved: "bg-amber-500 text-white",
    maintenance: "bg-slate-500 text-white",
  };

  return (
    <div
      onClick={() => onClick(bed)}
      className={clsx(
        "relative rounded-lg p-3.5 border transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between min-h-[115px]",
        statusStyles[bed.status]
      )}
    >
      {/* Top Header: Bed Number & Status Tag */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
          <BedIcon className="w-4 h-4 text-slate-600" />
          {bed.bedNumber}
        </span>
        <span
          className={clsx(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
            badgeStyles[bed.status]
          )}
        >
          {bed.status}
        </span>
      </div>

      {/* Middle Content: Resident Name or Rent */}
      <div className="my-1.5">
        {isOccupied && bed.currentResidentId ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 truncate">
            <UserIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{bed.currentResidentId.name}</span>
          </div>
        ) : isMaintenance ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Under Service</span>
          </div>
        ) : (
          <div className="text-xs text-emerald-700 font-medium">
            ₹{bed.monthlyRent.toLocaleString("en-IN")}/mo
          </div>
        )}
      </div>

      {/* Footer Info: Phone or Available Action */}
      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50">
        {isOccupied && bed.currentResidentId ? (
          <span className="text-[10px] text-slate-400 font-mono">
            +91 {bed.currentResidentId.mobile.slice(-5).padStart(10, "*")}
          </span>
        ) : (
          <span className="text-[10px] text-emerald-600 font-medium">Ready to allocate →</span>
        )}
        <span className="text-[10px] text-slate-400">Click to view</span>
      </div>
    </div>
  );
}
