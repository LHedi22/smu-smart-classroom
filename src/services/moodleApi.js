// src/services/moodleApi.js
import axios from "axios";
import { auth } from "../firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL,
  timeout: 8000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Professor ──────────────────────────────────────────────────

export const getProfessor = (moodleUserId) =>
  api.get(`/api/professors/${moodleUserId}`).then(r => r.data);

export const getProfessorCourses = (moodleUserId) =>
  api.get('/api/moodle/courses').then(r => r.data);

// ── Courses ────────────────────────────────────────────────────

export const getCourseStudents = (courseId) =>
  api.get(`/api/courses/${courseId}/students`).then(r => r.data);

export const getCourseSchedule = (courseId) =>
  api.get(`/api/courses/${courseId}/schedule`).then(r => r.data);

// ── Students ───────────────────────────────────────────────────

export const getStudent = (studentId) =>
  api.get(`/api/students/${studentId}`).then(r => r.data);
