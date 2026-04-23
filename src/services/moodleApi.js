// src/services/moodleApi.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL,
  timeout: 8000,
});

// ── Professor ──────────────────────────────────────────────────

export const getProfessor = (moodleUserId) =>
  api.get(`/api/professors/${moodleUserId}`).then(r => r.data);

export const getProfessorCourses = (moodleUserId) =>
  api.get(`/api/professors/${moodleUserId}/courses`).then(r => r.data)

export const getProfessorSessions = (moodleUserId, semester = 'S26') =>
  api.get(`/api/professors/${moodleUserId}/sessions`, { params: { semester } }).then(r => r.data);

// ── Courses ────────────────────────────────────────────────────

export const getCourseStudents = (courseId) =>
  api.get(`/api/courses/${courseId}/students`).then(r => r.data);

export const getCourseSchedule = (courseId) =>
  api.get(`/api/courses/${courseId}/schedule`).then(r => r.data);

// ── Students ───────────────────────────────────────────────────

export const getStudent = (studentId) =>
  api.get(`/api/students/${studentId}`).then(r => r.data);

// ── Sensors (history — written by collector.py) ────────────────

export const getSensorHistory = (roomId, { sensor, window = '1h', limit } = {}) =>
  api.get(`/api/classrooms/${roomId}/sensors/history`, {
    params: { sensor, window, limit },
  }).then(r => r.data);