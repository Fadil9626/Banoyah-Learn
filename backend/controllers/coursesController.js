const pool = require("../config/db");
const audit = require("../lib/audit");
const ai = require("../lib/ai");
const media = require("../lib/media");

// Load a course that belongs to the caller's org, or null.
async function ownedCourse(orgId, courseId) {
  const { rows } = await pool.query("SELECT * FROM courses WHERE id=$1 AND org_id=$2", [courseId, orgId]);
  return rows[0] || null;
}
// Verify a lesson/question's course belongs to the org; returns the parent course_id or null.
async function ownedChild(orgId, table, childId) {
  const { rows } = await pool.query(
    `SELECT c.id FROM ${table} t JOIN courses c ON c.id = t.course_id WHERE t.id=$1 AND c.org_id=$2`,
    [childId, orgId]
  );
  return rows[0]?.id || null;
}
const nextSort = async (table, courseId) => {
  const { rows } = await pool.query(`SELECT COALESCE(MAX(sort),-1)+1 AS n FROM ${table} WHERE course_id=$1`, [courseId]);
  return rows[0].n;
};

// ── Courses ─────────────────────────────────────────────────────────────────
const listCourses = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id)        AS lesson_count,
              (SELECT COUNT(*) FROM quiz_questions q WHERE q.course_id=c.id)  AS question_count
       FROM courses c WHERE c.org_id=$1 ORDER BY c.updated_at DESC`,
      [req.user.org_id]
    );
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const getCourse = async (req, res) => {
  try {
    const course = await ownedCourse(req.user.org_id, req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const lessons = (await pool.query("SELECT * FROM lessons WHERE course_id=$1 ORDER BY sort, id", [course.id])).rows;
    const questions = (await pool.query("SELECT * FROM quiz_questions WHERE course_id=$1 ORDER BY sort, id", [course.id])).rows;
    return res.json({ ...course, lessons, questions });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const createCourse = async (req, res) => {
  const { title, description, category, pass_mark, validity_months, shuffle_questions, max_attempts } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO courses (org_id, title, description, category, pass_mark, validity_months, shuffle_questions, max_attempts, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.org_id, title.trim(), description || null, category || null,
       clampPct(pass_mark, 70), monthsOrNull(validity_months), !!shuffle_questions, nonNegInt(max_attempts), req.user.id]
    );
    return res.status(201).json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const updateCourse = async (req, res) => {
  try {
    if (!(await ownedCourse(req.user.org_id, req.params.id))) return res.status(404).json({ message: "Course not found" });
    const sets = [], vals = []; let i = 1;
    const fmt = {
      title: (v) => String(v).trim(), description: (v) => v || null, category: (v) => v || null,
      pass_mark: (v) => clampPct(v, 70), validity_months: (v) => monthsOrNull(v),
      shuffle_questions: (v) => !!v, max_attempts: (v) => nonNegInt(v),
    };
    for (const [k, f] of Object.entries(fmt)) {
      if (req.body[k] !== undefined) { sets.push(`${k}=$${i++}`); vals.push(f(req.body[k])); }
    }
    if (!sets.length) return res.status(400).json({ message: "Nothing to update" });
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE courses SET ${sets.join(", ")}, updated_at=NOW() WHERE id=$${i} RETURNING *`, vals);
    return res.json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const deleteCourse = async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM courses WHERE id=$1 AND org_id=$2", [req.params.id, req.user.org_id]);
    if (!rowCount) return res.status(404).json({ message: "Course not found" });
    return res.json({ message: "Course deleted" });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// Publish requires at least one lesson and one quiz question.
const setStatus = async (req, res) => {
  const status = req.body.status === "published" ? "published" : "draft";
  try {
    const course = await ownedCourse(req.user.org_id, req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (status === "published") {
      const l = (await pool.query("SELECT COUNT(*) FROM lessons WHERE course_id=$1", [course.id])).rows[0].count;
      const q = (await pool.query("SELECT COUNT(*) FROM quiz_questions WHERE course_id=$1", [course.id])).rows[0].count;
      if (Number(l) < 1) return res.status(400).json({ message: "Add at least one lesson before publishing." });
      if (Number(q) < 1) return res.status(400).json({ message: "Add at least one quiz question before publishing." });
    }
    const { rows } = await pool.query("UPDATE courses SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *", [status, course.id]);
    audit.record(req, status === "published" ? "course.publish" : "course.unpublish", { target: course.title });
    return res.json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── Lessons ─────────────────────────────────────────────────────────────────
const addLesson = async (req, res) => {
  const { title, type, body, media_url } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Lesson title is required" });
  try {
    if (!(await ownedCourse(req.user.org_id, req.params.id))) return res.status(404).json({ message: "Course not found" });
    const t = ["text", "video", "pdf"].includes(type) ? type : "text";
    const sort = await nextSort("lessons", req.params.id);
    const { rows } = await pool.query(
      `INSERT INTO lessons (course_id, sort, title, type, body, media_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, sort, title.trim(), t, body || null, media_url || null]
    );
    await touch(req.params.id);
    return res.status(201).json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const updateLesson = async (req, res) => {
  try {
    const courseId = await ownedChild(req.user.org_id, "lessons", req.params.id);
    if (!courseId) return res.status(404).json({ message: "Lesson not found" });
    const sets = [], vals = []; let i = 1;
    const fmt = { title: (v) => String(v).trim(), type: (v) => (["text","video","pdf"].includes(v) ? v : "text"),
                  body: (v) => v || null, media_url: (v) => v || null };
    for (const [k, f] of Object.entries(fmt)) if (req.body[k] !== undefined) { sets.push(`${k}=$${i++}`); vals.push(f(req.body[k])); }
    if (!sets.length) return res.status(400).json({ message: "Nothing to update" });
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE lessons SET ${sets.join(", ")} WHERE id=$${i} RETURNING *`, vals);
    await touch(courseId);
    return res.json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const deleteLesson = async (req, res) => {
  try {
    const courseId = await ownedChild(req.user.org_id, "lessons", req.params.id);
    if (!courseId) return res.status(404).json({ message: "Lesson not found" });
    await pool.query("DELETE FROM lessons WHERE id=$1", [req.params.id]);
    await touch(courseId);
    return res.json({ message: "Lesson deleted" });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const reorderLessons = async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : null;
  if (!ids) return res.status(400).json({ message: "ids array required" });
  try {
    if (!(await ownedCourse(req.user.org_id, req.params.id))) return res.status(404).json({ message: "Course not found" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (let n = 0; n < ids.length; n++) {
        await client.query("UPDATE lessons SET sort=$1 WHERE id=$2 AND course_id=$3", [n, ids[n], req.params.id]);
      }
      await client.query("COMMIT");
    } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
    await touch(req.params.id);
    return res.json({ message: "Reordered" });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── Quiz questions ──────────────────────────────────────────────────────────
const addQuestion = async (req, res) => {
  const { prompt, options, correct_index } = req.body;
  const opts = Array.isArray(options) ? options.map((o) => String(o)).filter((o) => o.trim()) : [];
  if (!prompt?.trim()) return res.status(400).json({ message: "Question prompt is required" });
  if (opts.length < 2) return res.status(400).json({ message: "Provide at least two options" });
  const ci = Math.min(Math.max(0, parseInt(correct_index, 10) || 0), opts.length - 1);
  try {
    if (!(await ownedCourse(req.user.org_id, req.params.id))) return res.status(404).json({ message: "Course not found" });
    const sort = await nextSort("quiz_questions", req.params.id);
    const { rows } = await pool.query(
      `INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, sort, prompt.trim(), JSON.stringify(opts), ci]
    );
    await touch(req.params.id);
    return res.status(201).json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const updateQuestion = async (req, res) => {
  try {
    const courseId = await ownedChild(req.user.org_id, "quiz_questions", req.params.id);
    if (!courseId) return res.status(404).json({ message: "Question not found" });
    const sets = [], vals = []; let i = 1;
    if (req.body.prompt !== undefined) { sets.push(`prompt=$${i++}`); vals.push(String(req.body.prompt).trim()); }
    if (req.body.options !== undefined) {
      const opts = Array.isArray(req.body.options) ? req.body.options.map(String).filter((o) => o.trim()) : [];
      if (opts.length < 2) return res.status(400).json({ message: "Provide at least two options" });
      sets.push(`options=$${i++}`); vals.push(JSON.stringify(opts));
    }
    if (req.body.correct_index !== undefined) { sets.push(`correct_index=$${i++}`); vals.push(Math.max(0, parseInt(req.body.correct_index, 10) || 0)); }
    if (!sets.length) return res.status(400).json({ message: "Nothing to update" });
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE quiz_questions SET ${sets.join(", ")} WHERE id=$${i} RETURNING *`, vals);
    await touch(courseId);
    return res.json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const deleteQuestion = async (req, res) => {
  try {
    const courseId = await ownedChild(req.user.org_id, "quiz_questions", req.params.id);
    if (!courseId) return res.status(404).json({ message: "Question not found" });
    await pool.query("DELETE FROM quiz_questions WHERE id=$1", [req.params.id]);
    await touch(courseId);
    return res.json({ message: "Question deleted" });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── helpers ─────────────────────────────────────────────────────────────────
const touch = (courseId) => pool.query("UPDATE courses SET updated_at=NOW() WHERE id=$1", [courseId]);
const clampPct = (v, dflt) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : dflt; };
const monthsOrNull = (v) => { if (v === null || v === undefined || v === "") return null; const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : null; };
const nonNegInt = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : 0; };

// ── POST /api/courses/:id/questions/generate ─────────────────────────────────
// Draft quiz questions from the course's lessons with AI. Returns the questions
// for review — nothing is saved until the instructor confirms via /questions/bulk.
const generateQuestions = async (req, res) => {
  try {
    const course = await ownedCourse(req.user.org_id, req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const cfg = await ai.config(req.user.org_id);
    if (!ai.isConfigured(cfg))
      return res.status(400).json({ message: "Add an AI API key under Settings → AI to generate questions." });

    const lessons = (await pool.query(
      "SELECT title, type, body, media_url FROM lessons WHERE course_id=$1 ORDER BY sort, id", [course.id]
    )).rows;
    if (!lessons.length)
      return res.status(400).json({ message: "Add at least one lesson before generating questions." });

    // Pull text out of PDF lessons so the AI can read attached documents too.
    for (const l of lessons) {
      if (l.type === "pdf" && l.media_url) {
        try {
          const id = String(l.media_url).split("/").pop();
          const pdfText = await media.extractPdfText(id, req.user.org_id);
          if (pdfText) l.body = [l.body, pdfText].filter(Boolean).join("\n\n");
        } catch { /* unreadable/scanned PDF — skip, don't fail the whole request */ }
      }
    }

    const hasText = lessons.some((l) => (l.body || "").trim());
    if (!hasText)
      return res.status(400).json({ message: "No readable text found in your lessons (text or PDF). Add lesson text, or attach a text-based PDF." });

    const { questions } = await ai.generateQuestions(cfg, { course, lessons, count: req.body.count });
    audit.record(req, "course.quiz_generate", { target: course.title, details: { count: questions.length } });
    return res.json({ questions, model: cfg.model });
  } catch (e) { return res.status(e.status || 500).json({ message: e.message }); }
};

// ── POST /api/courses/:id/questions/bulk ─────────────────────────────────────
// Append a reviewed batch of questions to the course quiz.
const addQuestionsBulk = async (req, res) => {
  const input = Array.isArray(req.body.questions) ? req.body.questions : [];
  const clean = [];
  for (const q of input) {
    const opts = Array.isArray(q.options) ? q.options.map((o) => String(o)).filter((o) => o.trim()) : [];
    const prompt = String(q.prompt || "").trim();
    if (!prompt || opts.length < 2) continue;
    const ci = Math.min(Math.max(0, parseInt(q.correct_index, 10) || 0), opts.length - 1);
    clean.push({ prompt, options: opts, correct_index: ci });
  }
  if (!clean.length) return res.status(400).json({ message: "No valid questions to add" });
  try {
    if (!(await ownedCourse(req.user.org_id, req.params.id))) return res.status(404).json({ message: "Course not found" });
    // replace: swap the whole quiz instead of appending (stops regenerations
    // from piling up on top of each other).
    if (req.body.replace === true)
      await pool.query("DELETE FROM quiz_questions WHERE course_id=$1", [req.params.id]);
    let sort = await nextSort("quiz_questions", req.params.id);
    const out = [];
    for (const q of clean) {
      const { rows } = await pool.query(
        `INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [req.params.id, sort++, q.prompt, JSON.stringify(q.options), q.correct_index]
      );
      out.push(rows[0]);
    }
    await touch(req.params.id);
    return res.status(201).json({ added: out.length, questions: out });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── DELETE /api/courses/:id/questions ────────────────────────────────────────
// Clear the entire quiz for a course.
const clearQuestions = async (req, res) => {
  try {
    if (!(await ownedCourse(req.user.org_id, req.params.id))) return res.status(404).json({ message: "Course not found" });
    const { rowCount } = await pool.query("DELETE FROM quiz_questions WHERE course_id=$1", [req.params.id]);
    await touch(req.params.id);
    return res.json({ deleted: rowCount });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse, setStatus,
  addLesson, updateLesson, deleteLesson, reorderLessons,
  addQuestion, updateQuestion, deleteQuestion,
  generateQuestions, addQuestionsBulk, clearQuestions,
};
