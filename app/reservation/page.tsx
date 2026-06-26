'use client';

import { FormEvent, useState } from 'react';

const STORAGE_KEY = 'hakpok119-reservations';

const consultationTypes = ['10분 무료상담', '20분 상담', '30분 상담', '60분 상담'];
const studentRoles = ['피해학생 측', '가해학생 측', '학부모', '기타'];

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
  status: '접수';
  createdAt: string;
};

type ReservationForm = Omit<Reservation, 'id' | 'status' | 'createdAt'>;

const initialForm: ReservationForm = {
  name: '',
  phone: '',
  consultationType: consultationTypes[0],
  studentRole: studentRoles[0],
  preferredDate: '',
  preferredTime: '',
  summary: '',
  privacyAgreed: false,
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

export default function ReservationPage() {
  const [form, setForm] = useState<ReservationForm>(initialForm);
  const [message, setMessage] = useState('');

  const updateField = <K extends keyof ReservationForm>(key: K, value: ReservationForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextReservation: Reservation = {
      ...form,
      id: `${Date.now()}-${crypto.randomUUID()}`,
      status: '접수',
      createdAt: new Date().toISOString(),
    };

    const reservations = readReservations();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([nextReservation, ...reservations]));

    setForm(initialForm);
    setMessage('상담예약이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-point">hakpok119 상담예약</p>
        <h1 className="mt-2 text-3xl font-black">상담예약</h1>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-bold">이름</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
              placeholder="예약자 이름"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">연락처</span>
            <input
              required
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
              placeholder="010-0000-0000"
              type="tel"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">상담유형</span>
            <select
              required
              value={form.consultationType}
              onChange={(event) => updateField('consultationType', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
            >
              {consultationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">학생 구분</span>
            <select
              required
              value={form.studentRole}
              onChange={(event) => updateField('studentRole', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
            >
              {studentRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">상담 희망일</span>
            <input
              required
              value={form.preferredDate}
              onChange={(event) => updateField('preferredDate', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
              type="date"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold">상담 희망시간</span>
            <input
              required
              value={form.preferredTime}
              onChange={(event) => updateField('preferredTime', event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3"
              type="time"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-bold">상담 내용 요약</span>
          <textarea
            required
            value={form.summary}
            onChange={(event) => updateField('summary', event.target.value)}
            className="min-h-36 w-full rounded-lg border border-slate-300 p-3"
            placeholder="상담받고 싶은 내용을 간단히 적어주세요."
          />
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <input
            required
            checked={form.privacyAgreed}
            onChange={(event) => updateField('privacyAgreed', event.target.checked)}
            className="mt-1 h-4 w-4"
            type="checkbox"
          />
          <span className="text-sm text-slate-700">
            개인정보 수집 및 이용에 동의합니다. 입력한 정보는 상담예약 확인 및 연락을 위해 임시 저장됩니다.
          </span>
        </label>

        <button type="submit" className="btn-primary">
          예약 신청
        </button>
      </form>
    </div>
  );
}
