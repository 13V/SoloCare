export interface NdisRate {
  supportItemNumber: string;
  description: string;
  weekday: number;
  weekdayEvening: number;
  saturday: number;
  sunday: number;
  publicHoliday: number;
}

export const NDIS_RATES: NdisRate[] = [
  {
    supportItemNumber: "01_011_0107_1_1",
    description: "Daily Activities — Standard",
    weekday: 67.56,
    weekdayEvening: 74.32,
    saturday: 94.78,
    sunday: 122.01,
    publicHoliday: 149.23,
  },
  {
    supportItemNumber: "01_013_0107_1_1",
    description: "Daily Activities — High Intensity",
    weekday: 86.89,
    weekdayEvening: 95.58,
    saturday: 121.85,
    sunday: 156.80,
    publicHoliday: 191.75,
  },
  {
    supportItemNumber: "04_104_0125_6_1",
    description: "Social & Community Participation — Standard",
    weekday: 67.56,
    weekdayEvening: 74.32,
    saturday: 94.78,
    sunday: 122.01,
    publicHoliday: 149.23,
  },
  {
    supportItemNumber: "04_106_0125_6_1",
    description: "Social & Community Participation — High Intensity",
    weekday: 86.89,
    weekdayEvening: 95.58,
    saturday: 121.85,
    sunday: 156.80,
    publicHoliday: 191.75,
  },
  {
    supportItemNumber: "07_002_0106_1",
    description: "Support Coordination",
    weekday: 108.13,
    weekdayEvening: 108.13,
    saturday: 108.13,
    sunday: 108.13,
    publicHoliday: 108.13,
  },
  {
    supportItemNumber: "08_001_0106_6_3",
    description: "Improved Living Arrangements",
    weekday: 67.56,
    weekdayEvening: 74.32,
    saturday: 94.78,
    sunday: 122.01,
    publicHoliday: 149.23,
  },
  {
    supportItemNumber: "09_009_0106_6_3",
    description: "Increased Social & Community Participation",
    weekday: 67.56,
    weekdayEvening: 74.32,
    saturday: 94.78,
    sunday: 122.01,
    publicHoliday: 149.23,
  },
  {
    supportItemNumber: "10_001_0102_5_3",
    description: "Finding & Keeping a Job",
    weekday: 67.56,
    weekdayEvening: 74.32,
    saturday: 94.78,
    sunday: 122.01,
    publicHoliday: 149.23,
  },
  {
    supportItemNumber: "11_022_0117_1_3",
    description: "Improved Health & Wellbeing",
    weekday: 67.56,
    weekdayEvening: 74.32,
    saturday: 94.78,
    sunday: 122.01,
    publicHoliday: 149.23,
  },
  {
    supportItemNumber: "15_037_0117_1_3",
    description: "Improved Daily Living — Therapy Support",
    weekday: 193.99,
    weekdayEvening: 193.99,
    saturday: 193.99,
    sunday: 193.99,
    publicHoliday: 193.99,
  },
];

export function getRateForDayType(rate: NdisRate, date: Date): number {
  const day = date.getDay();
  const hour = date.getHours();
  if (day === 0) return rate.sunday;
  if (day === 6) return rate.saturday;
  if (hour >= 20 || hour < 6) return rate.weekdayEvening;
  return rate.weekday;
}
