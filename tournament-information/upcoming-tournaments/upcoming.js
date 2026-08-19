/* =========================================================
   GOALBALL CENTRAL
   UPCOMING TOURNAMENTS
   ========================================================= */


/* =========================================================
   MOBILE NAV
   ========================================================= */

const mobileMenuButton =
  document.getElementById("mobileMenuButton");

const mobileNav =
  document.getElementById("mobileNav");

if (mobileMenuButton && mobileNav) {
  mobileMenuButton.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });
}


/* =========================================================
   CONFIG
   ========================================================= */

const UPCOMING_CONFIG = {

  dataUrl:
    "https://script.google.com/macros/s/AKfycbydCRMOtEddewEYDGjMzq63NM35MJnJvAQz1p4-CAmm10pCUrh_qwhdzK6FdTYfUzX2/exec",

  displayTimezone:
    "America/New_York"

};


/* =========================================================
   HELPERS
   ========================================================= */

function upcomingNormalize(value) {
  return String(value ?? "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function upcomingEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function parseDate(value) {
  const text =
    String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const parsed =
    new Date(text);

  if (isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}


function formatDate(value) {
  const parsed =
    parseDate(value);

  if (!parsed) {
    return String(value ?? "");
  }

  return parsed.toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }
  );
}


/* =========================================================
   BUILD TOURNAMENTS
   ========================================================= */

function buildUpcomingTournaments(rows) {

  const tournaments =
    new Map();


  rows.forEach(row => {

    const year =
      upcomingNormalize(
        row["Year"]
      );

    const location =
      upcomingNormalize(
        row["Location"]
      );

    const gameDate =
      parseDate(
        row["GameDate"] ||
        row["Date"]
      );

    if (
      !year ||
      !location ||
      !gameDate
    ) {
      return;
    }


    const key =
      `${year}|||${location}`;


    if (!tournaments.has(key)) {

      tournaments.set(
        key,
        {
          year,
          location,
          firstDate: gameDate,
          lastDate: gameDate
        }
      );

    }


    const tournament =
      tournaments.get(key);


    if (
      gameDate <
      tournament.firstDate
    ) {
      tournament.firstDate =
        gameDate;
    }


    if (
      gameDate >
      tournament.lastDate
    ) {
      tournament.lastDate =
        gameDate;
    }

  });


  const now =
    new Date();


  return Array
    .from(
      tournaments.values()
    )

    .filter(
      tournament =>
        tournament.lastDate >= now
    )

    .sort(
      (a, b) =>
        a.firstDate -
        b.firstDate
    );

}


/* =========================================================
   FORMAT DATE RANGE
   ========================================================= */

function formatTournamentDates(
  firstDate,
  lastDate
) {

  const sameDay =
    firstDate.toDateString() ===
    lastDate.toDateString();


  if (sameDay) {
    return formatDate(firstDate);
  }


  const sameYear =
    firstDate.getUTCFullYear() ===
    lastDate.getUTCFullYear();


  const sameMonth =
    firstDate.getUTCMonth() ===
    lastDate.getUTCMonth() &&
    sameYear;


  if (sameMonth) {

    const month =
      firstDate.toLocaleDateString(
        "en-US",
        {
          month: "long",
          timeZone: "UTC"
        }
      );


    return (
      `${month} ` +
      `${firstDate.getUTCDate()}–` +
      `${lastDate.getUTCDate()}, ` +
      `${firstDate.getUTCFullYear()}`
    );

  }


  return (
    `${formatDate(firstDate)} – ` +
    `${formatDate(lastDate)}`
  );

}


/* =========================================================
   RENDER
   ========================================================= */

function renderUpcomingTournaments(
  tournaments
) {

  const root =
    document.getElementById(
      "upcomingTournamentRoot"
    );


  if (!root) {
    return;
  }


  if (!tournaments.length) {

    root.innerHTML =
      `
        <div class="upcoming-empty">
          No upcoming tournaments are currently scheduled.
        </div>
      `;

    return;
  }


  root.innerHTML =
    tournaments

      .map(
        tournament => `

          <article class="upcoming-tournament-card">

            <div class="upcoming-tournament-year">
              ${upcomingEscapeHtml(tournament.year)}
            </div>

            <h3>
              ${upcomingEscapeHtml(tournament.location)}
            </h3>

            <div class="upcoming-tournament-date">
              ${upcomingEscapeHtml(
                formatTournamentDates(
                  tournament.firstDate,
                  tournament.lastDate
                )
              )}
            </div>

            <a
              href="../tournament-information-hub/index.html"
              class="primary-button"
            >
              View Tournament Hub
            </a>

          </article>

        `
      )

      .join("");

}


/* =========================================================
   LOAD DATA
   ========================================================= */

function loadUpcomingTournaments() {

  fetch(
    UPCOMING_CONFIG.dataUrl
  )

    .then(response => {

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      return response.json();

    })

    .then(data => {

      const rows =
        data.results || [];

      const tournaments =
        buildUpcomingTournaments(
          rows
        );

      renderUpcomingTournaments(
        tournaments
      );

    })

    .catch(error => {

      console.error(
        "Upcoming tournaments error:",
        error
      );


      const root =
        document.getElementById(
          "upcomingTournamentRoot"
        );


      if (root) {

        root.innerHTML =
          `
            <div class="upcoming-empty">
              Unable to load upcoming tournaments.
            </div>
          `;

      }

    });

}


/* =========================================================
   START
   ========================================================= */

loadUpcomingTournaments();