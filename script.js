const mobileMenuButton =
  document.getElementById("mobileMenuButton");

const mobileNav =
  document.getElementById("mobileNav");

mobileMenuButton.addEventListener("click", () => {
  mobileNav.classList.toggle("open");
});


/* =========================================================
   GOALBALL CENTRAL LIVE TOURNAMENT DASHBOARD
   ========================================================= */

const CONFIG = {
  dataUrl:
    "https://script.google.com/macros/s/AKfycbydCRMOtEddewEYDGjMzq63NM35MJnJvAQz1p4-CAmm10pCUrh_qwhdzK6FdTYfUzX2/exec"
};

let activeEventStart = null;
let activeEventEnd = null;


/* =========================================================
   HELPERS
   ========================================================= */

function normalize(value) {
  return String(value ?? "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getResult(row) {
  return normalize(
    row["Result"] ||
    row["SCORE"] ||
    row["Score"]
  );
}

function hasResult(row) {
  const result = getResult(row);

  return (
    result &&
    result !== "TBD" &&
    result !== "?" &&
    result !== "-"
  );
}

function parseDateTime(row) {
  const dateText =
    normalize(
      row["GameDate"] ||
      row["Date"]
    );

  const timeText =
    normalize(row["Time"]);

  const parsed =
    new Date(`${dateText} ${timeText}`);

  return isNaN(parsed.getTime())
    ? null
    : parsed;
}


/* =========================================================
   FIND LATEST TOURNAMENT
   ========================================================= */

function getLatestTournament(results) {
  const map = new Map();

  results.forEach(row => {
    const year =
      normalize(row["Year"]);

    const location =
      normalize(row["Location"]);

    if (!year || !location) {
      return;
    }

    const key =
      `${year}|||${location}`;

    const dt =
      parseDateTime(row);

    if (!map.has(key)) {
      map.set(key, {
        year,
        location,
        rows: [],
        latestDate:
          dt || new Date(0)
      });
    }

    const event =
      map.get(key);

    event.rows.push(row);

    if (
      dt &&
      dt > event.latestDate
    ) {
      event.latestDate = dt;
    }
  });

  return Array
    .from(map.values())
    .sort(
      (a, b) =>
        b.latestDate -
        a.latestDate
    )[0];
}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function formatCountdown(targetDate) {
  const now =
    new Date();

  const diff =
    targetDate - now;

  if (diff <= 0) {
    return "LIVE NOW";
  }

  const days =
    Math.floor(
      diff / 86400000
    );

  const hours =
    Math.floor(
      (diff % 86400000) /
      3600000
    );

  const minutes =
    Math.floor(
      (diff % 3600000) /
      60000
    );

  const seconds =
    Math.floor(
      (diff % 60000) /
      1000
    );

  return (
    `${days}D ` +
    `${hours}H ` +
    `${minutes}M ` +
    `${seconds}S`
  );
}


/* =========================================================
   BUILD STATUS
   ========================================================= */

function buildStatus(event) {
  if (!event) {
    activeEventStart = null;
    activeEventEnd = null;

    return {
      badge: "UPDATE",
      badgeClass: "update",
      tournament: "Goalball Central",
      status: "Coverage Hub",
      next: "Check back soon",
      nextSub: "More updates coming",
      latest: "Tournament coverage",
      latestSub:
        "Schedules, livestreams, results, and rankings"
    };
  }

  const now =
    new Date();

  const rows =
    event.rows
      .map(row => ({
        row,
        dt: parseDateTime(row)
      }))
      .filter(x => x.dt)
      .sort(
        (a, b) =>
          a.dt - b.dt
      );

  const first =
    rows[0];

  const last =
    rows[
      rows.length - 1
    ];

  activeEventStart =
    first
      ? first.dt
      : null;

  activeEventEnd =
    last
      ? last.dt
      : null;

  const completed =
    rows.filter(
      x =>
        hasResult(x.row)
    );

  const upcoming =
    rows.filter(
      x =>
        !hasResult(x.row) &&
        x.dt >= now
    );

  const recent =
    completed[
      completed.length - 1
    ];

  const next =
    upcoming[0];

  const eventName =
    `${event.year} ${event.location}`;


  /* BEFORE TOURNAMENT */

  if (
    first &&
    now < first.dt
  ) {
    return {
      badge: "NEXT",
      badgeClass: "next",
      tournament: eventName,
      status:
        formatCountdown(first.dt),

      next:
        next
          ? `${normalize(next.row["Team A"])} vs ${normalize(next.row["Team B"])}`
          : "Schedule posted",

      nextSub:
        next
          ? `${normalize(next.row["Time"])} ${normalize(next.row["Gym"] ? "• " + next.row["Gym"] : "")}`
          : "View Tournament Information",

      latest:
        "Tournament starts soon",

      latestSub:
        first.dt.toLocaleString(
          [],
          {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
          }
        )
    };
  }


  /* LIVE */

  if (
    last &&
    now <= last.dt
  ) {
    return {
      badge: "LIVE",
      badgeClass: "live",
      tournament: eventName,
      status: "LIVE NOW",

      next:
        next
          ? `${normalize(next.row["Team A"])} vs ${normalize(next.row["Team B"])}`
          : "No upcoming game listed",

      nextSub:
        next
          ? `${normalize(next.row["Time"])} ${normalize(next.row["Gym"] ? "• " + next.row["Gym"] : "")}`
          : "Check Tournament Information",

      latest:
        recent
          ? `${normalize(recent.row["Team A"])} ${getResult(recent.row)} ${normalize(recent.row["Team B"])}`
          : "Tournament is live",

      latestSub:
        recent
          ? "Latest result"
          : "Results update here"
    };
  }


  /* FINAL */

  return {
    badge: "FINAL",
    badgeClass: "final",
    tournament: eventName,
    status: "FINAL",

    next:
      "Final Standings",

    nextSub:
      "View tournament results",

    latest:
      recent
        ? `${normalize(recent.row["Team A"])} ${getResult(recent.row)} ${normalize(recent.row["Team B"])}`
        : "Final results posted",

    latestSub:
      "Latest final result"
  };
}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function renderDashboard(status) {
  const statusBadge =
    document.querySelector(
      ".status-badge"
    );

  const cards =
    document.querySelectorAll(
      ".dashboard-card"
    );

  if (
    !statusBadge ||
    cards.length < 4
  ) {
    return;
  }

  statusBadge.textContent =
    status.badge;

  statusBadge.classList.remove(
    "final",
    "live",
    "next",
    "update"
  );

  statusBadge.classList.add(
    status.badgeClass
  );


  /* Tournament card */

  cards[0].querySelector(
    "strong"
  ).textContent =
    status.tournament;


  /* Status card */

  cards[1].querySelector(
    "strong"
  ).textContent =
    status.status;


  /* Up Next */

  cards[2].querySelector(
    "strong"
  ).textContent =
    status.next;

  cards[2].querySelector(
    ".subtext"
  ).textContent =
    status.nextSub;


  /* Latest Result */

  cards[3].querySelector(
    "strong"
  ).textContent =
    status.latest;

  cards[3].querySelector(
    ".subtext"
  ).textContent =
    status.latestSub;


  updateTicker(status);
}


/* =========================================================
   TICKER
   ========================================================= */

function updateTicker(status) {
  const tickerLabel =
    document.querySelector(
      ".ticker > strong"
    );

  const tickerContent =
    document.querySelector(
      ".ticker-content"
    );

  if (
    !tickerLabel ||
    !tickerContent
  ) {
    return;
  }

  tickerLabel.textContent =
    status.badge;

  tickerContent.textContent =
    `● ${status.tournament} ` +
    `   ● ${status.latest} ` +
    `   ● ${status.next}`;
}


/* =========================================================
   LIVE COUNTDOWN REFRESH
   ========================================================= */

function updateLiveStatusOnly() {
  if (!activeEventStart) {
    return;
  }

  const now =
    new Date();

  const cards =
    document.querySelectorAll(
      ".dashboard-card"
    );

  const statusBadge =
    document.querySelector(
      ".status-badge"
    );

  if (
    !statusBadge ||
    cards.length < 2
  ) {
    return;
  }

  const statusStrong =
    cards[1].querySelector(
      "strong"
    );

  if (
    now < activeEventStart
  ) {
    statusStrong.textContent =
      formatCountdown(
        activeEventStart
      );

    return;
  }

  if (
    activeEventEnd &&
    now <= activeEventEnd
  ) {
    statusStrong.textContent =
      "LIVE NOW";

    statusBadge.textContent =
      "LIVE";

    statusBadge.classList.remove(
      "final",
      "next",
      "update"
    );

    statusBadge.classList.add(
      "live"
    );

    return;
  }

  statusStrong.textContent =
    "FINAL";

  statusBadge.textContent =
    "FINAL";

  statusBadge.classList.remove(
    "live",
    "next",
    "update"
  );

  statusBadge.classList.add(
    "final"
  );
}


/* =========================================================
   LOAD LIVE DATA
   ========================================================= */

function loadDashboard() {
  fetch(CONFIG.dataUrl)

    .then(res => {
      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}`
        );
      }

      return res.json();
    })

    .then(data => {
      const event =
        getLatestTournament(
          data.results || []
        );

      const status =
        buildStatus(event);

      renderDashboard(status);
    })

    .catch(error => {
      console.error(
        "Goalball Central dashboard failed:",
        error
      );

      renderDashboard({
        badge: "UPDATE",
        badgeClass: "update",
        tournament:
          "Goalball Central",
        status:
          "Offline",
        next:
          "Tournament Information",
        nextSub:
          "Check site manually",
        latest:
          "Unable to load live data",
        latestSub:
          "Please try again shortly"
      });
    });
}


/* =========================================================
   INITIALIZE
   ========================================================= */

loadDashboard();

setInterval(
  updateLiveStatusOnly,
  1000
);

setInterval(
  loadDashboard,
  300000
);