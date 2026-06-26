'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hakpok119-reservations';

const reservationStatuses = ['접수', '확인중', '상담확정', '상담완료', '수임검토', '종결'] as const;

type ReservationStatus = (typeof reservationStatuses)[number];

type Reservation = {
  id: string;
  name: string;
  phone: string;
  consultationType: string;
  studentRole: string;
  preferredDate: string;
  preferredTime: string;
  summary: string;
  privacyAgreed: boolean;
  status: ReservationStatus;
  createdAt: string;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const readReservations = () => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as Reservation[];
  } catch {
    return [];
  }
};

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    setReservations(readReservations());
  }, []);

  const updateStatus = (id: string, status: ReservationStatus) => {
    setReservations((current) => {
      const next = current.map((reservation) => (reservation.id === id ? { ...reservation, status } : reservation));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-point">hakpok119 관리자</p>
        <h1 className="mt-2 text-3xl font-black">상담예약 관리</h1>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        현재 상담예약 관리는 임시 저장 방식으로 구현되어 있습니다. 향후 Supabase DB 연동 후 실제 관리자 기능으로
        전환됩니다.
      </div>

      <section className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">예약 목록</h2>
          <p className="text-sm text-slate-500">총 {reservations.length}건</p>
        </div>

        {reservations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            접수된 상담예약이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-3 py-3 font-bold">접수일시</th>
                  <th className="px-3 py-3 font-bold">이름</th>
                  <th className="px-3 py-3 font-bold">연락처</th>
                  <th className="px-3 py-3 font-bold">상담유형</th>
                  <th className="px-3 py-3 font-bold">학생 구분</th>
                  <th className="px-3 py-3 font-bold">희망일</th>
                  <th className="px-3 py-3 font-bold">희망시간</th>
                  <th className="px-3 py-3 font-bold">상태</th>
                  <th className="px-3 py-3 font-bold">상담 내용 요약</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="border-b border-slate-100 align-top">
                    <td className="whitespace-nowrap px-3 py-3">{formatDateTime(reservation.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">{reservation.name}</td>
                    <td className="whitespace-nowrap px-3 py-3">{reservation.phone}</td>
                    <td className="whitespace-nowrap px-3 py-3">{reservation.consultationType}</td>
                    <td className="whitespace-nowrap px-3 py-3">{reservation.studentRole}</td>
                    <td className="whitespace-nowrap px-3 py-3">{reservation.preferredDate}</td>
                    <td className="whitespace-nowrap px-3 py-3">{reservation.preferredTime}</td>
                    <td className="min-w-64 px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {reservationStatuses.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStatus(reservation.id, status)}
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                              reservation.status === status
                                ? 'border-navy bg-navy text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="min-w-72 px-3 py-3 leading-6 text-slate-700">{reservation.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
