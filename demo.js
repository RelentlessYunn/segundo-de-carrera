/* ==========================================================
   demo.js — the guest's demo data. A guest never sees Nolan's own
   timetable, grades or faculty: index.html loads this file INSTEAD of
   data.js and eval.js, so it defines exactly the same globals with the
   same shapes (SUBJECTS, CLASSES, FACULTY, EVENTS, TERMS, CALENDAR,
   ADVICE, TASKS, GENERAL_TASKS and GRADING). See data.js and eval.js for
   what each field means.
   Everything here is invented: a second year of Computer Science at a
   made-up university, with @example.edu addresses.
   It is ALWAYS ALIVE: the site is a portfolio visited on any day, so no
   date is written by hand. At load time the term is placed around today
   (it started on the Monday three weeks before this week's, so today is
   always in week 4 of 14), and every class, graded date and holiday is
   computed from that. Today, the next 7 days, the planner and Exams
   therefore always have something to show, on a weekday or a weekend.
   core.js loads after this file, so its date helpers (addDays, isoDate…)
   do not exist yet: these are our own, prefixed demo_ because every
   top-level name here is global and must not clash with later scripts.
   ========================================================== */

/* ---------- dates, the same way core.js does them: "YYYY-MM-DD" keys, Date objects at noon ---------- */
const demo_iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const demo_from=k=>new Date(k+"T12:00:00");
const demo_add=(k,n)=>{ const d=demo_from(k); d.setDate(d.getDate()+n); return demo_iso(d); };
const demo_TODAY=demo_iso(new Date());
/* weeks run Monday to Sunday, so on a Sunday "this week" is still the one that began six days ago */
const demo_START=demo_add(demo_TODAY,-((demo_from(demo_TODAY).getDay()+6)%7)-21);
/* the date of a weekday (0 Monday … 6 Sunday) in a teaching week (1 = the first week of term 1) */
const demo_day=(week,dow)=>demo_add(demo_START,(week-1)*7+dow);
/* "9 Oct", for the human "when" of the classes */
const demo_MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const demo_short=k=>{ const d=demo_from(k); return d.getDate()+" "+demo_MONTHS[d.getMonth()]; };
const demo_hm=(a,b)=>[a,b].map(m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")).join("–");

/* the one public holiday of the term: Friday of week 9 (never today, which is always week 4) */
const demo_HOLIDAY=demo_day(9,4);
/* a weekly class runs from its weekday in week 1 to the same weekday in week 14 */
function demo_weekly(c){
  const from=demo_day(1,c.day), to=demo_day(14,c.day);
  return Object.assign({when:demo_short(from)+" – "+demo_short(to), from, to},c);
}
/* a class on loose dates: the given weeks, minus the holiday (it simply does not happen that day) */
function demo_loose(c,weeks){
  const dates=weeks.map(w=>demo_day(w,c.day)).filter(k=>k!==demo_HOLIDAY);
  return Object.assign({when:dates.map(demo_short).join(" · "), dates},c);
}

/* Subjects. term: 1 or 2 · campus: its code (see the note on campuses below)
   color: subject colour · tint: translucent version for backgrounds.
   Campuses: core.js only knows UC3M's two (GET, LEG); a code it does not know
   is shown as written, so these codes are the names themselves. Each weekday
   stays on one campus, as real timetables try to. */
const SUBJECTS={
 alg:{name:"Algorithms and Complexity", short:"ALG", term:1, color:"#FF6B5E", tint:"rgba(255,107,94,.15)", ects:6, dept:"Computer Science", group:"21", campus:"North"},
 os:{name:"Operating Systems", short:"OS", term:1, color:"#FFA640", tint:"rgba(255,166,64,.15)", ects:6, dept:"Computer Science", group:"21", campus:"North"},
 db:{name:"Databases", short:"DB", term:1, color:"#5AA9FF", tint:"rgba(90,169,255,.15)", ects:6, dept:"Information Systems", group:"23", campus:"City"},
 net:{name:"Computer Networks", short:"NET", term:1, color:"#3FD9A4", tint:"rgba(63,217,164,.15)", ects:6, dept:"Computer Science", group:"21", campus:"North"},
 stat:{name:"Probability and Statistics", short:"STAT", term:1, color:"#A987FF", tint:"rgba(169,135,255,.15)", ects:6, dept:"Mathematics", group:"23", campus:"City"}
};

/* Timetable. day: 0 Monday … 4 Friday · start/end: minutes from midnight (540 = 9:00).
   Two or three weekly classes a day plus at most one loose-date lab, so a weekday
   always shows two to four classes. Monday of week 9 has an extra revision
   session that overlaps Networks on purpose: derived.js finds the clash by itself. */
const CLASSES=[
 /* Monday · North Campus */
 demo_weekly({subject:"alg", day:0, start:540, end:630, kind:"lecture", room:"Turing Building T1.04", group:"21"}),
 demo_weekly({subject:"os", day:0, start:645, end:735, kind:"lecture", room:"Turing Building T1.04", group:"21"}),
 demo_weekly({subject:"net", day:0, start:780, end:870, kind:"lecture", room:"Turing Building T2.12", group:"21"}),
 demo_loose({subject:"alg", day:0, start:750, end:840, kind:"revision session", room:"Turing Building T0.21", group:"21"},[9]),
 /* Tuesday · City Campus */
 demo_weekly({subject:"stat", day:1, start:540, end:630, kind:"lecture", room:"Nightingale Hall NH-203", group:"23"}),
 demo_weekly({subject:"db", day:1, start:660, end:750, kind:"lecture", room:"Nightingale Hall NH-110", group:"23"}),
 demo_loose({subject:"stat", day:1, start:840, end:930, kind:"computer lab", room:"Nightingale Hall NH-015", group:"23"},[3,6,9,12]),
 /* Wednesday · North Campus */
 demo_weekly({subject:"os", day:2, start:600, end:690, kind:"lecture", room:"Turing Building T2.05", group:"21"}),
 demo_weekly({subject:"alg", day:2, start:705, end:795, kind:"problem class", room:"Turing Building T2.05", group:"21"}),
 demo_loose({subject:"net", day:2, start:900, end:1020, kind:"lab", room:"Networks Lab T0.07", group:"21"},[2,4,6,8,10,12]),
 /* Thursday · City Campus */
 demo_weekly({subject:"stat", day:3, start:690, end:780, kind:"problem class", room:"Nightingale Hall NH-204", group:"23"}),
 demo_weekly({subject:"db", day:3, start:840, end:960, kind:"lab", room:"Nightingale Hall NH-015", group:"23"}),
 /* Friday · North Campus */
 demo_weekly({subject:"alg", day:4, start:540, end:630, kind:"lecture", room:"Turing Building T1.04", group:"21"}),
 demo_weekly({subject:"net", day:4, start:645, end:735, kind:"problem class", room:"Turing Building T2.12", group:"21"}),
 demo_loose({subject:"os", day:4, start:780, end:900, kind:"lab", room:"Systems Lab T0.09", group:"21"},[3,5,7,9,11,13])
];

/* Faculty. role: "theory" · "lecture" / "lab" · "lecture+lab" · "assistant" · ""
   · coord: true for the coordinator (one per subject) */
const FACULTY=[
 {subject:"alg", name:"Helen Marsh", role:"lecture", coord:true, email:"h.marsh@example.edu", office:"T3.18 · Turing Building, North Campus", note:"Office hours on Wednesdays after the problem class; book a slot by email."},
 {subject:"alg", name:"Tomás Ferreira", role:"lab", coord:false, email:"t.ferreira@example.edu", office:"T3.22 · Turing Building, North Campus", note:""},
 {subject:"os", name:"Rajesh Iyer", role:"theory", coord:true, email:"r.iyer@example.edu", office:"T3.05 · Turing Building, North Campus", note:"Posts the lab statements a week before each session."},
 {subject:"os", name:"Clara Vogel", role:"assistant", coord:false, email:"c.vogel@example.edu", office:"", note:""},
 {subject:"db", name:"Amina Okafor", role:"lecture+lab", coord:true, email:"a.okafor@example.edu", office:"NH-412 · Nightingale Hall, City Campus", note:""},
 {subject:"db", name:"Owen Price", role:"", coord:false, email:"o.price@example.edu", office:"NH-415 · Nightingale Hall, City Campus", note:"Marks the group projects together with the coordinator."},
 {subject:"net", name:"Lukas Brandt", role:"lecture", coord:false, email:"l.brandt@example.edu", office:"T2.30 · Turing Building, North Campus", note:""},
 {subject:"net", name:"Mei Tanaka", role:"lab", coord:false, email:"m.tanaka@example.edu", office:"", note:""},
 {subject:"net", name:"Peter Holloway", role:"", coord:true, email:"p.holloway@example.edu", office:"T2.34 · Turing Building, North Campus", note:""},
 {subject:"stat", name:"Sofia Marín", role:"lecture", coord:true, email:"s.marin@example.edu", office:"NH-508 · Nightingale Hall, City Campus", note:""},
 {subject:"stat", name:"Daniel Okoye", role:"lab", coord:false, email:"d.okoye@example.edu", office:"", note:"Runs the computer labs in R; bring a laptop if you prefer your own setup."}
];

/* Graded dates. type: "ex" exam · "en" submission · "cl" class/lab · "cf" clash
   Optional: time, room, format, syllabus, online:1, until (multi-day window),
   noDay:1 (day unknown: parked on that week's Saturday; label = custom text).
   Each one sits on a day its subject has class (or is online), so validate.js
   has nothing to warn about. They run from week 2 to week 14: today is always
   week 4, so there are past ones, today's and plenty ahead. */
const EVENTS=[
 {subject:"alg", date:demo_day(2,2), what:"Problem sheet 1 solved in class: asymptotic notation", weight:"class", type:"cl", time:demo_hm(705,795), room:"Turing Building T2.05"},
 {subject:"net", date:demo_day(2,2), what:"Lab 1 · cabling, addressing and ping", weight:"lab", type:"cl", time:demo_hm(900,1020), room:"Networks Lab T0.07"},
 {subject:"os", date:demo_day(3,4), what:"Lab 1 · the shell, processes and fork()", weight:"lab", type:"cl", time:demo_hm(780,900), room:"Systems Lab T0.09"},
 {subject:"db", date:demo_day(3,3), what:"Assignment 1 · entity-relationship model of a library", weight:"5 %", type:"en", time:"Hand in at the start of the lab", room:"Nightingale Hall NH-015", format:"Pairs, diagram and a one-page report"},
 {subject:"stat", date:demo_day(3,1), what:"Computer lab 1 · descriptive statistics in R", weight:"2.5 %", type:"en", time:demo_hm(840,930), room:"Nightingale Hall NH-015", format:"Script submitted before leaving"},
 /* open all this week, so it always falls on today (weekend included) */
 {subject:"stat", date:demo_day(4,0), until:demo_day(4,6), online:1, what:"Online quiz 1 · probability and counting", weight:"5 %", type:"ex", time:"Opens Monday 9:00, closes Sunday 23:59", format:"10 questions, two attempts, the best one counts", syllabus:"Units 1 and 2"},
 {subject:"alg", date:demo_day(4,4), what:"Problem set 2 · divide and conquer", weight:"practice", type:"en", time:"In the lecture", room:"Turing Building T1.04", format:"Handwritten, individual"},
 {subject:"net", date:demo_day(4,2), what:"Lab 2 · capturing traffic with Wireshark", weight:"lab", type:"cl", time:demo_hm(900,1020), room:"Networks Lab T0.07"},
 {subject:"db", date:demo_day(4,1), what:"Guest lecture: how a query planner thinks", weight:"class", type:"cl", time:demo_hm(660,750), room:"Nightingale Hall NH-110"},
 {subject:"net", date:demo_day(5,0), what:"Short test 1 · physical and link layers", weight:"10 %", type:"ex", time:demo_hm(780,870), room:"Turing Building T2.12", format:"Written, 40 minutes, no notes", syllabus:"Chapters 1 to 3"},
 {subject:"db", date:demo_day(5,1), what:"In-class quiz · relational algebra", weight:"5 %", type:"ex", time:demo_hm(660,750), room:"Nightingale Hall NH-110", format:"Multiple choice, 20 minutes", syllabus:"Units 1 and 2"},
 {subject:"stat", date:demo_day(5,3), what:"Problem class on random variables, bring sheet 3 attempted", weight:"class", type:"cl", time:demo_hm(690,780), room:"Nightingale Hall NH-204"},
 {subject:"os", date:demo_day(5,4), what:"Lab 2 report · process scheduling", weight:"5 %", type:"en", time:demo_hm(780,900), room:"Systems Lab T0.09", format:"Report and code, in pairs"},
 {subject:"alg", date:demo_day(6,2), what:"Midterm 1 · sorting, divide and conquer, recurrences", weight:"20 %", type:"ex", time:demo_hm(705,795), room:"Turing Building T2.05", format:"Written, one A4 sheet of notes allowed", syllabus:"Weeks 1 to 5"},
 {subject:"stat", date:demo_day(6,3), what:"Midterm · probability and random variables", weight:"20 %", type:"ex", time:demo_hm(690,780), room:"Nightingale Hall NH-204", format:"Written, with the official formula sheet", syllabus:"Units 1 to 3"},
 {subject:"os", date:demo_day(7,5), noDay:1, what:"Midterm in the Monday or Wednesday lecture", weight:"15 %", type:"ex", format:"Written, in lecture time", syllabus:"Processes, threads and scheduling"},
 {subject:"net", date:demo_day(8,2), what:"Lab 4 · static and dynamic routing in a simulator", weight:"lab", type:"cl", time:demo_hm(900,1020), room:"Networks Lab T0.07"},
 {subject:"db", date:demo_day(8,3), what:"Assignment 2 · SQL queries on the university schema", weight:"10 %", type:"en", time:demo_hm(840,960), room:"Nightingale Hall NH-015", format:"Individual, submitted as a .sql file"},
 /* a multi-day window: the second online quiz */
 {subject:"stat", date:demo_day(9,0), until:demo_day(9,6), online:1, what:"Online quiz 2 · distributions and estimation", weight:"5 %", type:"ex", time:"Opens Monday 9:00, closes Sunday 23:59", format:"10 questions, two attempts, the best one counts", syllabus:"Units 3 and 4"},
 /* Friday of week 9 is a holiday: Networks makes up its problem class online the day before */
 {subject:"net", date:demo_day(9,3), online:1, what:"Online make-up for Friday's problem class (public holiday)", weight:"class", type:"cl", time:"18:00–19:00", format:"Online, recorded"},
 {subject:"alg", date:demo_day(10,6), online:1, what:"Programming assignment · shortest paths on a real map", weight:"10 %", type:"en", time:"By 23:59 on the course site", format:"Python, individual, with automatic tests"},
 {subject:"os", date:demo_day(11,4), what:"Lab project · a tiny shell with pipes and redirection", weight:"15 %", type:"en", time:demo_hm(780,900), room:"Systems Lab T0.09", format:"In pairs, demo in the lab"},
 {subject:"net", date:demo_day(12,0), what:"Short test 2 · transport and application layers", weight:"10 %", type:"ex", time:demo_hm(780,870), room:"Turing Building T2.12", format:"Written, 40 minutes, no notes", syllabus:"Chapters 4 to 6"},
 {subject:"stat", date:demo_day(12,1), what:"Computer lab 4 · linear regression in R", weight:"2.5 %", type:"en", time:demo_hm(840,930), room:"Nightingale Hall NH-015", format:"Script submitted before leaving"},
 {subject:"db", date:demo_day(13,1), what:"Midterm · SQL and normalisation", weight:"20 %", type:"ex", time:demo_hm(660,750), room:"Nightingale Hall NH-110", format:"Written, no notes", syllabus:"Units 1 to 4"},
 {subject:"alg", date:demo_day(13,2), what:"Midterm 2 · graphs and dynamic programming", weight:"20 %", type:"ex", time:demo_hm(705,795), room:"Turing Building T2.05", format:"Written, one A4 sheet of notes allowed", syllabus:"Weeks 7 to 12"},
 {subject:"db", date:demo_day(14,5), noDay:1, what:"Group project · final submission and demo", weight:"20 %", type:"en", format:"Groups of three, report and a live demo"}
];

/* Terms. Weeks are computed from these dates: 14 teaching weeks each. */
const TERMS=[
 {n:1, start:demo_START, end:demo_day(14,4)},
 {n:2, start:demo_day(19,0), end:demo_day(32,4)}
];

/* Tasks not tied to any subject: [title, detail] */
const GENERAL_TASKS=[
 ["Book a meeting with your personal tutor","Once a term is enough; bring your module choices for next year."],
 ["Check the final exam timetable","It is published in week 10. Look for clashes between exams on the same day."],
 ["Renew the library card","It expires at the end of the month and the self-service loans stop working."]
];

/* Academic calendar, built around the term. from/to inclusive.
   periods.type: "classes" · "exams" · "break" · holidays.campus only when it affects one campus */
const CALENDAR={
 year:{from:demo_START.slice(0,8)+"01", to:demo_day(38,6)},
 periods:[
  {from:demo_START, to:demo_day(14,4), type:"classes", label:"Classes · Term 1"},
  {from:demo_day(15,0), to:demo_day(16,4), type:"exams", label:"Final exams · Term 1"},
  {from:demo_day(17,0), to:demo_day(18,4), type:"break", label:"Winter break"},
  {from:demo_day(19,0), to:demo_day(32,4), type:"classes", label:"Classes · Term 2"},
  {from:demo_day(33,0), to:demo_day(34,4), type:"exams", label:"Final exams · Term 2"},
  {from:demo_day(37,0), to:demo_day(38,4), type:"exams", label:"Resit exams"}
 ],
 holidays:[
  {date:demo_HOLIDAY},
  {date:demo_day(24,0)}
 ],
 marks:[
  {date:demo_START, label:"Classes begin"},
  {date:demo_day(14,4), label:"Classes end"},
  {date:demo_day(19,0), label:"Classes begin"},
  {date:demo_day(32,4), label:"Classes end"}
 ]
};

/* Advice per week: ADVICE[term][week] = [texts]. The week's dates are added
   automatically from EVENTS, so the advice names weekdays, not dates. */
const ADVICE={
 1:{
  1:["First week: download the course guide of each subject and put every assessment in your calendar.","Install R, a Linux virtual machine and Wireshark now, before the labs need them."],
  2:["Networks lab 1 on Wednesday afternoon. Labs are compulsory: missing more than one costs you the lab mark.","Find a partner for the Operating Systems labs and a group of three for the Databases project."],
  3:["First Operating Systems lab on Friday. Read the statement beforehand: the session is for coding, not for reading.","Databases assignment 1 is handed in on Thursday at the start of the lab."],
  4:["The first Statistics quiz is open all week. Do it early: you get two attempts and the best one counts.","Algorithms problem set 2 is collected in Friday's lecture."],
  5:["A busy week: Networks short test on Monday, Databases quiz on Tuesday and the second Operating Systems lab report on Friday.","Start revising for the Algorithms midterm next week: recurrences are always in it."],
  6:["Two midterms: Algorithms on Wednesday and Statistics on Thursday. Keep the rest of the week light.","For Statistics, practise with the official formula sheet: it is the one you get in the exam."],
  7:["The Operating Systems midterm has no fixed day yet: ask in Monday's lecture.","A quieter week elsewhere: a good moment to catch up on the problem sheets."],
  8:["Databases assignment 2 is due in Thursday's lab. Test your queries on the real schema, not just on paper."],
  9:["Friday is a public holiday: Networks moves its problem class online on Thursday evening.","The second Statistics quiz is open all week, and Algorithms has an extra revision session on Monday that overlaps the Networks lecture."],
  10:["The Algorithms programming assignment closes on Sunday night. The automatic tests are strict about the output format.","The final exam timetable comes out this week: check it for clashes."],
  11:["Operating Systems lab project on Friday: a demo in the lab, so bring it running."],
  12:["Networks short test 2 on Monday and the last Statistics computer lab on Tuesday."],
  13:["Two midterms again: Databases on Tuesday and Algorithms on Wednesday.","Meet your Databases group: the project demo is next week."],
  14:["Last week of classes. The Databases project is due; the day is still to be confirmed.","Start the revision plan for the finals, which begin next Monday."]
 },
 2:{}
};

/* Tasks per subject: [title, detail]. Ticks are tied to the title. */
const TASKS={
 alg:[["Finish problem sheet 3","Master theorem exercises. The solutions are discussed in the next problem class."]],
 os:[["Set up the Linux virtual machine","The labs assume Ubuntu with gcc and make installed. Do it before lab 1."],["Read the lab 2 statement","Round robin and priority scheduling; the report asks for a comparison table."]],
 db:[["Form the project group","Groups of three, registered on the course site by the end of week 3."]],
 net:[["Install Wireshark","You need capture permissions on your laptop for lab 2."]],
 stat:[["Install R and RStudio","The computer labs use them from week 3."],["Print the formula sheet","The same one you get in the midterm and the final."]]
};

/* ==========================================================
   Grading and syllabus per subject (eval.js has the same shape).
   parts: [name, %] · minimum: text shown under the calculator
   grading.scale: "10" (percentages) or "points" (each part worth %/10 points)
   grading.min / min2: {item: index in parts, value: minimum grade, text}
   syllabus: [week or block, content]
   ========================================================== */
const GRADING={
alg:{
 grading:{scale:"10", min:{item:3, value:4, text:"a 4 out of 10 in the final exam"}},
 parts:[["Midterm 1",20],["Midterm 2",20],["Programming assignment",10],["Final exam",50]],
 minimum:"<b>A 4 out of 10 in the final exam</b> for the coursework to count. Below that, the final grade is the exam alone.",
 rules:[
  "<strong>Midterm 1</strong> (week 6) — sorting, divide and conquer and recurrences. One A4 sheet of notes allowed.",
  "<strong>Midterm 2</strong> (week 13) — graphs, greedy algorithms and dynamic programming.",
  "<strong>Programming assignment</strong> (week 10) — shortest paths on a real map, in Python, marked by automatic tests and a short interview.",
  "<strong>Final</strong> — the whole course, written, no notes.",
  "<strong>Resit</strong> — the better of the exam alone or the same weighting with your coursework."],
 syllabus:[["1","Algorithms and their cost. Asymptotic notation"],["2","Recurrences and the master theorem"],["3","Sorting: merge sort, quicksort, lower bounds"],["4","Divide and conquer"],["5","Heaps and priority queues"],["6","<b>Midterm 1</b>. Hashing"],["7","Graphs: representation, BFS and DFS"],["8","Shortest paths: Dijkstra and Bellman-Ford"],["9","Minimum spanning trees. Revision session on Monday"],["10","Greedy algorithms"],["11","Dynamic programming I"],["12","Dynamic programming II"],["13","<b>Midterm 2</b>. P, NP and reductions"],["14","NP-completeness and revision"]]},
os:{
 grading:{scale:"10", min:{item:3, value:5, text:"a 5 out of 10 in the final exam"}, min2:{item:1, value:4, text:"a 4 out of 10 in the lab project"}},
 parts:[["Lab reports",20],["Lab project",15],["Midterm",15],["Final exam",50]],
 minimum:"Two at once: <b>a 5 out of 10 in the final exam</b> and <b>a 4 out of 10 in the lab project</b>. Missing either one fails the subject.",
 rules:[
  "<strong>Labs</strong> — six sessions on Fridays, in pairs. Each report is due at the end of the next lab.",
  "<strong>Lab project</strong> (week 11) — a small shell with pipes and redirection, shown working in the lab.",
  "<strong>Midterm</strong> (week 7) — processes, threads and scheduling; the day is still to be confirmed.",
  "<strong>Final</strong> — theory questions and exercises on everything, including the labs."],
 syllabus:[["1","What an operating system is. System calls"],["2","Processes and fork()"],["3","Threads — lab 1"],["4","CPU scheduling"],["5","Scheduling in practice — lab 2"],["6","Synchronisation: locks and semaphores"],["7","<b>Midterm</b>. Deadlocks — lab 3"],["8","Memory: paging"],["9","Virtual memory"],["10","Page replacement"],["11","File systems — lab project"],["12","Input and output"],["13","Security and protection — lab 6"],["14","Virtualisation and revision"]]},
db:{
 grading:{scale:"10", min:{item:3, value:4, text:"a 4 out of 10 in the final exam"}},
 parts:[["Assignments and quiz",20],["Midterm",20],["Group project",20],["Final exam",40]],
 minimum:"<b>A 4 out of 10 in the final exam.</b> The project cannot make up for a weak exam.",
 rules:[
  "<strong>Assignments</strong> — an entity-relationship model (week 3) and SQL queries (week 8), plus a short quiz in week 5.",
  "<strong>Midterm</strong> (week 13) — SQL and normalisation, written.",
  "<strong>Group project</strong> — a small web application on top of a database you design, in groups of three, with a live demo in week 14.",
  "<strong>Final</strong> — everything, including transactions and indexing."],
 syllabus:[["Unit 1","The relational model: relations, keys and integrity"],["Unit 2","Relational algebra"],["Unit 3","Entity-relationship design and translation into tables"],["Unit 4","SQL: queries, joins, aggregation and subqueries"],["Unit 5","Normalisation: functional dependencies up to BCNF"],["Unit 6","Transactions, concurrency and indexing"]]},
net:{
 grading:{scale:"10", min:{item:2, value:4, text:"a 4 out of 10 in the final exam"}},
 parts:[["Short tests",20],["Labs",20],["Final exam",60]],
 minimum:"<b>A 4 out of 10 in the final exam</b>, and at most one lab missed.",
 rules:[
  "<strong>Short tests</strong> (weeks 5 and 12) — 40 minutes in the Monday lecture, 10 % each.",
  "<strong>Labs</strong> — six on alternate Wednesdays. Each is marked in the session.",
  "<strong>Holiday</strong> — Friday of week 9 has no class; its problem class is given online on Thursday evening.",
  "<strong>Final</strong> — problems and short questions on the whole stack."],
 syllabus:[["1","Networks and the Internet. Layers"],["2","Physical layer — lab 1"],["3","Link layer and Ethernet"],["4","Switching and VLANs — lab 2"],["5","<b>Short test 1</b>. IP addressing"],["6","IPv4, subnetting and IPv6 — lab 3"],["7","Routing algorithms"],["8","Routing protocols — lab 4"],["9","Transport: UDP and TCP"],["10","TCP congestion control — lab 5"],["11","Application layer: DNS and HTTP"],["12","<b>Short test 2</b>. Email and CDNs — lab 6"],["13","Wireless networks"],["14","Network security and revision"]]},
stat:{
 grading:{scale:"points", min:{item:3, value:3, text:"3 out of 6 points in the final exam"}},
 parts:[["Online quizzes",10],["Midterm",20],["Computer labs",10],["Final exam",60]],
 minimum:"<b>At least 3 out of 6 points in the final exam.</b> The grade is counted in points out of 10, not in percentages.",
 rules:[
  "<strong>Online quizzes</strong> (weeks 4 and 9) — open Monday to Sunday, two attempts, the best counts. Up to 1 point.",
  "<strong>Midterm</strong> (week 6) — probability and random variables. Up to 2 points.",
  "<strong>Computer labs</strong> — four sessions in R, each script handed in before leaving. Up to 1 point.",
  "<strong>Final</strong> — up to 6 points, with the official formula sheet."],
 syllabus:[["1","Probability: events and axioms"],["2","Conditional probability and Bayes"],["3","Discrete random variables — computer lab 1"],["4","Continuous random variables"],["5","The normal distribution"],["6","<b>Midterm</b>. Joint distributions — computer lab 2"],["7","The central limit theorem"],["8","Point estimation"],["9","Confidence intervals — computer lab 3"],["10","Hypothesis testing"],["11","Tests for two populations"],["12","Simple linear regression — computer lab 4"],["13","Inference in regression"],["14","Revision"]]}
};

/* ---------- names the app shows for this data ---------- */
/* its campuses (core.js CAMPUS), and who writes to the faculty (subjects.js) */
const CAMPUS_NAMES={North:"North campus",City:"City campus"};
const MAIL_FROM="Demo student — Computer Science";
