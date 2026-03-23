import React from "react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* Helpers */
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function makeTs() {
  return new Date().toISOString();
}

function timeAgo(d) {
  var s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  if (s < 604800) return Math.floor(s / 86400) + "d";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* Design Tokens */
var THEMES = [
  { name: "Electric Blue", bg: "#EBF5FF", main: "#2563EB", dark: "#1E3A5F", lite: "#DBEAFE" },
  { name: "Hot Pink", bg: "#FFF0F6", main: "#DB2777", dark: "#5C1133", lite: "#FCE7F3" },
  { name: "Emerald", bg: "#ECFDF5", main: "#059669", dark: "#1B4332", lite: "#D1FAE5" },
  { name: "Sunset", bg: "#FFF7ED", main: "#EA580C", dark: "#5C2C0E", lite: "#FFEDD5" },
  { name: "Purple", bg: "#F3F0FF", main: "#7C3AED", dark: "#3B1A7E", lite: "#EDE9FE" },
  { name: "Cyan", bg: "#ECFEFF", main: "#0891B2", dark: "#164E63", lite: "#CFFAFE" },
  { name: "Rose", bg: "#FFF1F2", main: "#E11D48", dark: "#5C0B20", lite: "#FFE4E6" },
  { name: "Amber", bg: "#FFFBEB", main: "#D97706", dark: "#5C3D06", lite: "#FEF3C7" },
  { name: "Teal", bg: "#F0FDFA", main: "#0D9488", dark: "#134E4A", lite: "#CCFBF1" },
  { name: "Indigo", bg: "#EEF2FF", main: "#4F46E5", dark: "#2E2970", lite: "#E0E7FF" },
];

var EMOJIS = ["😊","😎","🔥","⚡","🌟","🎯","🚀","💎","🎮","🎵","🎨","🦊","🐱","🐶","🦋","🌸","🌈","🍀","📚","🌙","☀️","🧸","🦄","🐝","🌻","🎭","🔮","🪐","🍄","🐚","🦢","🌊","💫","🪴","🎈","🦜","🎪","🎸","🏰","🧩"];
var REACTS = ["❤️","👍","😂","😮","😢","🔥","💯","✨","🎉","👏","🤩","💕"];
var CLUB_EMOJIS = ["📖","🎵","🎨","🎮","🏃","🧑‍🍳","🔬","🌱","📸","🎬","♟️","✍️","🎲","🎤","🎹","🌍","🐾","🏆","🎭","🧪"];

var BLANK_DATA = {
  profiles: [], posts: [], comments: [], reactions: [],
  polls: [], pollVotes: [], convos: [], messages: [],
  connections: [], clubs: [], clubMsgs: [], quizzes: [], quizAttempts: []
};

var STORAGE_KEY = "myworld_v5";

async function loadData() {
  try {
    var r = localStorage.getItem(STORAGE_KEY);
    if (r) return JSON.parse(r);
    return deepClone(BLANK_DATA);
  } catch (e) {
    return deepClone(BLANK_DATA);
  }
}

async function saveData(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch (e) {
    console.error(e);
  }
}

/* Shared CSS-in-JS values */
var FONT = "'Nunito', 'Segoe UI', system-ui, sans-serif";
var CARD_STYLE = { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 12 };
var INPUT_STYLE = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E5E7EB", fontSize: 13, fontFamily: "inherit", background: "#FAFBFC", boxSizing: "border-box" };
var LABEL_STYLE = { display: "block", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 };

function pillStyle(color) {
  return { display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: color + "18", color: color };
}

/* ── Small UI Components ── */

function Btn(props) {
  var kind = props.kind || "default";
  var sm = props.sm;
  var disabled = props.disabled;
  var styles = {
    primary: { background: "linear-gradient(135deg, #7C3AED, #DB2777)", color: "#fff", boxShadow: "0 2px 8px rgba(124,58,237,0.3)" },
    danger: { background: "#FEE2E2", color: "#DC2626" },
    ghost: { background: "transparent", color: "#9CA3AF" },
    outline: { background: "transparent", color: "#6B7280", border: "2px solid #E5E7EB" },
    default: { background: "#F3F4F6", color: "#4B5563" },
  };
  var base = {
    padding: sm ? "5px 12px" : "10px 20px",
    fontSize: sm ? 11 : 13,
    borderRadius: 10,
    fontWeight: 700,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.35 : 1,
    fontFamily: "inherit",
    transition: "all 0.15s",
  };
  return React.createElement("button", {
    onClick: props.onClick,
    disabled: disabled,
    style: Object.assign({}, styles[kind], base, props.style || {})
  }, props.children);
}

function ModalDialog(props) {
  if (!props.open) return null;
  return React.createElement("div", {
    style: { position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    onClick: props.onClose
  },
    React.createElement("div", { style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" } }),
    React.createElement("div", {
      onClick: function(e) { e.stopPropagation(); },
      style: { position: "relative", background: "#fff", borderRadius: 20, width: "100%", maxWidth: props.wide ? 640 : 460, maxHeight: "85vh", overflowY: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }
    },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 } },
        React.createElement("h2", { style: { fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 } }, props.title),
        React.createElement("button", { onClick: props.onClose, style: { width: 30, height: 30, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", fontSize: 16, color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center" } }, "×")
      ),
      props.children
    )
  );
}

function EmptyBox(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", textAlign: "center" }}>
      <span style={{ fontSize: 52, marginBottom: 12 }}>{props.emoji}</span>
      <p style={{ fontSize: 16, fontWeight: 800, color: "#1F2937", margin: "0 0 4px" }}>{props.title}</p>
      <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 260, margin: 0, lineHeight: 1.5 }}>{props.sub}</p>
    </div>
  );
}

function Ava(props) {
  var p = props.p;
  var sz = props.sz || 34;
  return (
    <div style={{ width: sz, height: sz, borderRadius: sz * 0.3, background: p.theme.lite, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.5, flexShrink: 0, border: "2px solid " + p.theme.main + "30" }}>
      {p.emoji}
    </div>
  );
}

function PName(props) {
  var p = props.p;
  var sm = props.sm;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <Ava p={p} sz={sm ? 24 : 34} />
      <span style={{ fontWeight: 700, fontSize: sm ? 11 : 13, color: p.theme.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
    </div>
  );
}

function Fld(props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LABEL_STYLE}>{props.label}</label>
      {props.children}
    </div>
  );
}

/* ═══════════════ MAIN APP ═══════════════ */

export default function MyWorld() {
  var _s = useState(BLANK_DATA); var D = _s[0]; var setD = _s[1];
  var _r = useState(false); var ready = _r[0]; var setReady = _r[1];
  var _a = useState(null); var activeId = _a[0]; var setActiveId = _a[1];
  var _v = useState("feed"); var view = _v[0]; var setView = _v[1];
  var _m = useState(null); var modal = _m[0]; var setModal = _m[1];
  var _e = useState(null); var editTarget = _e[0]; var setEditTarget = _e[1];
  var _oc = useState(null); var openConvo = _oc[0]; var setOpenConvo = _oc[1];
  var _ocl = useState(null); var openClub = _ocl[0]; var setOpenClub = _ocl[1];
  var _oq = useState(null); var openQuiz = _oq[0]; var setOpenQuiz = _oq[1];
  var _pk = useState(false); var pickerOpen = _pk[0]; var setPickerOpen = _pk[1];
  var pickerRef = useRef(null);

  useEffect(function() {
    loadData().then(function(d) { setD(d); setReady(true); });
  }, []);

  useEffect(function() {
    if (ready) saveData(D);
  }, [D, ready]);

  useEffect(function() {
    function handler(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return function() { document.removeEventListener("mousedown", handler); };
  }, []);

  var mutate = useCallback(function(fn) {
    setD(function(prev) {
      var next = deepClone(prev);
      fn(next);
      return next;
    });
  }, []);

  var active = D.profiles.find(function(p) { return p.id === activeId; }) || null;
  var getProf = useCallback(function(pid) {
    return D.profiles.find(function(p) { return p.id === pid; });
  }, [D.profiles]);

  /* Profile CRUD */
  function profileSave(p) {
    mutate(function(d) {
      var idx = d.profiles.findIndex(function(x) { return x.id === p.id; });
      if (idx >= 0) { Object.assign(d.profiles[idx], p); }
      else { d.profiles.push(Object.assign({}, p, { id: makeId(), createdAt: makeTs() })); }
    });
    setModal(null);
    setEditTarget(null);
  }

  function profileDelete(pid) {
    if (activeId === pid) setActiveId(null);
    mutate(function(d) {
      d.profiles = d.profiles.filter(function(p) { return p.id !== pid; });
      d.posts = d.posts.filter(function(p) { return p.authorId !== pid; });
      d.comments = d.comments.filter(function(c) { return c.authorId !== pid; });
      d.reactions = d.reactions.filter(function(r) { return r.authorId !== pid; });
      d.pollVotes = d.pollVotes.filter(function(v) { return v.voterId !== pid; });
      d.messages = d.messages.filter(function(m) { return m.senderId !== pid; });
      d.clubMsgs = d.clubMsgs.filter(function(m) { return m.senderId !== pid; });
      d.quizAttempts = d.quizAttempts.filter(function(a) { return a.takerId !== pid; });
      d.connections = d.connections.filter(function(c) { return c.from !== pid && c.to !== pid; });
      d.clubs = d.clubs.map(function(c) {
        return Object.assign({}, c, {
          memberIds: c.memberIds.filter(function(x) { return x !== pid; }),
          leaderId: c.leaderId === pid ? (c.memberIds.find(function(x) { return x !== pid; }) || null) : c.leaderId
        });
      }).filter(function(c) { return c.memberIds.length > 0; });
    });
  }

  /* Posts */
  function postAdd(text) {
    if (!activeId || !text.trim()) return;
    mutate(function(d) { d.posts.unshift({ id: makeId(), authorId: activeId, text: text.trim(), createdAt: makeTs() }); });
  }
  function postEdit(postId, text) {
    mutate(function(d) { var p = d.posts.find(function(x) { return x.id === postId; }); if (p) p.text = text; });
  }
  function postDelete(postId) {
    mutate(function(d) {
      d.posts = d.posts.filter(function(p) { return p.id !== postId; });
      d.comments = d.comments.filter(function(c) { return c.postId !== postId; });
      d.reactions = d.reactions.filter(function(r) { return r.postId !== postId; });
    });
  }

  /* Comments */
  function commentAdd(postId, text) {
    if (!activeId || !text.trim()) return;
    mutate(function(d) { d.comments.push({ id: makeId(), postId: postId, authorId: activeId, text: text.trim(), createdAt: makeTs() }); });
  }
  function commentEdit(cid, text) {
    mutate(function(d) { var c = d.comments.find(function(x) { return x.id === cid; }); if (c) c.text = text; });
  }
  function commentDelete(cid) {
    mutate(function(d) { d.comments = d.comments.filter(function(c) { return c.id !== cid; }); });
  }

  /* Reactions */
  function reactToggle(postId, emoji) {
    if (!activeId) return;
    mutate(function(d) {
      var idx = d.reactions.findIndex(function(r) { return r.postId === postId && r.authorId === activeId && r.emoji === emoji; });
      if (idx >= 0) d.reactions.splice(idx, 1);
      else d.reactions.push({ id: makeId(), postId: postId, authorId: activeId, emoji: emoji });
    });
  }

  /* Polls */
  function pollAdd(question, options) {
    if (!activeId) return;
    mutate(function(d) { d.polls.unshift({ id: makeId(), authorId: activeId, question: question.trim(), options: options.map(function(o) { return o.trim(); }), createdAt: makeTs() }); });
  }
  function pollVote(pollId, optIdx) {
    if (!activeId) return;
    mutate(function(d) {
      d.pollVotes = d.pollVotes.filter(function(v) { return !(v.pollId === pollId && v.voterId === activeId); });
      d.pollVotes.push({ id: makeId(), pollId: pollId, voterId: activeId, optIdx: optIdx });
    });
  }
  function pollDelete(pollId) {
    mutate(function(d) {
      d.polls = d.polls.filter(function(p) { return p.id !== pollId; });
      d.pollVotes = d.pollVotes.filter(function(v) { return v.pollId !== pollId; });
    });
  }

  /* Conversations */
  function convoAdd(name, profileIds, kind) {
    var cid = makeId();
    mutate(function(d) { d.convos.push({ id: cid, name: name, profileIds: profileIds, kind: kind, createdAt: makeTs() }); });
    setOpenConvo(cid);
  }
  function msgSend(convoId, text) {
    if (!activeId || !text.trim()) return;
    mutate(function(d) { d.messages.push({ id: makeId(), convoId: convoId, senderId: activeId, text: text.trim(), createdAt: makeTs() }); });
  }
  function msgEdit(mid, text) {
    mutate(function(d) { var m = d.messages.find(function(x) { return x.id === mid; }); if (m) m.text = text; });
  }
  function msgDelete(mid) {
    mutate(function(d) { d.messages = d.messages.filter(function(m) { return m.id !== mid; }); });
  }
  function convoDelete(cid) {
    mutate(function(d) {
      d.convos = d.convos.filter(function(c) { return c.id !== cid; });
      d.messages = d.messages.filter(function(m) { return m.convoId !== cid; });
    });
    if (openConvo === cid) setOpenConvo(null);
  }

  /* Connections */
  function connAdd(a, b) {
    if (a === b) return;
    mutate(function(d) {
      var exists = d.connections.some(function(c) { return (c.from === a && c.to === b) || (c.from === b && c.to === a); });
      if (!exists) d.connections.push({ id: makeId(), from: a, to: b, createdAt: makeTs() });
    });
  }
  function connDelete(cid) {
    mutate(function(d) { d.connections = d.connections.filter(function(c) { return c.id !== cid; }); });
  }

  /* Clubs */
  function clubAdd(c) {
    mutate(function(d) { d.clubs.push(Object.assign({}, c, { id: makeId(), createdAt: makeTs() })); });
    setModal(null);
  }
  function clubEditFn(c) {
    mutate(function(d) {
      var idx = d.clubs.findIndex(function(x) { return x.id === c.id; });
      if (idx >= 0) Object.assign(d.clubs[idx], c);
    });
    setModal(null); setEditTarget(null);
  }
  function clubDelete(cid) {
    mutate(function(d) {
      var qids = d.quizzes.filter(function(q) { return q.clubId === cid; }).map(function(q) { return q.id; });
      d.clubs = d.clubs.filter(function(c) { return c.id !== cid; });
      d.clubMsgs = d.clubMsgs.filter(function(m) { return m.clubId !== cid; });
      d.quizzes = d.quizzes.filter(function(q) { return q.clubId !== cid; });
      d.quizAttempts = d.quizAttempts.filter(function(a) { return qids.indexOf(a.quizId) === -1; });
    });
    if (openClub === cid) setOpenClub(null);
  }
  function clubJoin(cid, pid) {
    mutate(function(d) {
      var c = d.clubs.find(function(x) { return x.id === cid; });
      if (c && c.memberIds.indexOf(pid) === -1) c.memberIds.push(pid);
    });
  }
  function clubLeave(cid, pid) {
    mutate(function(d) {
      var c = d.clubs.find(function(x) { return x.id === cid; });
      if (c) {
        c.memberIds = c.memberIds.filter(function(x) { return x !== pid; });
        if (c.leaderId === pid) c.leaderId = c.memberIds[0] || null;
      }
      d.clubs = d.clubs.filter(function(c) { return c.memberIds.length > 0; });
    });
  }
  function clubMsgSend(cid, text) {
    if (!activeId || !text.trim()) return;
    mutate(function(d) { d.clubMsgs.push({ id: makeId(), clubId: cid, senderId: activeId, text: text.trim(), createdAt: makeTs() }); });
  }
  function clubMsgDelete(mid) {
    mutate(function(d) { d.clubMsgs = d.clubMsgs.filter(function(m) { return m.id !== mid; }); });
  }

  /* Quizzes */
  function quizAdd(q) {
    mutate(function(d) { d.quizzes.push(Object.assign({}, q, { id: makeId(), createdAt: makeTs() })); });
    setModal(null);
  }
  function quizDelete(qid) {
    mutate(function(d) {
      d.quizzes = d.quizzes.filter(function(q) { return q.id !== qid; });
      d.quizAttempts = d.quizAttempts.filter(function(a) { return a.quizId !== qid; });
    });
  }
  function quizSubmit(qid, answers) {
    if (!activeId) return;
    mutate(function(d) {
      var q = d.quizzes.find(function(x) { return x.id === qid; });
      if (!q) return;
      var score = q.questions.reduce(function(s, x, i) { return s + (answers[i] === x.correctIdx ? 1 : 0); }, 0);
      d.quizAttempts.push({ id: makeId(), quizId: qid, takerId: activeId, answers: answers, score: score, total: q.questions.length, createdAt: makeTs() });
    });
  }

  /* Loading */
  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: FONT }}>
        <span style={{ fontSize: 48 }}>🌍</span>
      </div>
    );
  }

  var NAV = [
    { key: "feed", icon: "⚡", label: "Feed" },
    { key: "profiles", icon: "👥", label: "Profiles" },
    { key: "clubs", icon: "🏛️", label: "Clubs" },
    { key: "messages", icon: "💬", label: "Messages" },
    { key: "friends", icon: "💕", label: "Friends" },
  ];

  var currentNav = NAV.find(function(n) { return n.key === view; });

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: FONT, background: "#F1F5F9" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <nav style={{ width: 200, flexShrink: 0, background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #DB2777)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌍</div>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#111827" }}>MyWorld</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: 8 }}>
          {NAV.map(function(n) {
            return (
              <button key={n.key} onClick={function() { setView(n.key); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: 2, fontSize: 13, fontWeight: 700, background: view === n.key ? "#F3F4F6" : "transparent", color: view === n.key ? "#111827" : "#9CA3AF" }}>
                <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>
        {/* Header */}
        <header style={{ height: 56, background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1 }}>
            {currentNav ? currentNav.label : ""}
          </span>
          <div ref={pickerRef} style={{ position: "relative" }}>
            <button onClick={function() { setPickerOpen(!pickerOpen); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 10, background: "#F3F4F6", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {active ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Ava p={active} sz={24} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: active.theme.dark }}>{active.name}</span>
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Choose profile ▾</span>
              )}
            </button>
            {pickerOpen && (
              <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 6, width: 240, background: "#fff", borderRadius: 14, boxShadow: "0 10px 40px rgba(0,0,0,0.12)", border: "1px solid #E5E7EB", overflow: "hidden", zIndex: 50 }}>
                {D.profiles.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>No profiles yet</div>
                ) : (
                  D.profiles.map(function(p) {
                    return (
                      <button key={p.id} onClick={function() { setActiveId(p.id); setPickerOpen(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "none", cursor: "pointer", background: p.id === activeId ? "#F3F4F6" : "#fff", textAlign: "left", fontFamily: "inherit", borderBottom: "1px solid #F3F4F6" }}>
                        <Ava p={p} sz={28} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.theme.dark, flex: 1 }}>{p.name}</span>
                        {p.id === activeId && <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.theme.main }} />}
                      </button>
                    );
                  })
                )}
                {D.profiles.length > 0 && (
                  <button onClick={function() { setActiveId(null); setPickerOpen(false); }}
                    style={{ width: "100%", padding: "8px 14px", fontSize: 11, color: "#9CA3AF", background: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                    Deselect
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            {view === "feed" && (
              <FeedSection D={D} active={active} activeId={activeId} getProf={getProf}
                postAdd={postAdd} postEdit={postEdit} postDelete={postDelete}
                commentAdd={commentAdd} commentEdit={commentEdit} commentDelete={commentDelete}
                reactToggle={reactToggle} pollAdd={pollAdd} pollVote={pollVote} pollDelete={pollDelete} />
            )}
            {view === "profiles" && (
              <ProfilesSection D={D} setActiveId={setActiveId} setView={setView}
                profileDelete={profileDelete} setModal={setModal} setEditTarget={setEditTarget} />
            )}
            {view === "clubs" && (
              <ClubsSection D={D} active={active} activeId={activeId} getProf={getProf}
                openClub={openClub} setOpenClub={setOpenClub} openQuiz={openQuiz} setOpenQuiz={setOpenQuiz}
                clubAdd={clubAdd} clubEditFn={clubEditFn} clubDelete={clubDelete}
                clubJoin={clubJoin} clubLeave={clubLeave} clubMsgSend={clubMsgSend} clubMsgDelete={clubMsgDelete}
                quizAdd={quizAdd} quizDelete={quizDelete} quizSubmit={quizSubmit}
                setModal={setModal} setEditTarget={setEditTarget} />
            )}
            {view === "messages" && (
              <MessagesSection D={D} activeId={activeId} getProf={getProf}
                openConvo={openConvo} setOpenConvo={setOpenConvo}
                convoAdd={convoAdd} msgSend={msgSend} msgEdit={msgEdit} msgDelete={msgDelete} convoDelete={convoDelete}
                setModal={setModal} />
            )}
            {view === "friends" && (
              <FriendsSection D={D} getProf={getProf} connDelete={connDelete} setModal={setModal} />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ModalDialog open={modal === "profile"} onClose={function() { setModal(null); setEditTarget(null); }} title={editTarget ? "Edit Profile" : "New Profile"}>
        <ProfileForm initial={editTarget} onSave={profileSave} onCancel={function() { setModal(null); setEditTarget(null); }} />
      </ModalDialog>
      <ModalDialog open={modal === "connection"} onClose={function() { setModal(null); }} title="Connect Profiles">
        <ConnectionForm profiles={D.profiles} connections={D.connections} onSave={function(a, b) { connAdd(a, b); setModal(null); }} onCancel={function() { setModal(null); }} />
      </ModalDialog>
      <ModalDialog open={modal === "convo"} onClose={function() { setModal(null); }} title="New Chat">
        <ConvoForm profiles={D.profiles} onCreate={function(n, ids, k) { convoAdd(n, ids, k); setModal(null); setView("messages"); }} onCancel={function() { setModal(null); }} />
      </ModalDialog>
      <ModalDialog open={modal === "club"} onClose={function() { setModal(null); setEditTarget(null); }} title={editTarget ? "Edit Club" : "New Club"}>
        <ClubFormDialog initial={editTarget} profiles={D.profiles} onSave={editTarget ? clubEditFn : clubAdd} onCancel={function() { setModal(null); setEditTarget(null); }} />
      </ModalDialog>
      <ModalDialog open={modal === "quiz"} onClose={function() { setModal(null); }} title="Create Quiz" wide>
        <QuizFormDialog clubId={openClub} authorId={activeId} onSave={quizAdd} onCancel={function() { setModal(null); }} />
      </ModalDialog>
    </div>
  );
}

/* ═══════════════ FEED ═══════════════ */
function FeedSection(props) {
  var D = props.D, active = props.active, activeId = props.activeId, getProf = props.getProf;
  var _t = useState(""); var text = _t[0]; var setText = _t[1];
  var _m = useState("post"); var mode = _m[0]; var setMode = _m[1];
  var _pq = useState(""); var pollQ = _pq[0]; var setPollQ = _pq[1];
  var _po = useState(["", ""]); var pollOpts = _po[0]; var setPollOpts = _po[1];

  function submitPost() { if (text.trim()) { props.postAdd(text); setText(""); } }
  function submitPoll() {
    var valid = pollOpts.filter(function(o) { return o.trim(); });
    if (pollQ.trim() && valid.length >= 2) {
      props.pollAdd(pollQ, valid);
      setPollQ(""); setPollOpts(["", ""]); setMode("post");
    }
  }

  var feed = useMemo(function() {
    var posts = D.posts.map(function(p) { return Object.assign({}, p, { _kind: "post", _at: p.createdAt }); });
    var polls = D.polls.map(function(p) { return Object.assign({}, p, { _kind: "poll", _at: p.createdAt }); });
    return posts.concat(polls).sort(function(a, b) { return new Date(b._at) - new Date(a._at); });
  }, [D.posts, D.polls]);

  return (
    <div>
      {active && (
        <div style={Object.assign({}, CARD_STYLE, { borderLeft: "4px solid " + active.theme.main })}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <PName p={active} />
            <div style={{ display: "flex", gap: 4 }}>
              <Btn sm kind={mode === "post" ? "primary" : "outline"} onClick={function() { setMode("post"); }}>Post</Btn>
              <Btn sm kind={mode === "poll" ? "primary" : "outline"} onClick={function() { setMode("poll"); }}>Poll</Btn>
            </div>
          </div>
          {mode === "post" ? (
            <div>
              <textarea value={text} onChange={function(e) { setText(e.target.value); }} placeholder="What's happening in your world?" rows={3} style={Object.assign({}, INPUT_STYLE, { resize: "none" })} />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <Btn kind="primary" onClick={submitPost} disabled={!text.trim()}>Post</Btn>
              </div>
            </div>
          ) : (
            <div>
              <input value={pollQ} onChange={function(e) { setPollQ(e.target.value); }} placeholder="Ask a question..." style={Object.assign({}, INPUT_STYLE, { marginBottom: 8 })} />
              {pollOpts.map(function(o, i) {
                return (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input value={o} onChange={function(e) { var n = pollOpts.slice(); n[i] = e.target.value; setPollOpts(n); }} placeholder={"Option " + (i + 1)} style={INPUT_STYLE} />
                    {pollOpts.length > 2 && <Btn sm kind="ghost" onClick={function() { setPollOpts(pollOpts.filter(function(_, j) { return j !== i; })); }}>✕</Btn>}
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {pollOpts.length < 6 && <Btn sm kind="ghost" onClick={function() { setPollOpts(pollOpts.concat([""])); }}>+ Option</Btn>}
                <Btn kind="primary" onClick={submitPoll} disabled={!pollQ.trim() || pollOpts.filter(function(o) { return o.trim(); }).length < 2}>Create Poll</Btn>
              </div>
            </div>
          )}
        </div>
      )}
      {!active && D.profiles.length > 0 && (
        <div style={CARD_STYLE}>
          <p style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF", margin: 0 }}>Choose a profile to start posting</p>
        </div>
      )}
      {D.profiles.length === 0 && <EmptyBox emoji="🌍" title="Your world is empty" sub="Head to Profiles and create someone!" />}
      {feed.map(function(item) {
        if (item._kind === "poll") {
          return <PollCard key={item.id} poll={item} getProf={getProf} activeId={activeId} votes={D.pollVotes.filter(function(v) { return v.pollId === item.id; })} pollVote={props.pollVote} pollDelete={props.pollDelete} />;
        }
        var author = getProf(item.authorId);
        return <PostCard key={item.id} post={item} author={author} comments={D.comments.filter(function(c) { return c.postId === item.id; })} reactions={D.reactions.filter(function(r) { return r.postId === item.id; })} activeId={activeId} getProf={getProf} postEdit={props.postEdit} postDelete={props.postDelete} commentAdd={props.commentAdd} commentEdit={props.commentEdit} commentDelete={props.commentDelete} reactToggle={props.reactToggle} />;
      })}
      {feed.length === 0 && D.profiles.length > 0 && <EmptyBox emoji="📝" title="Nothing yet" sub="Write the first post in your world" />}
    </div>
  );
}

function PostCard(props) {
  var post = props.post, author = props.author, activeId = props.activeId, getProf = props.getProf;
  var _ed = useState(false); var editing = _ed[0]; var setEditing = _ed[1];
  var _et = useState(post.text); var editText = _et[0]; var setEditText = _et[1];
  var _ct = useState(""); var commentText = _ct[0]; var setCommentText = _ct[1];
  var _sc = useState(false); var showComments = _sc[0]; var setShowComments = _sc[1];
  var _sr = useState(false); var showReacts = _sr[0]; var setShowReacts = _sr[1];

  if (!author) return null;

  var grouped = {};
  props.reactions.forEach(function(r) { if (!grouped[r.emoji]) grouped[r.emoji] = []; grouped[r.emoji].push(r); });

  return (
    <div style={Object.assign({}, CARD_STYLE, { borderLeft: "4px solid " + author.theme.main })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <PName p={author} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{timeAgo(post.createdAt)}</span>
          <Btn sm kind="ghost" onClick={function() { setEditing(true); setEditText(post.text); }}>✏️</Btn>
          <Btn sm kind="ghost" onClick={function() { props.postDelete(post.id); }}>✕</Btn>
        </div>
      </div>
      {editing ? (
        <div>
          <textarea value={editText} onChange={function(e) { setEditText(e.target.value); }} rows={3} style={Object.assign({}, INPUT_STYLE, { resize: "none" })} />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn sm onClick={function() { setEditing(false); }}>Cancel</Btn>
            <Btn sm kind="primary" onClick={function() { props.postEdit(post.id, editText); setEditing(false); }}>Save</Btn>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: "#1F2937", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{post.text}</p>
      )}

      {/* Reactions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14, alignItems: "center" }}>
        {Object.keys(grouped).map(function(emoji) {
          var arr = grouped[emoji];
          var isActive = arr.some(function(r) { return r.authorId === activeId; });
          return (
            <button key={emoji} onClick={function() { props.reactToggle(post.id, emoji); }}
              style={{ padding: "4px 10px", borderRadius: 8, fontSize: 12, border: isActive ? "2px solid #7C3AED" : "2px solid #E5E7EB", cursor: "pointer", background: isActive ? "#EDE9FE" : "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              {emoji}<span style={{ color: "#6B7280", fontWeight: 700 }}>{arr.length}</span>
            </button>
          );
        })}
        <div style={{ position: "relative" }}>
          <Btn sm kind="ghost" onClick={function() { setShowReacts(!showReacts); }}>{showReacts ? "✕" : "😊"}</Btn>
          {showReacts && (
            <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 4, background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", padding: 8, display: "flex", flexWrap: "wrap", gap: 2, width: 200, zIndex: 10, border: "1px solid #E5E7EB" }}>
              {REACTS.map(function(e) {
                return <button key={e} onClick={function() { props.reactToggle(post.id, e); setShowReacts(false); }} style={{ fontSize: 18, cursor: "pointer", background: "transparent", border: "none", padding: 4 }}>{e}</button>;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <button onClick={function() { setShowComments(!showComments); }} style={{ marginTop: 10, fontSize: 11, color: "#9CA3AF", background: "transparent", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
        {"💬 " + props.comments.length + " " + (showComments ? "▴" : "▾")}
      </button>
      {showComments && (
        <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "3px solid " + author.theme.main + "20" }}>
          {props.comments.map(function(c) {
            var cp = getProf(c.authorId);
            if (!cp) return null;
            return (
              <div key={c.id} style={{ background: "#F9FAFB", borderRadius: 10, padding: 10, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <PName p={cp} sm />
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn sm kind="ghost" onClick={function() { props.commentDelete(c.id); }}>✕</Btn>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "#374151", margin: "6px 0 2px", lineHeight: 1.5 }}>{c.text}</p>
                <span style={{ fontSize: 9, color: "#D1D5DB" }}>{timeAgo(c.createdAt)}</span>
              </div>
            );
          })}
          {activeId && (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={commentText} onChange={function(e) { setCommentText(e.target.value); }}
                placeholder="Comment..."
                onKeyDown={function(e) { if (e.key === "Enter" && commentText.trim()) { props.commentAdd(post.id, commentText); setCommentText(""); } }}
                style={Object.assign({}, INPUT_STYLE, { fontSize: 12 })} />
              <Btn sm kind="primary" onClick={function() { if (commentText.trim()) { props.commentAdd(post.id, commentText); setCommentText(""); } }}>↑</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PollCard(props) {
  var poll = props.poll, activeId = props.activeId, votes = props.votes, getProf = props.getProf;
  var author = getProf(poll.authorId);
  if (!author) return null;
  var myVote = votes.find(function(v) { return v.voterId === activeId; });
  var total = votes.length;

  return (
    <div style={Object.assign({}, CARD_STYLE, { borderLeft: "4px solid " + author.theme.main })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <PName p={author} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{timeAgo(poll.createdAt)}</span>
          <Btn sm kind="ghost" onClick={function() { props.pollDelete(poll.id); }}>✕</Btn>
        </div>
      </div>
      <p style={{ fontWeight: 700, fontSize: 14, color: "#1F2937", margin: "0 0 10px" }}>{"📊 " + poll.question}</p>
      {poll.options.map(function(opt, i) {
        var count = votes.filter(function(v) { return v.optIdx === i; }).length;
        var pct = total > 0 ? Math.round(count / total * 100) : 0;
        var isSelected = myVote && myVote.optIdx === i;
        return (
          <button key={i} onClick={function() { if (activeId) props.pollVote(poll.id, i); }} disabled={!activeId}
            style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: isSelected ? "2px solid " + author.theme.main : "2px solid #E5E7EB", cursor: activeId ? "pointer" : "default", background: isSelected ? author.theme.lite : "#fff", marginBottom: 6, fontFamily: "inherit", color: "#374151" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{opt}</span>
              {count > 0 && <span style={pillStyle(author.theme.main)}>{pct + "%"}</span>}
            </div>
            {total > 0 && (
              <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: "#E5E7EB" }}>
                <div style={{ height: 4, borderRadius: 2, background: author.theme.main, transition: "width 0.4s", width: pct + "%" }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════ PROFILES ═══════════════ */
function ProfilesSection(props) {
  var D = props.D;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 700 }}>{D.profiles.length + " profile" + (D.profiles.length !== 1 ? "s" : "")}</span>
        <Btn kind="primary" onClick={function() { props.setEditTarget(null); props.setModal("profile"); }}>+ New Profile</Btn>
      </div>
      {D.profiles.length === 0 && <EmptyBox emoji="👥" title="No one here yet" sub="Create your first profile to bring your world to life" />}
      {D.profiles.map(function(p) {
        return (
          <div key={p.id} style={Object.assign({}, CARD_STYLE, { borderLeft: "4px solid " + p.theme.main })}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Ava p={p} sz={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: p.theme.dark, margin: 0 }}>{p.name}</h3>
                {p.desc && <p style={{ fontSize: 12, color: "#9CA3AF", margin: "2px 0 0" }}>{p.desc}</p>}
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {[p.theme.main, p.theme.lite, p.theme.dark].map(function(c, i) {
                    return <div key={i} style={{ width: 14, height: 14, borderRadius: 4, background: c, border: "1px solid #E5E7EB" }} />;
                  })}
                  <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, marginLeft: 4 }}>{p.theme.name}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Btn sm kind="primary" onClick={function() { props.setActiveId(p.id); props.setView("feed"); }}>Use</Btn>
                <Btn sm kind="outline" onClick={function() { props.setEditTarget(p); props.setModal("profile"); }}>✏️</Btn>
                <Btn sm kind="danger" onClick={function() { if (confirm("Delete " + p.name + "?")) props.profileDelete(p.id); }}>🗑</Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════ CLUBS (simplified for space) ═══════════════ */
function ClubsSection(props) {
  var D = props.D, activeId = props.activeId, getProf = props.getProf;
  var club = D.clubs.find(function(c) { return c.id === props.openClub; });

  if (club) {
    return <ClubDetail club={club} D={D} activeId={activeId} getProf={getProf} onBack={function() { props.setOpenClub(null); }} clubJoin={props.clubJoin} clubLeave={props.clubLeave} clubMsgSend={props.clubMsgSend} clubMsgDelete={props.clubMsgDelete} clubDelete={props.clubDelete} setModal={props.setModal} setEditTarget={props.setEditTarget} openQuiz={props.openQuiz} setOpenQuiz={props.setOpenQuiz} quizDelete={props.quizDelete} quizSubmit={props.quizSubmit} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 700 }}>{D.clubs.length + " club" + (D.clubs.length !== 1 ? "s" : "")}</span>
        {D.profiles.length >= 1 && <Btn kind="primary" onClick={function() { props.setEditTarget(null); props.setModal("club"); }}>+ New Club</Btn>}
      </div>
      {D.clubs.length === 0 && <EmptyBox emoji="🏛️" title="No clubs yet" sub="Create a club for your profiles to join" />}
      {D.clubs.map(function(c) {
        var leader = getProf(c.leaderId);
        var members = c.memberIds.map(function(mid) { return getProf(mid); }).filter(Boolean);
        return (
          <div key={c.id} onClick={function() { props.setOpenClub(c.id); }}
            style={Object.assign({}, CARD_STYLE, { borderLeft: "4px solid " + c.theme.main, cursor: "pointer" })}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: c.theme.lite, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{c.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: c.theme.dark, margin: 0 }}>{c.name}</h3>
                {c.desc && <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{c.desc}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c.theme.main }}>{members.length + " member" + (members.length !== 1 ? "s" : "")}</span>
                  {leader && <span style={pillStyle(c.theme.main)}>{"👑 " + leader.name}</span>}
                </div>
              </div>
              <span style={{ color: "#D1D5DB" }}>→</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClubDetail(props) {
  var club = props.club, D = props.D, activeId = props.activeId, getProf = props.getProf;
  var _tab = useState("meeting"); var tab = _tab[0]; var setTab = _tab[1];
  var _msg = useState(""); var msg = _msg[0]; var setMsg = _msg[1];
  var endRef = useRef(null);
  var msgs = D.clubMsgs.filter(function(m) { return m.clubId === club.id; });
  var quizzes = D.quizzes.filter(function(q) { return q.clubId === club.id; });
  var members = club.memberIds.map(function(mid) { return getProf(mid); }).filter(Boolean);
  var isLeader = activeId === club.leaderId;
  var isMember = club.memberIds.indexOf(activeId) !== -1;

  useEffect(function() { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  function send() { if (msg.trim()) { props.clubMsgSend(club.id, msg); setMsg(""); } }

  // Quiz view
  var quiz = D.quizzes.find(function(q) { return q.id === props.openQuiz; });
  if (quiz) {
    return <QuizPlayer quiz={quiz} club={club} activeId={activeId} getProf={getProf} attempts={D.quizAttempts.filter(function(a) { return a.quizId === quiz.id; })} onSubmit={props.quizSubmit} onBack={function() { props.setOpenQuiz(null); }} />;
  }

  return (
    <div>
      <div style={Object.assign({}, CARD_STYLE, { borderLeft: "4px solid " + club.theme.main })}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Btn sm kind="ghost" onClick={props.onBack}>← Back</Btn>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: club.theme.lite, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{club.emoji}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: club.theme.dark, margin: 0 }}>{club.name}</h2>
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {isLeader && <Btn sm kind="outline" onClick={function() { props.setEditTarget(club); props.setModal("club"); }}>Edit</Btn>}
            {activeId && !isMember && <Btn sm kind="primary" onClick={function() { props.clubJoin(club.id, activeId); }}>Join</Btn>}
            {activeId && isMember && !isLeader && <Btn sm kind="danger" onClick={function() { props.clubLeave(club.id, activeId); }}>Leave</Btn>}
            <Btn sm kind="danger" onClick={function() { if (confirm("Delete club?")) { props.clubDelete(club.id); props.onBack(); } }}>🗑</Btn>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#fff", borderRadius: 12, padding: 4 }}>
        {["meeting", "quizzes", "members"].map(function(t) {
          var labels = { meeting: "💬 Meeting", quizzes: "📝 Quizzes", members: "👥 Members" };
          return (
            <button key={t} onClick={function() { setTab(t); }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: tab === t ? "#F3F4F6" : "transparent", color: tab === t ? club.theme.dark : "#9CA3AF" }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {tab === "meeting" && (
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ height: 320, overflowY: "auto", padding: 16 }}>
            {msgs.length === 0 && <p style={{ textAlign: "center", fontSize: 12, color: "#D1D5DB", padding: "60px 0", fontWeight: 600 }}>Start the conversation</p>}
            {msgs.map(function(m) {
              var sender = getProf(m.senderId);
              if (!sender) return null;
              var isMe = m.senderId === activeId;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
                  <div style={{ maxWidth: "75%", borderRadius: 14, padding: "8px 14px", background: isMe ? sender.theme.lite : "#F3F4F6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11 }}>{sender.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: sender.theme.dark }}>{sender.name}</span>
                      {sender.id === club.leaderId && <span style={pillStyle(club.theme.main)}>👑</span>}
                      <span style={{ fontSize: 9, color: "#D1D5DB", marginLeft: "auto" }}>{timeAgo(m.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>{m.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          {activeId && isMember ? (
            <div style={{ padding: 12, borderTop: "1px solid #E5E7EB", display: "flex", gap: 8 }}>
              <input value={msg} onChange={function(e) { setMsg(e.target.value); }} placeholder="Say something..." onKeyDown={function(e) { if (e.key === "Enter") send(); }} style={INPUT_STYLE} />
              <Btn kind="primary" onClick={send} disabled={!msg.trim()}>Send</Btn>
            </div>
          ) : (
            <div style={{ padding: 12, borderTop: "1px solid #E5E7EB", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
              {activeId ? "Join to chat" : "Choose a profile"}
            </div>
          )}
        </div>
      )}

      {tab === "quizzes" && (
        <div>
          {isLeader && <Btn kind="primary" onClick={function() { props.setModal("quiz"); }} style={{ width: "100%", marginBottom: 12 }}>+ Create Quiz</Btn>}
          {quizzes.length === 0 && <EmptyBox emoji="📝" title="No quizzes" sub={isLeader ? "Create one for members" : "Leader hasn't made any yet"} />}
          {quizzes.map(function(q) {
            var attempts = D.quizAttempts.filter(function(a) { return a.quizId === q.id; });
            return (
              <div key={q.id} style={CARD_STYLE}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#1F2937", margin: 0 }}>{q.title}</h4>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{q.questions.length + " Q · " + attempts.length + " attempt" + (attempts.length !== 1 ? "s" : "")}</p>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {isMember && <Btn sm kind="primary" onClick={function() { props.setOpenQuiz(q.id); }}>Take</Btn>}
                    {isLeader && <Btn sm kind="danger" onClick={function() { props.quizDelete(q.id); }}>🗑</Btn>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "members" && (
        <div>
          {members.map(function(m) {
            return (
              <div key={m.id} style={Object.assign({}, CARD_STYLE, { display: "flex", alignItems: "center", gap: 12 })}>
                <Ava p={m} sz={36} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: m.theme.dark }}>{m.name}</span>
                {m.id === club.leaderId && <span style={pillStyle(club.theme.main)}>👑 Leader</span>}
                {isLeader && m.id !== club.leaderId && <Btn sm kind="danger" onClick={function() { props.clubLeave(club.id, m.id); }}>Remove</Btn>}
              </div>
            );
          })}
          {activeId && !isMember && <Btn kind="primary" onClick={function() { props.clubJoin(club.id, activeId); }} style={{ width: "100%" }}>Join Club</Btn>}
        </div>
      )}
    </div>
  );
}

function QuizPlayer(props) {
  var quiz = props.quiz, club = props.club, activeId = props.activeId;
  var _ans = useState(Array(quiz.questions.length).fill(-1)); var answers = _ans[0]; var setAnswers = _ans[1];
  var _done = useState(false); var done = _done[0]; var setDone = _done[1];
  var prev = props.attempts.find(function(a) { return a.takerId === activeId; });
  var showResults = done || !!prev;
  var displayAns = done ? answers : (prev ? prev.answers : []);
  var score = showResults ? quiz.questions.reduce(function(s, q, i) { return s + (displayAns[i] === q.correctIdx ? 1 : 0); }, 0) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Btn sm kind="ghost" onClick={props.onBack}>← Back</Btn>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1F2937", margin: 0, flex: 1 }}>{quiz.title}</h2>
      </div>
      {showResults && (
        <div style={Object.assign({}, CARD_STYLE, { textAlign: "center", padding: 30 })}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{score === quiz.questions.length ? "🏆" : score >= quiz.questions.length * 0.7 ? "🌟" : "📚"}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: club.theme.dark }}>{score + "/" + quiz.questions.length}</div>
          {!done && prev && <Btn kind="primary" onClick={function() { setAnswers(Array(quiz.questions.length).fill(-1)); }} style={{ marginTop: 12 }}>Retake</Btn>}
        </div>
      )}
      {quiz.questions.map(function(q, qi) {
        return (
          <div key={qi} style={CARD_STYLE}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#1F2937", margin: "0 0 10px" }}>{(qi + 1) + ". " + q.question}</p>
            {q.options.map(function(opt, oi) {
              var bg = "#fff", bd = "#E5E7EB", cl = "#374151";
              if (showResults) {
                if (q.correctIdx === oi) { bg = "#F0FDF4"; bd = "#22C55E"; cl = "#166534"; }
                else if (displayAns[qi] === oi) { bg = "#FEF2F2"; bd = "#EF4444"; cl = "#991B1B"; }
              } else if (answers[qi] === oi) { bg = "#F3F0FF"; bd = "#7C3AED"; cl = "#5B21B6"; }
              return (
                <button key={oi} onClick={function() { if (!showResults) setAnswers(function(a) { var n = a.slice(); n[qi] = oi; return n; }); }} disabled={showResults}
                  style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "2px solid " + bd, cursor: showResults ? "default" : "pointer", background: bg, marginBottom: 6, fontFamily: "inherit", color: cl }}>
                  {opt}{showResults && q.correctIdx === oi ? " ✅" : ""}{showResults && displayAns[qi] === oi && q.correctIdx !== oi ? " ❌" : ""}
                </button>
              );
            })}
          </div>
        );
      })}
      {!showResults && <Btn kind="primary" onClick={function() { props.onSubmit(quiz.id, answers); setDone(true); }} disabled={answers.indexOf(-1) !== -1 || !activeId} style={{ width: "100%" }}>Submit</Btn>}
    </div>
  );
}

/* ═══════════════ MESSAGES ═══════════════ */
function MessagesSection(props) {
  var D = props.D, activeId = props.activeId, getProf = props.getProf;
  var _mt = useState(""); var msgText = _mt[0]; var setMsgText = _mt[1];
  var endRef = useRef(null);
  var convo = D.convos.find(function(c) { return c.id === props.openConvo; });
  var msgs = D.messages.filter(function(m) { return m.convoId === props.openConvo; });

  useEffect(function() { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  function send() { if (msgText.trim() && activeId) { props.msgSend(props.openConvo, msgText); setMsgText(""); } }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 700 }}>{D.convos.length + " chat" + (D.convos.length !== 1 ? "s" : "")}</span>
        {D.profiles.length >= 2 && <Btn kind="primary" onClick={function() { props.setModal("convo"); }}>+ New Chat</Btn>}
      </div>
      {D.profiles.length < 2 && <EmptyBox emoji="💬" title="Need more profiles" sub="Create at least 2 to start chatting" />}
      <div style={{ display: "flex", gap: 12, minHeight: 400 }}>
        <div style={{ width: 180, flexShrink: 0 }}>
          {D.convos.map(function(c) {
            var members = c.profileIds.map(function(mid) { return getProf(mid); }).filter(Boolean);
            return (
              <button key={c.id} onClick={function() { props.setOpenConvo(c.id); }}
                style={{ width: "100%", textAlign: "left", padding: 12, borderRadius: 12, border: "none", cursor: "pointer", background: c.id === props.openConvo ? "#F3F4F6" : "#fff", marginBottom: 4, fontFamily: "inherit" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{c.name || members.map(function(m) { return m.emoji; }).join(" ")}</span>
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {convo ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: 14, borderBottom: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>{convo.name || "Chat"}</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
                {msgs.length === 0 && <p style={{ textAlign: "center", fontSize: 12, color: "#D1D5DB", padding: "60px 0" }}>No messages</p>}
                {msgs.map(function(m) {
                  var sender = getProf(m.senderId);
                  if (!sender) return null;
                  var isMe = m.senderId === activeId;
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 6 }}>
                      <div style={{ maxWidth: "75%", borderRadius: 14, padding: "8px 14px", background: isMe ? sender.theme.lite : "#F3F4F6" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 11 }}>{sender.emoji}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: sender.theme.dark }}>{sender.name}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{m.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              {activeId && convo.profileIds.indexOf(activeId) !== -1 ? (
                <div style={{ padding: 10, borderTop: "1px solid #E5E7EB", display: "flex", gap: 6 }}>
                  <input value={msgText} onChange={function(e) { setMsgText(e.target.value); }} placeholder="Message..." onKeyDown={function(e) { if (e.key === "Enter") send(); }} style={INPUT_STYLE} />
                  <Btn kind="primary" onClick={send} disabled={!msgText.trim()}>Send</Btn>
                </div>
              ) : (
                <div style={{ padding: 12, borderTop: "1px solid #E5E7EB", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>{activeId ? "Switch to a member" : "Choose a profile"}</div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#D1D5DB" }}>Select a chat</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ FRIENDS ═══════════════ */
function FriendsSection(props) {
  var D = props.D, getProf = props.getProf;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 700 }}>{D.connections.length + " connection" + (D.connections.length !== 1 ? "s" : "")}</span>
        {D.profiles.length >= 2 && <Btn kind="primary" onClick={function() { props.setModal("connection"); }}>+ Connect</Btn>}
      </div>
      {D.profiles.length < 2 && <EmptyBox emoji="💕" title="Need more profiles" sub="Create at least 2 to connect them" />}
      {D.profiles.length >= 2 && D.connections.length === 0 && <EmptyBox emoji="💕" title="No connections" sub="Link profiles together" />}
      {D.connections.map(function(cn) {
        var a = getProf(cn.from), b = getProf(cn.to);
        if (!a || !b) return null;
        return (
          <div key={cn.id} style={Object.assign({}, CARD_STYLE, { display: "flex", alignItems: "center", gap: 12 })}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <Ava p={a} sz={36} />
              <span style={{ fontWeight: 700, fontSize: 13, color: a.theme.dark }}>{a.name}</span>
            </div>
            <span style={{ fontSize: 20 }}>💕</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: b.theme.dark }}>{b.name}</span>
              <Ava p={b} sz={36} />
            </div>
            <Btn sm kind="danger" onClick={function() { props.connDelete(cn.id); }}>✕</Btn>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════ FORMS ═══════════════ */
function ProfileForm(props) {
  var init = props.initial;
  var _n = useState(init ? init.name : ""); var name = _n[0]; var setName = _n[1];
  var _d = useState(init ? (init.desc || "") : ""); var desc = _d[0]; var setDesc = _d[1];
  var _e = useState(init ? init.emoji : "😊"); var emoji = _e[0]; var setEmoji = _e[1];
  var _t = useState(init ? init.theme : THEMES[0]); var theme = _t[0]; var setTheme = _t[1];
  var _se = useState(false); var showEmojis = _se[0]; var setShowEmojis = _se[1];

  return (
    <div>
      <Fld label="Emoji Avatar">
        <button onClick={function() { setShowEmojis(!showEmojis); }} style={{ width: 56, height: 56, borderRadius: 14, background: "#F9FAFB", border: "2px dashed #D1D5DB", cursor: "pointer", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>{emoji}</button>
        {showEmojis && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, padding: 10, background: "#F9FAFB", borderRadius: 10 }}>
            {EMOJIS.map(function(e) {
              return <button key={e} onClick={function() { setEmoji(e); setShowEmojis(false); }} style={{ fontSize: 20, cursor: "pointer", background: "transparent", border: "none", padding: 3 }}>{e}</button>;
            })}
          </div>
        )}
      </Fld>
      <Fld label="Name"><input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Profile name" style={INPUT_STYLE} /></Fld>
      <Fld label="Description"><input value={desc} onChange={function(e) { setDesc(e.target.value); }} placeholder="Optional bio" style={INPUT_STYLE} /></Fld>
      <Fld label="Colour Theme">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {THEMES.map(function(t) {
            return (
              <button key={t.name} onClick={function() { setTheme(t); }} style={{ padding: 8, borderRadius: 10, border: theme.name === t.name ? "3px solid " + t.main : "3px solid transparent", cursor: "pointer", background: t.lite, textAlign: "center" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: t.main, margin: "0 auto 3px" }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: t.dark }}>{t.name}</span>
              </button>
            );
          })}
        </div>
      </Fld>
      <div style={{ background: theme.lite, borderRadius: 12, padding: 14, marginBottom: 16, borderLeft: "4px solid " + theme.main }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: theme.main + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{emoji}</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: theme.dark }}>{name || "Preview"}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn onClick={props.onCancel}>Cancel</Btn>
        <Btn kind="primary" onClick={function() { if (name.trim()) props.onSave(Object.assign({}, init || {}, { name: name.trim(), desc: desc.trim(), emoji: emoji, theme: theme })); }} disabled={!name.trim()}>Save Profile</Btn>
      </div>
    </div>
  );
}

function ConnectionForm(props) {
  var _a = useState(""); var a = _a[0]; var setA = _a[1];
  var _b = useState(""); var b = _b[0]; var setB = _b[1];
  var existing = props.connections.map(function(c) { return c.from + "-" + c.to; }).concat(props.connections.map(function(c) { return c.to + "-" + c.from; }));

  return (
    <div>
      <Fld label="Profile 1">
        <select value={a} onChange={function(e) { setA(e.target.value); }} style={INPUT_STYLE}>
          <option value="">Choose...</option>
          {props.profiles.map(function(p) { return <option key={p.id} value={p.id}>{p.emoji + " " + p.name}</option>; })}
        </select>
      </Fld>
      <Fld label="Profile 2">
        <select value={b} onChange={function(e) { setB(e.target.value); }} style={INPUT_STYLE}>
          <option value="">Choose...</option>
          {props.profiles.filter(function(p) { return p.id !== a; }).map(function(p) { return <option key={p.id} value={p.id}>{p.emoji + " " + p.name}</option>; })}
        </select>
      </Fld>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn onClick={props.onCancel}>Cancel</Btn>
        <Btn kind="primary" onClick={function() { props.onSave(a, b); }} disabled={!a || !b || a === b || existing.indexOf(a + "-" + b) !== -1}>Connect</Btn>
      </div>
    </div>
  );
}

function ConvoForm(props) {
  var _n = useState(""); var name = _n[0]; var setName = _n[1];
  var _s = useState([]); var selected = _s[0]; var setSelected = _s[1];
  var _t = useState("group"); var type = _t[0]; var setType = _t[1];

  function toggle(pid) {
    setSelected(function(prev) {
      return prev.indexOf(pid) !== -1 ? prev.filter(function(x) { return x !== pid; }) : prev.concat([pid]);
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <Btn sm kind={type === "direct" ? "primary" : "outline"} onClick={function() { setType("direct"); setSelected([]); }}>Direct</Btn>
        <Btn sm kind={type === "group" ? "primary" : "outline"} onClick={function() { setType("group"); setSelected([]); }}>Group</Btn>
      </div>
      {type === "group" && <Fld label="Group Name"><input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Chat name" style={INPUT_STYLE} /></Fld>}
      <Fld label={type === "direct" ? "Select 2 profiles" : "Select members (2+)"}>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {props.profiles.map(function(p) {
            var isSelected = selected.indexOf(p.id) !== -1;
            return (
              <button key={p.id} onClick={function() { toggle(p.id); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: isSelected ? "2px solid " + p.theme.main : "2px solid #E5E7EB", cursor: "pointer", background: isSelected ? p.theme.lite : "#fff", marginBottom: 4, textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 16 }}>{p.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: p.theme.dark }}>{p.name}</span>
                {isSelected && <span style={{ marginLeft: "auto", color: p.theme.main, fontWeight: 800 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </Fld>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn onClick={props.onCancel}>Cancel</Btn>
        <Btn kind="primary" onClick={function() { props.onCreate(type === "direct" ? "" : name, selected, type); }} disabled={type === "direct" ? selected.length !== 2 : selected.length < 2}>Create</Btn>
      </div>
    </div>
  );
}

function ClubFormDialog(props) {
  var init = props.initial;
  var _n = useState(init ? init.name : ""); var name = _n[0]; var setName = _n[1];
  var _d = useState(init ? (init.desc || "") : ""); var desc = _d[0]; var setDesc = _d[1];
  var _e = useState(init ? init.emoji : "📖"); var emoji = _e[0]; var setEmoji = _e[1];
  var _t = useState(init ? init.theme : THEMES[4]); var theme = _t[0]; var setTheme = _t[1];
  var _l = useState(init ? init.leaderId : ""); var leaderId = _l[0]; var setLeaderId = _l[1];
  var _m = useState(init ? init.memberIds : []); var memberIds = _m[0]; var setMemberIds = _m[1];
  var _se = useState(false); var showE = _se[0]; var setShowE = _se[1];

  useEffect(function() {
    if (leaderId && memberIds.indexOf(leaderId) === -1) setMemberIds(function(m) { return m.concat([leaderId]); });
  }, [leaderId]);

  function toggleMember(pid) {
    setMemberIds(function(prev) {
      return prev.indexOf(pid) !== -1 ? prev.filter(function(x) { return x !== pid; }) : prev.concat([pid]);
    });
  }

  return (
    <div>
      <Fld label="Club Icon">
        <button onClick={function() { setShowE(!showE); }} style={{ width: 48, height: 48, borderRadius: 12, background: "#F9FAFB", border: "2px dashed #D1D5DB", cursor: "pointer", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>{emoji}</button>
        {showE && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, padding: 8, background: "#F9FAFB", borderRadius: 8 }}>
            {CLUB_EMOJIS.map(function(e) { return <button key={e} onClick={function() { setEmoji(e); setShowE(false); }} style={{ fontSize: 18, cursor: "pointer", background: "transparent", border: "none", padding: 3 }}>{e}</button>; })}
          </div>
        )}
      </Fld>
      <Fld label="Club Name"><input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="e.g. Book Club" style={INPUT_STYLE} /></Fld>
      <Fld label="Description"><input value={desc} onChange={function(e) { setDesc(e.target.value); }} placeholder="What's it about?" style={INPUT_STYLE} /></Fld>
      <Fld label="Leader">
        <select value={leaderId} onChange={function(e) { setLeaderId(e.target.value); }} style={INPUT_STYLE}>
          <option value="">Choose...</option>
          {props.profiles.map(function(p) { return <option key={p.id} value={p.id}>{p.emoji + " " + p.name}</option>; })}
        </select>
      </Fld>
      <Fld label="Members">
        <div style={{ maxHeight: 150, overflowY: "auto" }}>
          {props.profiles.map(function(p) {
            var isMember = memberIds.indexOf(p.id) !== -1;
            var isLeader = p.id === leaderId;
            return (
              <button key={p.id} onClick={function() { if (!isLeader) toggleMember(p.id); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: isMember ? "2px solid " + theme.main : "2px solid #E5E7EB", cursor: isLeader ? "default" : "pointer", background: isMember ? theme.lite : "#fff", marginBottom: 3, textAlign: "left", fontFamily: "inherit", opacity: isLeader ? 0.5 : 1 }}>
                <span style={{ fontSize: 14 }}>{p.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: p.theme.dark }}>{p.name}</span>
                {isLeader && <span style={pillStyle(theme.main)}>Leader</span>}
                {isMember && !isLeader && <span style={{ marginLeft: "auto", color: theme.main, fontWeight: 800, fontSize: 12 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </Fld>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn onClick={props.onCancel}>Cancel</Btn>
        <Btn kind="primary" onClick={function() { if (name.trim() && leaderId && memberIds.length > 0) props.onSave(Object.assign({}, init || {}, { name: name.trim(), desc: desc.trim(), emoji: emoji, theme: theme, leaderId: leaderId, memberIds: memberIds })); }} disabled={!name.trim() || !leaderId || memberIds.length === 0}>Save</Btn>
      </div>
    </div>
  );
}

function QuizFormDialog(props) {
  var _t = useState(""); var title = _t[0]; var setTitle = _t[1];
  var _qs = useState([{ question: "", options: ["", ""], correctIdx: 0 }]); var questions = _qs[0]; var setQuestions = _qs[1];

  function updateQ(qi, field, val) {
    setQuestions(function(prev) { return prev.map(function(q, i) { if (i === qi) { var copy = Object.assign({}, q); copy[field] = val; return copy; } return q; }); });
  }
  function updateOpt(qi, oi, val) {
    setQuestions(function(prev) { return prev.map(function(q, i) { if (i === qi) { var copy = Object.assign({}, q); copy.options = q.options.map(function(o, j) { return j === oi ? val : o; }); return copy; } return q; }); });
  }

  var valid = title.trim() && questions.every(function(q) { return q.question.trim() && q.options.filter(function(o) { return o.trim(); }).length >= 2; });

  return (
    <div>
      <Fld label="Quiz Title"><input value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="e.g. Weekly Trivia" style={INPUT_STYLE} /></Fld>
      {questions.map(function(q, qi) {
        return (
          <div key={qi} style={{ background: "#F9FAFB", borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={LABEL_STYLE}>{"Question " + (qi + 1)}</span>
              {questions.length > 1 && <Btn sm kind="danger" onClick={function() { setQuestions(function(prev) { return prev.filter(function(_, i) { return i !== qi; }); }); }}>Remove</Btn>}
            </div>
            <input value={q.question} onChange={function(e) { updateQ(qi, "question", e.target.value); }} placeholder="Question..." style={Object.assign({}, INPUT_STYLE, { marginBottom: 8 })} />
            {q.options.map(function(o, oi) {
              return (
                <div key={oi} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <button onClick={function() { updateQ(qi, "correctIdx", oi); }}
                    style={{ width: 24, height: 24, borderRadius: 6, border: "2px solid " + (q.correctIdx === oi ? "#22C55E" : "#D1D5DB"), background: q.correctIdx === oi ? "#22C55E" : "#fff", cursor: "pointer", fontSize: 10, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {q.correctIdx === oi ? "✓" : ""}
                  </button>
                  <input value={o} onChange={function(e) { updateOpt(qi, oi, e.target.value); }} placeholder={"Option " + (oi + 1)} style={INPUT_STYLE} />
                </div>
              );
            })}
            {q.options.length < 5 && <Btn sm kind="ghost" onClick={function() { setQuestions(function(prev) { return prev.map(function(x, i) { if (i === qi) { return Object.assign({}, x, { options: x.options.concat([""]) }); } return x; }); }); }} style={{ marginTop: 4 }}>+ Option</Btn>}
          </div>
        );
      })}
      <Btn kind="outline" onClick={function() { setQuestions(function(prev) { return prev.concat([{ question: "", options: ["", ""], correctIdx: 0 }]); }); }} style={{ width: "100%", marginBottom: 12 }}>+ Add Question</Btn>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Btn onClick={props.onCancel}>Cancel</Btn>
        <Btn kind="primary" onClick={function() { if (valid) props.onSave({ clubId: props.clubId, authorId: props.authorId, title: title.trim(), questions: questions }); }} disabled={!valid}>Create Quiz</Btn>
      </div>
    </div>
  );
}
