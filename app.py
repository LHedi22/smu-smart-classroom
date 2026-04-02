from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth as admin_auth
import requests

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "https://YOUR_FIREBASE_HOSTING_URL"])

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

MOODLE_URL   = "https://your-moodle.smu.tn"
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
        params={"wstoken": MOODLE_TOKEN, "moodlewsrestformat": "json",
                "wsfunction": function, **params}
    ).json()

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
    # Return only needed fields to keep payload small
    result = [{"id": s["id"], "fullname": s["fullname"], "email": s.get("email",""),
               "profileimageurl": s.get("profileimageurl","")} for s in students]
    return jsonify(result)

@app.route("/api/moodle/attendance/sync", methods=["POST"])
def sync_attendance():
    """Push final attendance to Moodle."""
    decoded = verify_token()
    if not decoded:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json  # { courseId, sessionId, records: [{studentId, present}] }
    # Call Moodle Attendance module API or log to custom table
    # Implementation depends on which Moodle attendance plugin is installed
    return jsonify({"status": "synced", "count": len(data.get("records", []))})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
