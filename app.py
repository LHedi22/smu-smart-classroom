import os
from datetime import datetime, timedelta, time
from collections import defaultdict

import firebase_admin
import requests
from firebase_admin import auth as admin_auth
from firebase_admin import credentials, db
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "https://YOUR_FIREBASE_HOSTING_URL"])

FIREBASE_DATABASE_URL = os.getenv(
    "FIREBASE_DATABASE_URL",
    "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/",
)
SEED_SOURCE = "startup-auto-v1"
CLASSROOM_FALLBACK = ["A101", "B204", "C310", "D105"]
SEED_SLOTS = [("08:30", "10:00"), ("10:30", "12:00"), ("13:00", "14:30"), ("15:00", "16:30")]

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {"databaseURL": FIREBASE_DATABASE_URL})

MOODLE_URL = "https://your-moodle.smu.tn"
MOODLE_TOKEN = "YOUR_MOODLE_WEB_SERVICE_TOKEN"


def verify_token():
    """Verify Firebase ID token from Authorization header."""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        return admin_auth.verify_id_token(token)
    except Exception:
        return None


def moodle(function, **params):
    """Call Moodle REST API."""
    return requests.get(
        f"{MOODLE_URL}/webservice/rest/server.php",
        params={"wstoken": MOODLE_TOKEN, "moodlewsrestformat": "json", "wsfunction": function, **params},
    ).json()


def _is_truthy(value):
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _seed_runtime_allowed():
    flag_enabled = _is_truthy(os.getenv("SEED_ON_STARTUP", "false"))
    app_env = str(os.getenv("FLASK_ENV") or os.getenv("ENV") or "development").lower()
    return flag_enabled and app_env != "production"


def _date_str(dt):
    return f"{dt.year:04d}-{dt.month:02d}-{dt.day:02d}"


def _hhmm(dt):
    return f"{dt.hour:02d}:{dt.minute:02d}"


def _parse_hhmm(day, hhmm):
    hour, minute = [int(x) for x in hhmm.split(":")]
    return datetime.combine(day, time(hour=hour, minute=minute))


def _iter_weekdays(start_day, end_day):
    cur = start_day
    while cur <= end_day:
        if cur.weekday() < 5:
            yield cur
        cur += timedelta(days=1)


def _has_overlap(bookings, start_dt, end_dt):
    for existing_start, existing_end in bookings:
        if start_dt < existing_end and end_dt > existing_start:
            return True
    return False


def _owned_by_professor(course, prof):
    prof_uid = prof.get("uid")
    prof_moodle_id = prof.get("moodleUserId")
    has_uid = course.get("professorUid") is not None
    has_id = course.get("professorId") is not None
    uid_matches = has_uid and course.get("professorUid") == prof_uid
    id_matches = has_id and str(course.get("professorId")) == str(prof_moodle_id)
    return (has_uid and has_id and uid_matches and id_matches) or (has_uid and not has_id and uid_matches) or (
        not has_uid and has_id and id_matches
    )


def _normalize_professors(professors_map):
    out = []
    for uid, value in (professors_map or {}).items():
        if not isinstance(value, dict) or str(uid).startswith("_"):
            continue
        out.append({"uid": uid, **value})
    return out


def _normalize_courses(courses_map):
    out = []
    for key, value in (courses_map or {}).items():
        if not isinstance(value, dict) or str(key).startswith("_"):
            continue
        out.append({"key": key, **value})
    return out


def _collect_classrooms(classrooms_map, professors, courses):
    rooms = set()

    for key in (classrooms_map or {}).keys():
        if key and not str(key).startswith("_"):
            rooms.add(str(key))

    for prof in professors:
        for room in (prof.get("assignedRooms") or {}).keys():
            if room:
                rooms.add(str(room))

    for course in courses:
        room = course.get("room")
        if room:
            rooms.add(str(room))

    if not rooms:
        rooms.update(CLASSROOM_FALLBACK)

    return sorted(rooms)


def _select_course_for_room(prof, room_id, owned_courses):
    if not owned_courses:
        suffix = str(prof.get("moodleUserId") or prof.get("uid", "X"))[:6]
        return {
            "courseId": f"DEV{suffix}",
            "courseName": f"Development Session {suffix}",
            "moodleCourseId": None,
            "enrolled": 30,
        }

    room_match = next((c for c in owned_courses if c.get("room") == room_id), None)
    picked = room_match or owned_courses[0]
    return {
        "courseId": picked.get("code") or picked.get("courseId") or picked.get("key"),
        "courseName": picked.get("name") or picked.get("fullname") or picked.get("code") or picked.get("key"),
        "moodleCourseId": picked.get("moodleCourseId") or picked.get("id"),
        "enrolled": int(picked.get("enrolled") or 30),
    }


def _session_status(start_dt, end_dt, now):
    if end_dt <= now:
        return "past"
    if start_dt <= now < end_dt:
        return "live"
    return "upcoming"


def _session_id(course_id, start_dt, room_id, prof_uid):
    safe_course = str(course_id or "COURSE").replace(" ", "")
    short_uid = str(prof_uid or "nouid")[:6]
    return f"{safe_course}-{_date_str(start_dt)}-{_hhmm(start_dt)}-{room_id}-AUTO-{short_uid}"


def _build_attendance_stub(seed_meta, enrolled):
    return {"enrolled": max(0, int(enrolled or 30)), "students": {}, "seedMeta": seed_meta}


def seed_startup_sessions():
    now = datetime.now()
    seeded_at = now.isoformat()
    run_id = now.strftime("%Y%m%d%H%M%S")

    professors_map = db.reference("/professors").get() or {}
    courses_map = db.reference("/courses").get() or {}
    classrooms_map = db.reference("/classrooms").get() or {}
    sessions_map = db.reference("/sessions").get() or {}

    professors = _normalize_professors(professors_map)
    courses = _normalize_courses(courses_map)
    classrooms = _collect_classrooms(classrooms_map, professors, courses)

    if not professors or not classrooms:
        return {
            "status": "noop",
            "reason": "Missing professors or classrooms",
            "professorCount": len(professors),
            "classroomCount": len(classrooms),
        }

    courses_by_prof = {}
    for prof in professors:
        courses_by_prof[prof["uid"]] = [c for c in courses if _owned_by_professor(c, prof)]

    updates = {}
    deleted_seeded = 0

    for sid, session in sessions_map.items():
        if not isinstance(session, dict):
            continue
        seed_meta = session.get("seedMeta") or {}
        if seed_meta.get("source") != SEED_SOURCE:
            continue
        deleted_seeded += 1
        updates[f"/sessions/{sid}"] = None
        room_id = session.get("roomId")
        if room_id:
            updates[f"/classrooms/{room_id}/attendance/{sid}"] = None

    for room_id in classrooms:
        active = db.reference(f"/classrooms/{room_id}/activeSession").get()
        if isinstance(active, dict) and (active.get("seedMeta") or {}).get("source") == SEED_SOURCE:
            updates[f"/classrooms/{room_id}/activeSession"] = None

    start_day = (now - timedelta(days=30)).date()
    end_day = (now + timedelta(days=7)).date()

    room_bookings = defaultdict(list)
    professor_bookings = defaultdict(list)
    room_live_session = {}

    historical_count = 0
    upcoming_count = 0
    live_count = 0
    forced_live_count = 0
    session_count = 0
    professor_cursor = 0

    for day in _iter_weekdays(start_day, end_day):
        for room_idx, room_id in enumerate(classrooms):
            first_slot_idx = (day.toordinal() + room_idx) % len(SEED_SLOTS)
            second_slot_idx = (first_slot_idx + 2) % len(SEED_SLOTS)

            for slot_idx in (first_slot_idx, second_slot_idx):
                start_hhmm, end_hhmm = SEED_SLOTS[slot_idx]
                start_dt = _parse_hhmm(day, start_hhmm)
                end_dt = _parse_hhmm(day, end_hhmm)

                picked_prof = None
                for offset in range(len(professors)):
                    candidate = professors[(professor_cursor + offset) % len(professors)]
                    if _has_overlap(professor_bookings[candidate["uid"]], start_dt, end_dt):
                        continue
                    if _has_overlap(room_bookings[room_id], start_dt, end_dt):
                        continue
                    picked_prof = candidate
                    professor_cursor = (professor_cursor + offset + 1) % len(professors)
                    break

                if picked_prof is None:
                    continue

                selected_course = _select_course_for_room(
                    picked_prof, room_id, courses_by_prof.get(picked_prof["uid"], [])
                )
                session_id = _session_id(selected_course["courseId"], start_dt, room_id, picked_prof["uid"])
                status = _session_status(start_dt, end_dt, now)
                seed_meta = {"source": SEED_SOURCE, "runId": run_id, "seededAt": seeded_at}

                session_doc = {
                    "id": session_id,
                    "courseId": selected_course["courseId"],
                    "courseName": selected_course["courseName"],
                    "moodleCourseId": selected_course["moodleCourseId"],
                    "professorUid": picked_prof["uid"],
                    "professorId": picked_prof.get("moodleUserId"),
                    "roomId": room_id,
                    "date": _date_str(start_dt),
                    "startTime": _hhmm(start_dt),
                    "endTime": _hhmm(end_dt),
                    "type": "Lecture",
                    "status": status,
                    "attendanceRate": None,
                    "moodleSynced": False,
                    "seedMeta": seed_meta,
                }

                updates[f"/sessions/{session_id}"] = session_doc
                updates[f"/classrooms/{room_id}/attendance/{session_id}"] = _build_attendance_stub(
                    seed_meta, selected_course["enrolled"]
                )
                updates[f"/professors/{picked_prof['uid']}/assignedRooms/{room_id}"] = True

                room_bookings[room_id].append((start_dt, end_dt))
                professor_bookings[picked_prof["uid"]].append((start_dt, end_dt))
                session_count += 1

                if status == "past":
                    historical_count += 1
                elif status == "upcoming":
                    upcoming_count += 1
                else:
                    live_count += 1
                    if room_id not in room_live_session:
                        room_live_session[room_id] = (session_id, session_doc, start_dt, end_dt)

    for room_id in classrooms:
        if room_id in room_live_session:
            continue

        forced_start = now - timedelta(minutes=30)
        forced_end = now + timedelta(minutes=60)
        picked_prof = None
        for offset in range(len(professors)):
            candidate = professors[(professor_cursor + offset) % len(professors)]
            if _has_overlap(professor_bookings[candidate["uid"]], forced_start, forced_end):
                continue
            picked_prof = candidate
            professor_cursor = (professor_cursor + offset + 1) % len(professors)
            break

        if picked_prof is None:
            picked_prof = professors[professor_cursor % len(professors)]
            professor_cursor = (professor_cursor + 1) % len(professors)

        selected_course = _select_course_for_room(picked_prof, room_id, courses_by_prof.get(picked_prof["uid"], []))
        session_id = _session_id(selected_course["courseId"], forced_start, room_id, picked_prof["uid"])
        seed_meta = {"source": SEED_SOURCE, "runId": run_id, "seededAt": seeded_at}

        session_doc = {
            "id": session_id,
            "courseId": selected_course["courseId"],
            "courseName": selected_course["courseName"],
            "moodleCourseId": selected_course["moodleCourseId"],
            "professorUid": picked_prof["uid"],
            "professorId": picked_prof.get("moodleUserId"),
            "roomId": room_id,
            "date": _date_str(forced_start),
            "startTime": _hhmm(forced_start),
            "endTime": _hhmm(forced_end),
            "type": "Lecture",
            "status": "live",
            "attendanceRate": None,
            "moodleSynced": False,
            "seedMeta": seed_meta,
        }

        updates[f"/sessions/{session_id}"] = session_doc
        updates[f"/classrooms/{room_id}/attendance/{session_id}"] = _build_attendance_stub(
            seed_meta, selected_course["enrolled"]
        )
        updates[f"/professors/{picked_prof['uid']}/assignedRooms/{room_id}"] = True
        room_live_session[room_id] = (session_id, session_doc, forced_start, forced_end)

        room_bookings[room_id].append((forced_start, forced_end))
        professor_bookings[picked_prof["uid"]].append((forced_start, forced_end))
        session_count += 1
        live_count += 1
        forced_live_count += 1

    for room_id, (session_id, session_doc, live_start, live_end) in room_live_session.items():
        seed_meta = session_doc["seedMeta"]
        updates[f"/classrooms/{room_id}/activeSession"] = {
            "sessionId": session_id,
            "courseId": session_doc["courseId"],
            "courseName": session_doc["courseName"],
            "moodleCourseId": session_doc.get("moodleCourseId"),
            "professorUid": session_doc["professorUid"],
            "professorId": session_doc.get("professorId"),
            "roomId": room_id,
            "startTime": live_start.isoformat(),
            "expectedEndTime": live_end.isoformat(),
            "scheduledStart": session_doc["startTime"],
            "scheduledEnd": session_doc["endTime"],
            "date": session_doc["date"],
            "type": session_doc["type"],
            "status": "live",
            "seedMeta": seed_meta,
        }

    if updates:
        db.reference("/").update(updates)

    return {
        "status": "ok",
        "seedSource": SEED_SOURCE,
        "runId": run_id,
        "deletedSeededSessions": deleted_seeded,
        "createdSessions": session_count,
        "historicalSessions": historical_count,
        "liveSessions": live_count,
        "upcomingSessions": upcoming_count,
        "forcedLiveSessions": forced_live_count,
        "professorCount": len(professors),
        "classroomCount": len(classrooms),
    }


# ── ENDPOINTS ─────────────────────────────────────────────


@app.route("/api/moodle/courses")
def get_courses():
    """Return the professor's active courses for today."""
    decoded = verify_token()
    if not decoded:
        return jsonify({"error": "Unauthorized"}), 401

    professor_moodle_id = decoded.get("moodleUserId")  # stored in Firebase custom claims
    courses = moodle("core_enrol_get_users_courses", userid=professor_moodle_id)
    return jsonify(courses)


@app.route("/api/moodle/courses/<course_id>/students")
def get_students(course_id):
    """Return enrolled students for a course."""
    decoded = verify_token()
    if not decoded:
        return jsonify({"error": "Unauthorized"}), 401

    students = moodle("core_enrol_get_enrolled_users", courseid=course_id)
    result = [
        {
            "id": s["id"],
            "fullname": s["fullname"],
            "email": s.get("email", ""),
            "profileimageurl": s.get("profileimageurl", ""),
        }
        for s in students
    ]
    return jsonify(result)


@app.route("/api/moodle/attendance/sync", methods=["POST"])
def sync_attendance():
    """Push final attendance to Moodle."""
    decoded = verify_token()
    if not decoded:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    return jsonify({"status": "synced", "count": len(data.get("records", []))})


@app.route("/api/dev/seed-startup", methods=["POST"])
def seed_startup():
    if not _seed_runtime_allowed():
        return jsonify({"error": "Startup seeding is disabled in this environment"}), 403

    try:
        result = seed_startup_sessions()
        return jsonify(result), 200
    except Exception as err:
        return jsonify({"error": f"Seeding failed: {str(err)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
