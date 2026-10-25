"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tv, Wind, Check, AlertTriangle, Sparkles } from "lucide-react";
import { RecentInput, saveRecentItem } from "@/components/ui/RecentInput";

interface EditRoomAmenitiesModalProps {
  room: {
    _id: string;
    roomNumber: number;
    floorNumber: number;
    hasAc?: boolean;
    hasTv?: boolean;
    amenities: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRoomAmenitiesModal({
  room,
  isOpen,
  onClose,
  onSuccess,
}: EditRoomAmenitiesModalProps) {
  const [hasAc, setHasAc] = useState<boolean>(false);
  const [hasTv, setHasTv] = useState<boolean>(false);
  const [customAmenity, setCustomAmenity] = useState<string>("");
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (room) {
      setHasAc(Boolean(room.hasAc));
      setHasTv(Boolean(room.hasTv));
      setAmenitiesList(room.amenities || []);
      setError("");
      setSuccess("");
    }
  }, [room, isOpen]);

  if (!room) return null;

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (!amenitiesList.includes(trimmed)) {
      setAmenitiesList([...amenitiesList, trimmed]);
      saveRecentItem("recent_room_amenities", trimmed);
    }
    setCustomAmenity("");
  };

  const handleRemoveAmenity = (name: string) => {
    setAmenitiesList(amenitiesList.filter((a) => a !== name));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/rooms/${room._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hasAc,
          hasTv,
          amenities: amenitiesList,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update room amenities");

      setSuccess(data.message || "Amenities updated successfully");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Room ${room.roomNumber} Amenities`}
      description={`Floor ${room.floorNumber} · Configure AC, TV and other room facilities`}
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Primary Toggles for AC and TV */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Key In-Room Amenities
          </label>

          {/* AC Toggle */}
          <div
            onClick={() => setHasAc(!hasAc)}
            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              hasAc
                ? "bg-cyan-50/70 border-cyan-300 shadow-sm"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  hasAc ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Air Conditioner (AC)</p>
                <p className="text-xs text-slate-500">
                  {hasAc ? "Equipped with split inverter AC" : "Standard ceiling fan / Non-AC room"}
                </p>
              </div>
            </div>

            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                hasAc ? "bg-cyan-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                  hasAc ? "translate-x-5" : ""
                }`}
              />
            </div>
          </div>

          {/* TV Toggle */}
          <div
            onClick={() => setHasTv(!hasTv)}
            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              hasTv
                ? "bg-indigo-50/70 border-indigo-300 shadow-sm"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  hasTv ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Television (TV)</p>
                <p className="text-xs text-slate-500">
                  {hasTv ? "Smart LED TV installed in room" : "No television in this room"}
                </p>
              </div>
            </div>

            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                hasTv ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                  hasTv ? "translate-x-5" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Custom Amenities Tags */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Additional Amenities & Features
          </label>
          <div className="flex gap-2">
            <RecentInput
              storageKey="recent_room_amenities"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              placeholder="e.g. Geyser, Balcony, Attached Washroom"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomAmenity();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomAmenity}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {amenitiesList.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(item)}
                  className="text-slate-400 hover:text-rose-500 ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? "Saving..." : "Save Amenities"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
