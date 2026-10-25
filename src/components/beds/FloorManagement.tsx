"use client";

import React, { useState, useEffect } from "react";
import { BedTile, BedData } from "./BedTile";
import { BedDetailsModal } from "./BedDetailsModal";
import {
  Layers,
  Users,
  CheckCircle2,
  Clock,
  Wrench,
  Percent,
  RefreshCw,
  Home,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { clsx } from "clsx";
import { EditRoomAmenitiesModal } from "./EditRoomAmenitiesModal";

interface RoomData {
  _id: string;
  floorNumber: number;
  roomNumber: number;
  roomPosition: number;
  maxBeds: number;
  hasAc?: boolean;
  hasTv?: boolean;
  amenities: string[];
  beds: BedData[];
  configuredBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  isFull: boolean;
}

interface FloorStats {
  floorNumber: number;
  name: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
  occupancyPercentage: number;
}

interface BuildingStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  maintenanceBeds: number;
  occupancyPercentage: number;
}

export function FloorManagement() {
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [floors, setFloors] = useState<FloorStats[]>([]);
  const [buildingStats, setBuildingStats] = useState<BuildingStats | null>(null);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRoomForAmenities, setSelectedRoomForAmenities] = useState<RoomData | null>(null);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState<boolean>(false);

  const fetchFloorData = async () => {
    setLoading(true);
    try {
      const [floorsRes, roomsRes] = await Promise.all([
        fetch("/api/floors"),
        fetch(`/api/rooms?floor=${selectedFloor}`),
      ]);
      const floorsData = await floorsRes.json();
      const roomsData = await roomsRes.json();

      if (floorsData.floors) setFloors(floorsData.floors);
      if (floorsData.buildingStats) setBuildingStats(floorsData.buildingStats);
      if (roomsData.rooms) setRooms(roomsData.rooms);
    } catch (error) {
      console.error("Failed to load floor data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloorData();
  }, [selectedFloor]);

  const handleBedClick = (bed: BedData) => {
    setSelectedBed(bed);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Building Summary Statistics Bar */}
      {buildingStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Beds</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{buildingStats.totalBeds}</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Home className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Occupied</p>
              <p className="text-xl font-bold text-blue-900 mt-0.5">{buildingStats.occupiedBeds}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium">Available</p>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">{buildingStats.availableBeds}</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium">Reserved</p>
              <p className="text-xl font-bold text-amber-900 mt-0.5">{buildingStats.reservedBeds}</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Maintenance</p>
              <p className="text-xl font-bold text-slate-700 mt-0.5">{buildingStats.maintenanceBeds}</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
            <div>
              <p className="text-xs text-emerald-700 font-medium">Occupancy</p>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{buildingStats.occupancyPercentage}%</p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Floor Selection Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[1, 2, 3, 4].map((fl) => {
            const floorInfo = floors.find((f) => f.floorNumber === fl);
            const isSelected = selectedFloor === fl;
            return (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl)}
                className={clsx(
                  "px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-sm",
                  isSelected
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
                )}
              >
                <Layers className="w-4 h-4" />
                <span>Floor {fl}</span>
                {floorInfo && (
                  <span
                    className={clsx(
                      "text-xs px-2 py-0.5 rounded-full font-semibold",
                      isSelected
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {floorInfo.occupiedBeds}/{floorInfo.totalBeds} Beds ({floorInfo.occupancyPercentage}%)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchFloorData}
          disabled={loading}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh Layout
        </button>
      </div>

      {/* 3. Rooms & Beds Visual Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-200/70 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const occupancyRate = Math.round((room.occupiedBeds / room.maxBeds) * 100);
            return (
              <div
                key={room.roomNumber}
                className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:border-slate-300"
              >
                {/* Room Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">
                        Room {room.roomNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        Pos {room.roomPosition}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoomForAmenities(room);
                          setIsAmenitiesModalOpen(true);
                        }}
                        className="text-[11px] font-medium text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 shadow-2xs transition-colors"
                        title="Configure AC, TV and room amenities"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                        <span>Amenities</span>
                      </button>

                      <span
                        className={clsx(
                          "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                          room.isFull
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {room.occupiedBeds} / {room.maxBeds} Beds
                      </span>
                    </div>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={clsx(
                          "h-1.5 rounded-full transition-all duration-300",
                          occupancyRate === 100
                            ? "bg-rose-500"
                            : occupancyRate > 50
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        )}
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Amenities Badges with AC and TV Indicators */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {room.hasAc ? (
                      <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                        ❄️ AC
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded">
                        Non-AC
                      </span>
                    )}

                    {room.hasTv ? (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                        📺 TV
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded">
                        No TV
                      </span>
                    )}

                    {room.amenities
                      .filter((a) => a !== "AC" && a !== "Television")
                      .map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-slate-500 bg-white border border-slate-200/70 px-1.5 py-0.5 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Bed Tiles Grid inside Room */}
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    Configured Beds ({room.beds.length} / Max {room.maxBeds})
                  </p>
                  <div
                    className={clsx(
                      "grid gap-2.5",
                      room.maxBeds >= 6 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"
                    )}
                  >
                    {room.beds.map((bed) => (
                      <BedTile key={bed._id} bed={bed} onClick={handleBedClick} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Bed Allocation / Details Modal */}
      <BedDetailsModal
        bed={selectedBed}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchFloorData}
      />

      {/* 5. Room Amenities Configuration Modal */}
      <EditRoomAmenitiesModal
        room={selectedRoomForAmenities}
        isOpen={isAmenitiesModalOpen}
        onClose={() => setIsAmenitiesModalOpen(false)}
        onSuccess={fetchFloorData}
      />
    </div>
  );
}
