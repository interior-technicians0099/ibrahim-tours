'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Car,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';
import MediaManager, { MediaItem } from '@/components/operator/MediaManager';
import {
  saveRouteAction,
  deleteRouteAction,
  saveVehicleAction,
  deleteVehicleAction,
} from '@/lib/actions/transport-actions';

interface RouteItem {
  id: string;
  origin: string;
  destination: string;
  durationText: string;
  distanceText?: string | null;
  pricingTiers: any;
  isActive: boolean;
}

interface VehicleItem {
  id: string;
  name: string;
  vehicleType: string;
  capacity: string;
  hasAc: boolean;
  driverIncluded: boolean;
  imageUrl?: string | null;
  features: any;
  isActive: boolean;
}

interface Props {
  initialRoutes: RouteItem[];
  initialVehicles: VehicleItem[];
}

export default function TransportManagerClient({ initialRoutes, initialVehicles }: Props) {
  const [activeTab, setActiveTab] = useState<'routes' | 'vehicles'>('routes');
  const [routes, setRoutes] = useState<RouteItem[]>(initialRoutes);
  const [vehicles, setVehicles] = useState<VehicleItem[]>(initialVehicles);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Route Form State
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [durationText, setDurationText] = useState('45–60 mins');
  const [distanceText, setDistanceText] = useState('45 km');
  const [van1to3, setVan1to3] = useState(35);
  const [costVan1to3, setCostVan1to3] = useState(20);
  const [van4to6, setVan4to6] = useState(45);
  const [costVan4to6, setCostVan4to6] = useState(25);
  const [miniBus7to12, setMiniBus7to12] = useState(70);
  const [costMiniBus7to12, setCostMiniBus7to12] = useState(40);
  const [bigBus13to25, setBigBus13to25] = useState(110);
  const [costBigBus13to25, setCostBigBus13to25] = useState(60);
  const [isRouteActive, setIsRouteActive] = useState(true);

  // Vehicle Form State
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('Van');
  const [capacity, setCapacity] = useState('1–6 passengers');
  const [hasAc, setHasAc] = useState(true);
  const [driverIncluded, setDriverIncluded] = useState(true);
  const [vehicleImages, setVehicleImages] = useState<MediaItem[]>([]);
  const [featuresText, setFeaturesText] = useState('Climate-controlled Dual A/C, Licensed tourism driver, Luggage compartment');
  const [isVehicleActive, setIsVehicleActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  // Open Route Modal
  const startNewRoute = () => {
    setEditingRouteId('NEW');
    setOrigin('');
    setDestination('');
    setDurationText('45–60 mins');
    setDistanceText('40 km');
    setVan1to3(35);
    setCostVan1to3(20);
    setVan4to6(45);
    setCostVan4to6(25);
    setMiniBus7to12(70);
    setCostMiniBus7to12(40);
    setBigBus13to25(110);
    setCostBigBus13to25(60);
    setIsRouteActive(true);
    setErrorMessage(null);
  };

  const startEditRoute = (r: RouteItem) => {
    setEditingRouteId(r.id);
    setOrigin(r.origin);
    setDestination(r.destination);
    setDurationText(r.durationText);
    setDistanceText(r.distanceText || '');
    const p = r.pricingTiers || {};
    setVan1to3(Math.round((p.van1to3 || 3500) / 100));
    setCostVan1to3(Math.round((p.costVan1to3 || 2000) / 100));
    setVan4to6(Math.round((p.van4to6 || 4500) / 100));
    setCostVan4to6(Math.round((p.costVan4to6 || 2500) / 100));
    setMiniBus7to12(Math.round((p.miniBus7to12 || 7000) / 100));
    setCostMiniBus7to12(Math.round((p.costMiniBus7to12 || 4000) / 100));
    setBigBus13to25(Math.round((p.bigBus13to25 || 11000) / 100));
    setCostBigBus13to25(Math.round((p.costBigBus13to25 || 6000) / 100));
    setIsRouteActive(r.isActive);
    setErrorMessage(null);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      setErrorMessage('Origin and Destination are required.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveRouteAction({
        id: editingRouteId !== 'NEW' ? editingRouteId! : undefined,
        origin,
        destination,
        durationText,
        distanceText,
        pricingTiers: {
          van1to3: Math.round(van1to3 * 100),
          costVan1to3: Math.round(costVan1to3 * 100),
          van4to6: Math.round(van4to6 * 100),
          costVan4to6: Math.round(costVan4to6 * 100),
          miniBus7to12: Math.round(miniBus7to12 * 100),
          costMiniBus7to12: Math.round(costMiniBus7to12 * 100),
          bigBus13to25: Math.round(bigBus13to25 * 100),
          costBigBus13to25: Math.round(costBigBus13to25 * 100),
        },
        isActive: isRouteActive,
      });

      if (result.success && result.route) {
        if (editingRouteId === 'NEW') {
          setRoutes([...routes, result.route]);
        } else {
          setRoutes(routes.map((r) => (r.id === editingRouteId ? result.route : r)));
        }
        setSuccessMessage('Transfer route saved successfully.');
        setTimeout(() => setSuccessMessage(null), 3000);
        setEditingRouteId(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save route.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoute = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete route "${label}"?`)) return;
    try {
      await deleteRouteAction(id);
      setRoutes(routes.filter((r) => r.id !== id));
      setSuccessMessage('Route deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete route.');
    }
  };

  // Open Vehicle Modal
  const startNewVehicle = () => {
    setEditingVehicleId('NEW');
    setVehicleName('');
    setVehicleType('Van');
    setCapacity('1–6 passengers');
    setHasAc(true);
    setDriverIncluded(true);
    setVehicleImages([]);
    setFeaturesText('Dual A/C, Tinted security windows, Bottled water, Clean interior');
    setIsVehicleActive(true);
    setErrorMessage(null);
  };

  const startEditVehicle = (v: VehicleItem) => {
    setEditingVehicleId(v.id);
    setVehicleName(v.name);
    setVehicleType(v.vehicleType);
    setCapacity(v.capacity);
    setHasAc(v.hasAc);
    setDriverIncluded(v.driverIncluded);
    setVehicleImages(v.imageUrl ? [{ id: v.id, url: v.imageUrl, isHero: true }] : []);
    const feats = Array.isArray(v.features) ? v.features.join(', ') : '';
    setFeaturesText(feats || 'Climate A/C, Professional tourist driver');
    setIsVehicleActive(v.isActive);
    setErrorMessage(null);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleName.trim()) {
      setErrorMessage('Vehicle name is required.');
      return;
    }

    setIsSaving(true);
    const featuresList = featuresText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      const result = await saveVehicleAction({
        id: editingVehicleId !== 'NEW' ? editingVehicleId! : undefined,
        name: vehicleName,
        vehicleType,
        capacity,
        hasAc,
        driverIncluded,
        imageUrl: vehicleImages[0]?.url || null,
        features: featuresList,
        isActive: isVehicleActive,
      });

      if (result.success && result.vehicle) {
        if (editingVehicleId === 'NEW') {
          setVehicles([...vehicles, result.vehicle]);
        } else {
          setVehicles(vehicles.map((v) => (v.id === editingVehicleId ? result.vehicle : v)));
        }
        setSuccessMessage('Vehicle fleet item saved successfully.');
        setTimeout(() => setSuccessMessage(null), 3000);
        setEditingVehicleId(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save vehicle.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVehicle = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vehicle "${name}"?`)) return;
    try {
      await deleteVehicleAction(id);
      setVehicles(vehicles.filter((v) => v.id !== id));
      setSuccessMessage('Vehicle deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete vehicle.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/operator"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Transfers & Fleet Logistics</h1>
            <p className="text-xs text-slate-400">Routes, 4-tier passenger pricing, and vehicles</p>
          </div>
        </div>

        <button
          type="button"
          onClick={activeTab === 'routes' ? startNewRoute : startNewVehicle}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'routes' ? 'New Route' : 'New Vehicle'}</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'routes'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/40'
            }`}
          >
            Transfer Routes ({routes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'vehicles'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white bg-slate-900/40'
            }`}
          >
            Fleet Vehicles ({vehicles.length})
          </button>
        </div>

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ----------------- TAB 1: ROUTES ----------------- */}
        {activeTab === 'routes' && (
          <div className="space-y-4">
            {/* Route Editor Modal / In-page Form */}
            {editingRouteId && (
              <form
                onSubmit={handleSaveRoute}
                className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-white">
                    {editingRouteId === 'NEW' ? 'Create Transfer Route' : 'Edit Transfer Route'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingRouteId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Origin *</label>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="e.g. Zanzibar Airport (ZNZ)"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Destination *
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Nungwi / Kendwa Beach"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Duration Estimate
                    </label>
                    <input
                      type="text"
                      value={durationText}
                      onChange={(e) => setDurationText(e.target.value)}
                      placeholder="60–75 mins"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Distance (km)
                    </label>
                    <input
                      type="text"
                      value={distanceText}
                      onChange={(e) => setDistanceText(e.target.value)}
                      placeholder="65 km"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 4 Passenger Pricing Tiers */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      4 Passenger Pricing Tiers (Public Price vs Private Cost)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Profit computed in real time
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Tier 1: Van 1-3 */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Van (1–3 pax)</span>
                        <span className="text-emerald-400 text-[11px]">
                          Profit: ${van1to3 - costVan1to3}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={van1to3}
                            onChange={(e) => setVan1to3(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-amber-400 block">
                            Private Cost ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={costVan1to3}
                            onChange={(e) => setCostVan1to3(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tier 2: Van 4-6 */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Van (4–6 pax)</span>
                        <span className="text-emerald-400 text-[11px]">
                          Profit: ${van4to6 - costVan4to6}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={van4to6}
                            onChange={(e) => setVan4to6(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-amber-400 block">
                            Private Cost ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={costVan4to6}
                            onChange={(e) => setCostVan4to6(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tier 3: Minibus 7-12 */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Minibus (7–12 pax)</span>
                        <span className="text-emerald-400 text-[11px]">
                          Profit: ${miniBus7to12 - costMiniBus7to12}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={miniBus7to12}
                            onChange={(e) => setMiniBus7to12(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-amber-400 block">
                            Private Cost ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={costMiniBus7to12}
                            onChange={(e) => setCostMiniBus7to12(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tier 4: Big Bus 13-25 */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Big Bus (13–25 pax)</span>
                        <span className="text-emerald-400 text-[11px]">
                          Profit: ${bigBus13to25 - costBigBus13to25}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 block">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={bigBus13to25}
                            onChange={(e) => setBigBus13to25(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-amber-400 block">
                            Private Cost ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={costBigBus13to25}
                            onChange={(e) => setCostBigBus13to25(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRouteActive}
                      onChange={(e) => setIsRouteActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-300">Route Active</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingRouteId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Route'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Routes List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((r) => {
                const p = r.pricingTiers || {};
                const v1Price = Math.round((p.van1to3 || 0) / 100);
                const v2Price = Math.round((p.van4to6 || 0) / 100);
                const mbPrice = Math.round((p.miniBus7to12 || 0) / 100);
                const bbPrice = Math.round((p.bigBus13to25 || 0) / 100);

                return (
                  <div
                    key={r.id}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                          Private Route
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            r.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base">
                        {r.origin} → {r.destination}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{r.durationText}</span>
                        </span>
                        {r.distanceText && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{r.distanceText}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tier Prices */}
                    <div className="pt-3 border-t border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">1–3p</span>
                        <span className="font-extrabold text-emerald-400">${v1Price}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">4–6p</span>
                        <span className="font-extrabold text-emerald-400">${v2Price}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">7–12p</span>
                        <span className="font-extrabold text-emerald-400">${mbPrice}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold">13–25p</span>
                        <span className="font-extrabold text-emerald-400">${bbPrice}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => startEditRoute(r)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoute(r.id, `${r.origin} → ${r.destination}`)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: VEHICLES ----------------- */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            {/* Vehicle Editor Form */}
            {editingVehicleId && (
              <form
                onSubmit={handleSaveVehicle}
                className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-white">
                    {editingVehicleId === 'NEW' ? 'Add Fleet Vehicle' : 'Edit Vehicle'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingVehicleId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Name *</label>
                    <input
                      type="text"
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      placeholder="e.g. Toyota Alphard Tourist Luxury Van"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Type</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Van">Tourist Van (1–6)</option>
                      <option value="MiniBus">Executive Minibus (7–12)</option>
                      <option value="BigBus">Luxury Coach (13–25)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Passenger Capacity</label>
                    <input
                      type="text"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="1–6 passengers"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasAc}
                        onChange={(e) => setHasAc(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-950"
                      />
                      <span className="text-xs font-semibold text-slate-300">Dual A/C</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={driverIncluded}
                        onChange={(e) => setDriverIncluded(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-950"
                      />
                      <span className="text-xs font-semibold text-slate-300">Licensed Driver Included</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Features List (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={featuresText}
                      onChange={(e) => setFeaturesText(e.target.value)}
                      placeholder="Dual A/C, Professional Driver, Luggage Space, Tinted Windows"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Vehicle Image Upload via MediaManager */}
                  <div className="sm:col-span-2 pt-2">
                    <MediaManager
                      items={vehicleImages}
                      onChange={setVehicleImages}
                      entityType="VEHICLE"
                      allowMultiple={false}
                      label="Vehicle Exterior / Interior Photo"
                      helperText="Upload official photograph of the transfer vehicle."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVehicleActive}
                      onChange={(e) => setIsVehicleActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-300">Active in Fleet</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingVehicleId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Vehicle'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-slate-950 w-full overflow-hidden">
                    {v.imageUrl ? (
                      <Image
                        src={v.imageUrl}
                        alt={v.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 300px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Car className="w-8 h-8" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-slate-950">
                        {v.vehicleType}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-base">{v.name}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {v.capacity}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1">
                        {v.hasAc && <div>✓ Climate-controlled Dual A/C</div>}
                        {v.driverIncluded && <div>✓ Licensed commercial driver</div>}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => startEditVehicle(v)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVehicle(v.id, v.name)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
