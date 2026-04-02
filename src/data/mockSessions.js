export const MOCK_SESSIONS = [
  // S26 — CS102 Object Oriented Programming (A101, Mon/Wed 09:00–10:30)
  { id: 'sess_cs102_20260401', courseId: 'CS102', courseName: 'Object Oriented Programming', roomId: 'A101', date: '2026-04-01', startTime: '09:00', endTime: '10:30', attendanceRate: 90.6, moodleSynced: false, envSummary: { avgTemp: 24.5, avgCO2: 710, avgNoise: 54 } },
  { id: 'sess_cs102_20260330', courseId: 'CS102', courseName: 'Object Oriented Programming', roomId: 'A101', date: '2026-03-30', startTime: '09:00', endTime: '10:30', attendanceRate: 87.5, moodleSynced: true,  envSummary: { avgTemp: 23.8, avgCO2: 680, avgNoise: 51 } },
  { id: 'sess_cs102_20260326', courseId: 'CS102', courseName: 'Object Oriented Programming', roomId: 'A101', date: '2026-03-26', startTime: '09:00', endTime: '10:30', attendanceRate: 93.8, moodleSynced: true,  envSummary: { avgTemp: 22.9, avgCO2: 590, avgNoise: 47 } },
  { id: 'sess_cs102_20260324', courseId: 'CS102', courseName: 'Object Oriented Programming', roomId: 'A101', date: '2026-03-24', startTime: '09:00', endTime: '10:30', attendanceRate: 84.4, moodleSynced: true,  envSummary: { avgTemp: 25.1, avgCO2: 740, avgNoise: 58 } },
  { id: 'sess_cs102_20260319', courseId: 'CS102', courseName: 'Object Oriented Programming', roomId: 'A101', date: '2026-03-19', startTime: '09:00', endTime: '10:30', attendanceRate: 96.9, moodleSynced: true,  envSummary: { avgTemp: 23.2, avgCO2: 620, avgNoise: 49 } },
  { id: 'sess_cs102_20260317', courseId: 'CS102', courseName: 'Object Oriented Programming', roomId: 'A101', date: '2026-03-17', startTime: '09:00', endTime: '10:30', attendanceRate: 81.3, moodleSynced: true,  envSummary: { avgTemp: 24.0, avgCO2: 660, avgNoise: 52 } },
  { id: 'sess_cs102_20260312', courseId: 'CS102', courseName: 'Object Oriented Programming', roomId: 'A101', date: '2026-03-12', startTime: '09:00', endTime: '10:30', attendanceRate: 87.5, moodleSynced: true,  envSummary: { avgTemp: 22.6, avgCO2: 570, avgNoise: 45 } },

  // S26 — MATH243 Discrete Mathematics (C303, Tue/Thu 11:00–12:30)
  { id: 'sess_math243_20260401', courseId: 'MATH243', courseName: 'Discrete Mathematics', roomId: 'C303', date: '2026-04-01', startTime: '11:00', endTime: '12:30', attendanceRate: 80.0, moodleSynced: false, envSummary: { avgTemp: 21.8, avgCO2: 490, avgNoise: 32 } },
  { id: 'sess_math243_20260331', courseId: 'MATH243', courseName: 'Discrete Mathematics', roomId: 'C303', date: '2026-03-31', startTime: '11:00', endTime: '12:30', attendanceRate: 83.3, moodleSynced: true,  envSummary: { avgTemp: 22.4, avgCO2: 510, avgNoise: 35 } },
  { id: 'sess_math243_20260327', courseId: 'MATH243', courseName: 'Discrete Mathematics', roomId: 'C303', date: '2026-03-27', startTime: '11:00', endTime: '12:30', attendanceRate: 86.7, moodleSynced: true,  envSummary: { avgTemp: 21.5, avgCO2: 460, avgNoise: 29 } },
  { id: 'sess_math243_20260325', courseId: 'MATH243', courseName: 'Discrete Mathematics', roomId: 'C303', date: '2026-03-25', startTime: '11:00', endTime: '12:30', attendanceRate: 76.7, moodleSynced: true,  envSummary: { avgTemp: 23.0, avgCO2: 540, avgNoise: 38 } },
  { id: 'sess_math243_20260320', courseId: 'MATH243', courseName: 'Discrete Mathematics', roomId: 'C303', date: '2026-03-20', startTime: '11:00', endTime: '12:30', attendanceRate: 90.0, moodleSynced: true,  envSummary: { avgTemp: 22.1, avgCO2: 480, avgNoise: 31 } },
  { id: 'sess_math243_20260318', courseId: 'MATH243', courseName: 'Discrete Mathematics', roomId: 'C303', date: '2026-03-18', startTime: '11:00', endTime: '12:30', attendanceRate: 83.3, moodleSynced: true,  envSummary: { avgTemp: 21.9, avgCO2: 500, avgNoise: 33 } },

  // S26 — ISS196 Freshman Project (B204, Wed 14:00–15:30)
  { id: 'sess_iss196_20260401', courseId: 'ISS196', courseName: 'Freshman Project', roomId: 'B204', date: '2026-04-01', startTime: '14:00', endTime: '15:30', attendanceRate: 89.3, moodleSynced: false, envSummary: { avgTemp: 23.1, avgCO2: 530, avgNoise: 41 } },
  { id: 'sess_iss196_20260326', courseId: 'ISS196', courseName: 'Freshman Project', roomId: 'B204', date: '2026-03-26', startTime: '14:00', endTime: '15:30', attendanceRate: 85.7, moodleSynced: true,  envSummary: { avgTemp: 24.3, avgCO2: 600, avgNoise: 46 } },
  { id: 'sess_iss196_20260319', courseId: 'ISS196', courseName: 'Freshman Project', roomId: 'B204', date: '2026-03-19', startTime: '14:00', endTime: '15:30', attendanceRate: 92.9, moodleSynced: true,  envSummary: { avgTemp: 22.7, avgCO2: 475, avgNoise: 39 } },
  { id: 'sess_iss196_20260312', courseId: 'ISS196', courseName: 'Freshman Project', roomId: 'B204', date: '2026-03-12', startTime: '14:00', endTime: '15:30', attendanceRate: 78.6, moodleSynced: true,  envSummary: { avgTemp: 25.0, avgCO2: 680, avgNoise: 50 } },
  { id: 'sess_iss196_20260305', courseId: 'ISS196', courseName: 'Freshman Project', roomId: 'B204', date: '2026-03-05', startTime: '14:00', endTime: '15:30', attendanceRate: 82.1, moodleSynced: true,  envSummary: { avgTemp: 23.5, avgCO2: 555, avgNoise: 43 } },

  // F25 — CS101 Introduction to Programming (A101)
  { id: 'sess_cs101_20251205', courseId: 'CS101', courseName: 'Introduction to Programming', roomId: 'A101', date: '2025-12-05', startTime: '09:00', endTime: '10:30', attendanceRate: 88.2, moodleSynced: true, envSummary: { avgTemp: 20.4, avgCO2: 510, avgNoise: 44 } },
  { id: 'sess_cs101_20251203', courseId: 'CS101', courseName: 'Introduction to Programming', roomId: 'A101', date: '2025-12-03', startTime: '09:00', endTime: '10:30', attendanceRate: 82.4, moodleSynced: true, envSummary: { avgTemp: 21.1, avgCO2: 560, avgNoise: 48 } },
  { id: 'sess_cs101_20251128', courseId: 'CS101', courseName: 'Introduction to Programming', roomId: 'A101', date: '2025-11-28', startTime: '09:00', endTime: '10:30', attendanceRate: 91.2, moodleSynced: true, envSummary: { avgTemp: 19.8, avgCO2: 490, avgNoise: 42 } },

  // F25 — MATH141 Calculus I (C303)
  { id: 'sess_math141_20251204', courseId: 'MATH141', courseName: 'Calculus I', roomId: 'C303', date: '2025-12-04', startTime: '11:00', endTime: '12:30', attendanceRate: 79.3, moodleSynced: true, envSummary: { avgTemp: 20.9, avgCO2: 470, avgNoise: 28 } },
  { id: 'sess_math141_20251202', courseId: 'MATH141', courseName: 'Calculus I', roomId: 'C303', date: '2025-12-02', startTime: '11:00', endTime: '12:30', attendanceRate: 86.2, moodleSynced: true, envSummary: { avgTemp: 21.3, avgCO2: 495, avgNoise: 31 } },
  { id: 'sess_math141_20251127', courseId: 'MATH141', courseName: 'Calculus I', roomId: 'C303', date: '2025-11-27', startTime: '11:00', endTime: '12:30', attendanceRate: 72.4, moodleSynced: true, envSummary: { avgTemp: 20.1, avgCO2: 440, avgNoise: 26 } },
]
