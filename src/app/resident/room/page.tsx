"use client";

import React, { useState, useEffect } from "react";
import { ResidentLayout } from "@/components/layout/ResidentLayout";
import { Badge } from "@/components/ui/Badge";
import { Bed, Users, Shield, Sparkles, Check, Home } from "lucide-react";

export default function ResidentRoomPage() {
  const [userData, setUserData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (data) => {
        if (data.user) {
          setUserData(data.user);
          if (data.user.assignedBed) {
            const roomRes = await fetch(`/api/rooms?floor=${data.user.assignedBed.floorNumber}`);
            const roomJson = await roomRes.json();
            if (roomJson.rooms) {
              const myRoom = roomJson.rooms.find(
                (r: any) => r.roomNumber === data.user.assignedBed.roomNumber
              );
              setRoomData(myRoom);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const assignedBed = userData?.assignedBed;

  return (
    <ResidentLayout title="My Room & Roommates">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Your Co-Living Room Space
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Details of your allocated bed, room amenities, and co-stay roommates.
          </p>
        </div>

        {assignedBed && roomData ? (
          <div className="space-y-6">
            {/* Primary Bed Card */}
            <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Allocated Bed
                </span>
                <h3 className="text-3xl font-black text-white mt-1">
                  Bed {assignedBed.bedNumber}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Room {assignedBed.roomNumber} · Floor {assignedBed.floorNumber}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Agreed Rent</span>
                <span className="text-2xl font-black text-emerald-400">
                  ₹{assignedBed.monthlyRent.toLocaleString("en-IN")}/mo
                </span>
              </div>
            </div>

            {/* Room Amenities */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Included Room Amenities
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {roomData.amenities?.map((amenity: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-800"
                  >
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roommates in this Room */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Room Configuration & Beds ({roomData.occupiedBeds} / {roomData.maxBeds} Occupied)
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  Room {roomData.roomNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roomData.beds?.map((b: any) => {
                  const isMine = b.bedNumber === assignedBed.bedNumber;
                  const isOccupied = b.status === "occupied";
                  return (
                    <div
                      key={b._id}
                      className={`p-4 rounded-xl border flex items-center justify-between ${
                        isMine
                          ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                          : isOccupied
                          ? "bg-slate-50 border-slate-200"
                          : "bg-white border-dashed border-slate-300 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isMine
                              ? "bg-emerald-600 text-white"
                              : isOccupied
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Bed className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">
                            Bed {b.bedNumber} {isMine && "(Your Bed)"}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {isMine
                              ? "You"
                              : isOccupied
                              ? b.currentResidentId?.name || "Fellow Resident"
                              : "Available Bed"}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={
                          isMine ? "paid" : isOccupied ? "occupied" : "available"
                        }
                      >
                        {isMine ? "My Bed" : b.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Home className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 text-base">Room Assignment in Progress</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your profile is verified. Property management is currently finalizing your room and bed allocation. Please check back shortly.
            </p>
          </div>
        )}
      </div>
    </ResidentLayout>
  );
}
