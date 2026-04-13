// src/hooks/useProfessorData.js
import { useState, useEffect } from "react";
import { getProfessorCourses } from "../services/moodleApi";
import { useAuth } from "../context/AuthContext";

export function useProfessorData() {
  const { profile }          = useAuth();        // from Firebase
  const [courses, setCourses]   = useState([]);
  const [schedule, setSchedule] = useState([]);  // flat list of all slots
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!profile?.moodleUserId) return;

    const load = async () => {
      try {
        setLoading(true);
        const coursesData = await getProfessorCourses(profile.moodleUserId);
        setCourses(coursesData);

        // Flatten schedule across all courses for easy "today's classes" lookup
        const allSlots = coursesData.flatMap(course =>
          course.schedule.map(slot => ({
            ...slot,
            courseId:       course.id,
            courseShortname: course.shortname,
            courseFullname:  course.fullname,
          }))
        );
        setSchedule(allSlots);
      } catch (err) {
        setError("Could not load courses. Is Flask running?");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profile?.moodleUserId]);

  return { courses, schedule, loading, error };
}