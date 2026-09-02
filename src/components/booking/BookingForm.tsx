'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Compass,
  Car,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Luggage,
  Baby,
  Globe2,
  ArrowRight,
} from 'lucide-react';
import { ALL_TOURS, TRANSFER_ROUTES, OPERATOR } from '@/lib/constants';
import { formatPrice, getWhatsAppLink } from '@/lib/utils';

export default function BookingForm() {
  const searchParams = useSearchParams();
  const queryType = searchParams.get('type');
  const queryTour = searchParams.get('tour');
  const queryRoute = searchParams.get('route') || searchParams.get('transfer');

  // Mode: 'tour' or 'transport'
  const [bookingType, setBookingType] = useState<'tour' | 'transport'>(
    queryType === 'transport' || queryRoute ? 'transport' : 'tour'
  );

  // Tour form state
  const [selectedTourSlug, setSelectedTourSlug] = useState<string>(
    queryTour || ALL_TOURS[0].slug
  );
  const [tourDate, setTourDate] = useState('');
  const [tourTime, setTourTime] = useState('08:30 AM');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [hotelLocation, setHotelLocation] = useState('');

  // Transport form state
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    queryRoute || TRANSFER_ROUTES[0].id
  );
  const [pickupLocation, setPickupLocation] = useState(
    TRANSFER_ROUTES[0].origin
  );
  const [dropoffLocation, setDropoffLocation] = useState(
    TRANSFER_ROUTES[0].destination
  );
  const [transportDate, setTransportDate] = useState('');
  const [transportTime, setTransportTime] = useState('12:00 PM');
  const [passengers, setPassengers] = useState('2');
  const [luggageCount, setLuggageCount] = useState('2 Bags');

  // Common contact state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [specialRequests, setSpecialRequests] = useState('');

  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync with searchParams if they arrive/change
  useEffect(() => {
    if (queryType === 'transport' || queryRoute) {
      setBookingType('transport');
      if (queryRoute) {
        const found = TRANSFER_ROUTES.find(
          (r) =>
            r.id === queryRoute ||
            r.origin.toLowerCase().includes(queryRoute.toLowerCase()) ||
            r.destination.toLowerCase().includes(queryRoute.toLowerCase())
        );
        if (found) {
          setSelectedRouteId(found.id);
          setPickupLocation(found.origin);
          setDropoffLocation(found.destination);
        }
      }
    } else if (queryTour) {
      setBookingType('tour');
      const foundTour = ALL_TOURS.find(
        (t) => t.slug === queryTour || t.title.toLowerCase().includes(queryTour.toLowerCase())
      );
      if (foundTour) {
        setSelectedTourSlug(foundTour.slug);
      }
    }
  }, [queryType, queryTour, queryRoute]);

  // Handle route change
  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    const r = TRANSFER_ROUTES.find((route) => route.id === routeId);
    if (r) {
      setPickupLocation(r.origin);
      setDropoffLocation(r.destination);
    }
  };

  // Find active tour & route objects
  const currentTour = useMemo(
    () => ALL_TOURS.find((t) => t.slug === selectedTourSlug) || ALL_TOURS[0],
    [selectedTourSlug]
  );

  const currentRoute = useMemo(
    () => TRANSFER_ROUTES.find((r) => r.id === selectedRouteId) || TRANSFER_ROUTES[0],
    [selectedRouteId]
  );

  // Live estimated starting price
  const estimatedPrice = useMemo(() => {
    if (bookingType === 'tour') {
      const numAdults = parseInt(adults, 10) || 2;
      if (numAdults === 1) return currentTour.pricing.single;
      if (numAdults === 2) return currentTour.pricing.couple;
      if (numAdults >= 5 && currentTour.pricing.group5to10) {
        return currentTour.pricing.group5to10 * numAdults;
      }
      return currentTour.pricing.couple;
    } else {
      const numPax = parseInt(passengers, 10) || 2;
      if (numPax <= 3) return currentRoute.pricing.van1to3;
      if (numPax <= 6) return currentRoute.pricing.van4to6;
      if (numPax <= 12) return currentRoute.pricing.miniBus7to12;
      return currentRoute.pricing.bigBus13to25;
    }
  }, [bookingType, currentTour, currentRoute, adults, passengers]);

  // Validation function
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      errs.phone = 'Phone or WhatsApp number is required for confirmation';
    }

    if (bookingType === 'tour') {
      if (!tourDate) {
        errs.tourDate = 'Please select your preferred tour date';
      }
      if (!hotelLocation.trim()) {
        errs.hotelLocation = 'Please provide your hotel name or pickup area';
      }
    } else {
      if (!transportDate) {
        errs.transportDate = 'Please select your transfer date';
      }
      if (!pickupLocation.trim()) {
        errs.pickupLocation = 'Pickup location is required';
      }
      if (!dropoffLocation.trim()) {
        errs.dropoffLocation = 'Drop-off location is required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Generate reference code
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const ref = `ZNZ-2026-${randomDigits}`;
    setReferenceCode(ref);
    setIsSubmitted(true);
  };

  const compiledWhatsAppText = useMemo(() => {
    if (bookingType === 'tour') {
      return `Hello Ibrahim! I have submitted a Tour Booking Request:
• Ref: ${referenceCode}
• Tour: ${currentTour.title}
• Date: ${tourDate} (${tourTime})
• Guests: ${adults} Adults, ${children} Children
• Hotel / Pickup: ${hotelLocation}
• Guest Name: ${fullName} (${country})
• WhatsApp: ${phone}
• Special Notes: ${specialRequests || 'None'}

Please confirm availability and booking details!`;
    } else {
      return `Hello Ibrahim! I have submitted a Transfer Booking Request:
• Ref: ${referenceCode}
• Route: ${pickupLocation} → ${dropoffLocation}
• Date: ${transportDate} (${transportTime})
• Passengers: ${passengers} (${luggageCount})
• Guest Name: ${fullName} (${country})
• WhatsApp: ${phone}
• Special Notes: ${specialRequests || 'None'}

Please confirm driver dispatch and booking details!`;
    }
  }, [
    bookingType,
    referenceCode,
    currentTour,
    tourDate,
    tourTime,
    adults,
    children,
    hotelLocation,
    fullName,
    country,
    phone,
    specialRequests,
    pickupLocation,
    dropoffLocation,
    transportDate,
    transportTime,
    passengers,
    luggageCount,
  ]);

  const copyRefToClipboard = () => {
    if (referenceCode) {
      navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* 5. Clear Notice Box */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5 text-xs sm:text-sm text-amber-950 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">
            Booking Request Only — Zero Online Payment
          </strong>
          <span className="text-amber-900 leading-relaxed">
            This form is a booking request, not an instant credit-card charge. Ibrahim Tours Zanzibar will personally contact you via WhatsApp or Email to confirm availability and schedule. You pay on the day of the tour upon meeting your guide.
          </span>
        </div>
      </div>

      {isSubmitted ? (
        /* 6. Success State with Reference Code & Next Steps */
        <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200/80 shadow-xl text-center space-y-8 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
              Request Successfully Received
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Asante Sana, {fullName}!
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              We have received your booking request for{' '}
              <strong className="text-slate-900">
                {bookingType === 'tour' ? currentTour.title : `${pickupLocation} to ${dropoffLocation}`}
              </strong>.
            </p>
          </div>

          {/* Reference Code Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 max-w-md mx-auto flex items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Booking Reference Code
              </span>
              <span className="text-xl sm:text-2xl font-black text-sky-700 font-mono tracking-wide">
                {referenceCode}
              </span>
            </div>
            <button
              type="button"
              onClick={copyRefToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* 3 Next Steps */}
          <div className="max-w-xl mx-auto text-left space-y-3 pt-2">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              What Happens Next:
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <strong className="text-slate-900 block">Manual Availability Check:</strong>
                  Ibrahim checks boat captain and vehicle schedules for your requested date.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <strong className="text-slate-900 block">Confirmation Voucher:</strong>
                  You will receive a confirmation message on WhatsApp or Email with pickup details and driver contact.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <strong className="text-slate-900 block">Pay on Arrival:</strong>
                  No card charges online. Pay directly upon meeting your guide (Cash in USD/EUR/GBP/TZS or M-Pesa).
                </div>
              </div>
            </div>
          </div>

          {/* Instant WhatsApp Confirmation Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
            <a
              href={getWhatsAppLink(compiledWhatsAppText)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-black text-sm shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all text-center"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Confirm Instantly on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="w-full sm:w-auto px-5 py-3 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      ) : (
        /* Form Layout: Inputs (8 cols) + Live Summary Sidebar (4 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Fields */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-8">
            {/* 1. Toggle between Tour and Transport */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Service Type
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setBookingType('tour')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                    bookingType === 'tour'
                      ? 'bg-white text-sky-700 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Tour / Excursion</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingType('transport')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                    bookingType === 'transport'
                      ? 'bg-white text-sky-700 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Airport & Transfer</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Tour Specific Fields */}
              {bookingType === 'tour' && (
                <div className="space-y-5 pt-2 border-t border-slate-100">
                  <div>
                    <label
                      htmlFor="select-tour"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Choose Tour Package *
                    </label>
                    <select
                      id="select-tour"
                      value={selectedTourSlug}
                      onChange={(e) => setSelectedTourSlug(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {ALL_TOURS.map((t) => (
                        <option key={t.id} value={t.slug}>
                          {t.title} ({t.duration} • {t.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="tour-date"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        id="tour-date"
                        required
                        value={tourDate}
                        onChange={(e) => setTourDate(e.target.value)}
                        className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          errors.tourDate ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
                        }`}
                      />
                      {errors.tourDate && (
                        <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.tourDate}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="tour-time"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Preferred Departure Time
                      </label>
                      <select
                        id="tour-time"
                        value={tourTime}
                        onChange={(e) => setTourTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="08:00 AM (Early Morning)">08:00 AM (Early Morning)</option>
                        <option value="08:30 AM (Standard)">08:30 AM (Standard)</option>
                        <option value="09:00 AM (Standard)">09:00 AM (Standard)</option>
                        <option value="01:30 PM (Afternoon)">01:30 PM (Afternoon)</option>
                        <option value="04:00 PM (Sunset Tours)">04:00 PM (Sunset Tours)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="adults-count"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Adults (12+ yrs)
                      </label>
                      <select
                        id="adults-count"
                        value={adults}
                        onChange={(e) => setAdults(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="1">1 Person (Solo)</option>
                        <option value="2">2 Persons (Couple)</option>
                        <option value="3">3 Persons</option>
                        <option value="4">4 Persons</option>
                        <option value="5">5 Persons</option>
                        <option value="6">6 Persons</option>
                        <option value="8">8 Persons</option>
                        <option value="10">10 Persons</option>
                        <option value="15">15+ Persons</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="children-count"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Children (0–11 yrs)
                      </label>
                      <select
                        id="children-count"
                        value={children}
                        onChange={(e) => setChildren(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="0">0 Children</option>
                        <option value="1">1 Child</option>
                        <option value="2">2 Children</option>
                        <option value="3">3+ Children</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="hotel-location"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Hotel or Pickup Area in Zanzibar *
                    </label>
                    <input
                      type="text"
                      id="hotel-location"
                      required
                      value={hotelLocation}
                      onChange={(e) => setHotelLocation(e.target.value)}
                      placeholder="e.g. Zuri Zanzibar Kendwa, Park Hyatt Stone Town, or Paje Beach Resort"
                      className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        errors.hotelLocation ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
                      }`}
                    />
                    {errors.hotelLocation && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.hotelLocation}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Transport Specific Fields */}
              {bookingType === 'transport' && (
                <div className="space-y-5 pt-2 border-t border-slate-100">
                  <div>
                    <label
                      htmlFor="select-route-template"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Standard Route Preset
                    </label>
                    <select
                      id="select-route-template"
                      value={selectedRouteId}
                      onChange={(e) => handleRouteChange(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {TRANSFER_ROUTES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.origin} → {r.destination} (Est. {r.durationEstimate})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pickup-location"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Pickup Location / Airport Terminal *
                      </label>
                      <input
                        type="text"
                        id="pickup-location"
                        required
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        placeholder="e.g. Zanzibar Airport (ZNZ) or Hotel Name"
                        className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          errors.pickupLocation ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
                        }`}
                      />
                      {errors.pickupLocation && (
                        <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.pickupLocation}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="dropoff-location"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Drop-off Location / Resort *
                      </label>
                      <input
                        type="text"
                        id="dropoff-location"
                        required
                        value={dropoffLocation}
                        onChange={(e) => setDropoffLocation(e.target.value)}
                        placeholder="e.g. Nungwi Resort or Stone Town Ferry"
                        className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          errors.dropoffLocation ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
                        }`}
                      />
                      {errors.dropoffLocation && (
                        <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.dropoffLocation}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="transport-date"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Transfer Date *
                      </label>
                      <input
                        type="date"
                        id="transport-date"
                        required
                        value={transportDate}
                        onChange={(e) => setTransportDate(e.target.value)}
                        className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          errors.transportDate ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
                        }`}
                      />
                      {errors.transportDate && (
                        <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.transportDate}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="transport-time"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Pickup Time / Flight #
                      </label>
                      <input
                        type="text"
                        id="transport-time"
                        value={transportTime}
                        onChange={(e) => setTransportTime(e.target.value)}
                        placeholder="e.g. 14:30 or Flight QR1487"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="transport-passengers"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Passengers
                      </label>
                      <select
                        id="transport-passengers"
                        value={passengers}
                        onChange={(e) => setPassengers(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="1">1 Passenger</option>
                        <option value="2">2 Passengers</option>
                        <option value="3">3 Passengers (Van 1-3)</option>
                        <option value="4">4 Passengers (Van 4-6)</option>
                        <option value="6">6 Passengers (Van 4-6)</option>
                        <option value="8">8 Passengers (Mini Bus)</option>
                        <option value="12">12 Passengers (Mini Bus)</option>
                        <option value="20">20 Passengers (Big Bus)</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="luggage-count"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Luggage Count
                      </label>
                      <select
                        id="luggage-count"
                        value={luggageCount}
                        onChange={(e) => setLuggageCount(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="1-2 Bags">1–2 Suitcases</option>
                        <option value="3-4 Bags">3–4 Suitcases</option>
                        <option value="5-8 Bags">5–8 Suitcases</option>
                        <option value="9+ Bags">9+ Large Luggage</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Guest Contact Information */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Your Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="full-name"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="full-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        errors.fullName ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
                      }`}
                    />
                    {errors.fullName && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.fullName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="guest-country"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Country of Residence
                    </label>
                    <input
                      type="text"
                      id="guest-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United Kingdom, Italy, Germany, USA"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="email-address"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email-address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarah@example.com"
                      className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        errors.email ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
                      }`}
                    />
                    {errors.email && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phone-number"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="phone-number"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +44 7123 456789"
                      className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        errors.phone ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
                      }`}
                    />
                    {errors.phone && (
                      <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="special-requests"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Special Requests / Dietary Needs
                  </label>
                  <textarea
                    id="special-requests"
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Vegetarian seafood barbecue, infant car seat requested, traveling with elderly..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3.5">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 active:scale-95 transition-all text-center"
                >
                  <CalendarCheck className="w-5 h-5" />
                  <span>Submit Booking Request</span>
                </button>

                <a
                  href={getWhatsAppLink(
                    `Hello Ibrahim! I would like to book ${
                      bookingType === 'tour' ? currentTour.title : `${pickupLocation} to ${dropoffLocation}`
                    }. Can you check availability?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa50] text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all text-center"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Inquire on WhatsApp</span>
                </a>
              </div>
            </form>
          </div>

          {/* 4. Live Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-lg space-y-6">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block mb-1">
                  Live Request Summary
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {bookingType === 'tour' ? currentTour.title : `${pickupLocation} → ${dropoffLocation}`}
                </h3>
                <span className="text-xs text-slate-500 mt-1 block">
                  {bookingType === 'tour'
                    ? `${currentTour.category} • ${currentTour.duration}`
                    : `Direct Transfer • Est. ${currentRoute.durationEstimate}`}
                </span>
              </div>

              {/* Estimated Price Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Estimated Rate
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      {formatPrice(estimatedPrice)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {bookingType === 'tour' ? 'total estimate' : 'total per vehicle'}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Pay on Arrival
                </span>
              </div>

              {/* Dynamic Details List */}
              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-bold text-slate-900">
                    {bookingType === 'tour' ? tourDate || 'Not selected' : transportDate || 'Not selected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Time:</span>
                  <span className="font-bold text-slate-900">
                    {bookingType === 'tour' ? tourTime : transportTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Party Size:</span>
                  <span className="font-bold text-slate-900">
                    {bookingType === 'tour'
                      ? `${adults} Adults${children !== '0' ? `, ${children} Children` : ''}`
                      : `${passengers} Passengers (${luggageCount})`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Guest Name:</span>
                  <span className="font-bold text-slate-900">
                    {fullName || 'Your Name'}
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100% Private tour / vehicle</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero advance credit card charge</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant support via WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
