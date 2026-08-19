/* =========================================================
   GOALBALL CENTRAL
   HOMEPAGE JAVASCRIPT
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const CONFIG = {

  dataUrl:
    "https://script.google.com/macros/s/AKfycbydCRMOtEddewEYDGjMzq63NM35MJnJvAQz1p4-CAmm10pCUrh_qwhdzK6FdTYfUzX2/exec",

  displayTimezone:
    "America/New_York",

  eventOffset:
    "-04:00",

  gameLengthMin:
    45,

  maxResults:
    3
};



/* =========================================================
   MOBILE MENU
   ========================================================= */

const mobileMenuButton =
  document.getElementById(
    "mobileMenuButton"
  );


const mobileNav =
  document.getElementById(
    "mobileNav"
  );


if (
  mobileMenuButton &&
  mobileNav
) {

  mobileMenuButton
    .addEventListener(
      "click",
      () => {

        mobileNav
          .classList
          .toggle(
            "open"
          );

      }
    );

}



/* =========================================================
   SHARED HELPERS
   ========================================================= */

function normalize(value) {

  return String(
    value ?? ""
  )
    .replace(
      /,/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}



function escapeHtml(value) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#39;"
    );

}



/* =========================================================
   DATE HELPERS
   ========================================================= */

function todayISO() {

  return new Date()
    .toLocaleDateString(
      "en-CA",
      {
        timeZone:
          CONFIG.displayTimezone
      }
    );

}



function dateToISO(value) {

  const text =
    String(
      value ?? ""
    )
    .trim();


  if (!text) {
    return "";
  }


  const parsed =
    new Date(text);


  if (
    isNaN(
      parsed.getTime()
    )
  ) {

    return "";

  }


  return parsed
    .toLocaleDateString(
      "en-CA",
      {
        timeZone: "UTC"
      }
    );

}



function formatGameDate(value) {

  const text =
    String(
      value ?? ""
    )
    .trim();


  if (!text) {
    return "";
  }


  const parsed =
    new Date(text);


  if (
    isNaN(
      parsed.getTime()
    )
  ) {

    return text;

  }


  return parsed
    .toLocaleDateString(
      "en-US",
      {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
      }
    );

}



/* =========================================================
   TIME HELPERS
   ========================================================= */

function timeTo24Hour(
  timeString
) {

  const text =
    String(
      timeString || ""
    )
    .trim()
    .toUpperCase();


  const amPmMatch =
    text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
    );


  if (amPmMatch) {

    let hour =
      parseInt(
        amPmMatch[1],
        10
      );


    const minute =
      parseInt(
        amPmMatch[2],
        10
      );


    const period =
      amPmMatch[3];


    if (
      period === "PM" &&
      hour !== 12
    ) {

      hour += 12;

    }


    if (
      period === "AM" &&
      hour === 12
    ) {

      hour = 0;

    }


    return (
      `${String(hour).padStart(2, "0")}:` +
      `${String(minute).padStart(2, "0")}`
    );

  }


  const twentyFourMatch =
    text.match(
      /^(\d{1,2}):(\d{2})$/
    );


  if (twentyFourMatch) {

    const hour =
      parseInt(
        twentyFourMatch[1],
        10
      );


    const minute =
      parseInt(
        twentyFourMatch[2],
        10
      );


    return (
      `${String(hour).padStart(2, "0")}:` +
      `${String(minute).padStart(2, "0")}`
    );

  }


  return null;

}



/* =========================================================
   EVENT DATE
   ========================================================= */

function eventDate(
  gameDate,
  time
) {

  const isoDate =
    dateToISO(
      gameDate
    );


  const hhmm =
    timeTo24Hour(
      time
    );


  if (
    !isoDate ||
    !hhmm
  ) {

    return null;

  }


  return new Date(
    `${isoDate}T${hhmm}:00${CONFIG.eventOffset}`
  );

}



/* =========================================================
   DISPLAY TIME
   ========================================================= */

function formatTimeFromGame(
  game
) {

  const start =
    eventDate(
      game.GameDate,
      game.Time
    );


  if (!start) {

    return (
      game.Time ||
      ""
    );

  }


  return start
    .toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        timeZone:
          CONFIG.displayTimezone
      }
    );

}



/* =========================================================
   RESULT HELPERS
   ========================================================= */

function getResult(row) {

  return normalize(
    row["Result"] ||
    row["SCORE"] ||
    row["Score"]
  );

}



function hasResult(row) {

  const result =
    getResult(row);


  return (
    result &&
    result !== "TBD" &&
    result !== "?" &&
    result !== "-"
  );

}



/* =========================================================
   GET LATEST TOURNAMENT
   ========================================================= */

function getLatestTournamentByGameDate(
  rows
) {

  let latestRow =
    null;


  let latestDate =
    null;


  rows.forEach(
    row => {

      const year =
        normalize(
          row["Year"]
        );


      const location =
        normalize(
          row["Location"]
        );


      const gameDate =
        dateToISO(
          row["GameDate"]
        );


      if (
        !year ||
        !location ||
        !gameDate
      ) {

        return;

      }


      const parsed =
        new Date(
          `${gameDate}T00:00:00`
        );


      if (
        !latestDate ||
        parsed > latestDate
      ) {

        latestDate =
          parsed;


        latestRow =
          row;

      }

    }
  );


  if (!latestRow) {

    return null;

  }


  return {

    year:
      normalize(
        latestRow["Year"]
      ),

    location:
      normalize(
        latestRow["Location"]
      ),

    latestDate:
      latestDate

  };

}



/* =========================================================
   DASHBOARD STATUS
   ========================================================= */

let activeEventStart =
  null;


let activeEventEnd =
  null;



function formatCountdown(
  targetDate
) {

  const now =
    new Date();


  const difference =
    targetDate -
    now;


  if (
    difference <= 0
  ) {

    return "LIVE NOW";

  }


  const days =
    Math.floor(
      difference /
      86400000
    );


  const hours =
    Math.floor(
      (
        difference %
        86400000
      ) /
      3600000
    );


  const minutes =
    Math.floor(
      (
        difference %
        3600000
      ) /
      60000
    );


  const seconds =
    Math.floor(
      (
        difference %
        60000
      ) /
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
   RENDER DASHBOARD
   ========================================================= */

function renderDashboard(
  tournamentRows,
  tournament
) {

  const badge =
    document.getElementById(
      "mainStatusBadge"
    );


  const tournamentName =
    document.getElementById(
      "dashboardTournament"
    );


  const tournamentSub =
    document.getElementById(
      "dashboardTournamentSub"
    );


  const statusLabel =
    document.getElementById(
      "dashboardStatusLabel"
    );


  const statusValue =
    document.getElementById(
      "dashboardStatus"
    );


  const next =
    document.getElementById(
      "dashboardNext"
    );


  const nextSub =
    document.getElementById(
      "dashboardNextSub"
    );


  const latest =
    document.getElementById(
      "dashboardLatest"
    );


  const latestSub =
    document.getElementById(
      "dashboardLatestSub"
    );


  if (
    !tournament ||
    !tournamentRows.length
  ) {

    badge.textContent =
      "UPDATE";


    tournamentName.textContent =
      "Goalball Central";


    tournamentSub.textContent =
      "Tournament coverage";


    statusValue.textContent =
      "No tournament";


    next.textContent =
      "Check back soon";


    nextSub.textContent =
      "More updates coming";


    latest.textContent =
      "Tournament coverage";


    latestSub.textContent =
      "Schedules, results and rankings";


    return;

  }


  const rows =
    tournamentRows

      .map(
        row => ({
          row,
          date:
            eventDate(
              row.GameDate,
              row.Time
            )
        })
      )

      .filter(
        item =>
          item.date
      )

      .sort(
        (
          a,
          b
        ) =>
          a.date -
          b.date
      );


  if (!rows.length) {

    return;

  }


  const first =
    rows[0];


  const last =
    rows[
      rows.length - 1
    ];


  activeEventStart =
    first.date;


  activeEventEnd =
    last.date;


  const now =
    new Date();


  const completed =
    rows.filter(
      item =>
        hasResult(
          item.row
        )
    );


  const upcoming =
    rows.filter(
      item =>
        !hasResult(
          item.row
        ) &&
        item.date >= now
    );


  const recent =
    completed[
      completed.length - 1
    ];


  const nextGame =
    upcoming[0];


  tournamentName.textContent =
    `${tournament.year} ${tournament.location}`;


  tournamentSub.textContent =
    "Goalball Central";


  badge.classList.remove(
    "final",
    "live",
    "next",
    "update"
  );



  /* BEFORE EVENT */

  if (
    now <
    first.date
  ) {

    badge.textContent =
      "NEXT";


    badge.classList.add(
      "next"
    );


    statusLabel.textContent =
      "Countdown";


    statusValue.textContent =
      formatCountdown(
        first.date
      );


    latest.textContent =
      "Tournament starts soon";


    latestSub.textContent =
      `First game ${formatTimeFromGame(first.row)}`;


    if (nextGame) {

      next.textContent =
        `${normalize(nextGame.row["Team A"])} vs ${normalize(nextGame.row["Team B"])}`;


      nextSub.textContent =
        `${formatTimeFromGame(nextGame.row)} • ${normalize(nextGame.row["Gym"])}`;

    }


    updateTicker(
      "NEXT",
      `${tournament.year} ${tournament.location}`,
      latest.textContent,
      next.textContent
    );


    return;

  }



  /* LIVE */

  if (
    now <=
    last.date
  ) {

    badge.textContent =
      "LIVE";


    badge.classList.add(
      "live"
    );


    statusLabel.textContent =
      "Status";


    statusValue.textContent =
      "LIVE NOW";


    if (recent) {

      latest.textContent =
        `${normalize(recent.row["Team A"])} ${getResult(recent.row)} ${normalize(recent.row["Team B"])}`;


      latestSub.textContent =
        "Latest result";

    } else {

      latest.textContent =
        "Tournament is live";


      latestSub.textContent =
        "Results update here";

    }


    if (nextGame) {

      next.textContent =
        `${normalize(nextGame.row["Team A"])} vs ${normalize(nextGame.row["Team B"])}`;


      nextSub.textContent =
        `${formatTimeFromGame(nextGame.row)} • ${normalize(nextGame.row["Gym"])}`;

    } else {

      next.textContent =
        "No upcoming game listed";


      nextSub.textContent =
        "Check Tournament Information";

    }


    updateTicker(
      "LIVE",
      `${tournament.year} ${tournament.location}`,
      latest.textContent,
      next.textContent
    );


    return;

  }



  /* FINAL */

  badge.textContent =
    "FINAL";


  badge.classList.add(
    "final"
  );


  statusLabel.textContent =
    "Status";


  statusValue.textContent =
    "FINAL";


  next.textContent =
    "Final Standings";


  nextSub.textContent =
    "View tournament results";


  if (recent) {

    latest.textContent =
      `${normalize(recent.row["Team A"])} ${getResult(recent.row)} ${normalize(recent.row["Team B"])}`;


    latestSub.textContent =
      "Latest final result";

  } else {

    latest.textContent =
      "Final results posted";


    latestSub.textContent =
      "Tournament concluded";

  }


  updateTicker(
    "FINAL",
    `${tournament.year} ${tournament.location}`,
    latest.textContent,
    next.textContent
  );

}



/* =========================================================
   UPDATE TICKER
   ========================================================= */

function updateTicker(
  badge,
  tournament,
  latest,
  next
) {

  const label =
    document.getElementById(
      "tickerLabel"
    );


  const content =
    document.getElementById(
      "tickerContent"
    );


  if (
    !label ||
    !content
  ) {

    return;

  }


  label.textContent =
    badge;


  content.textContent =
    `● ${tournament}   ` +
    `● ${latest}   ` +
    `● ${next}   ` +
    `● Goalball Central - For John`;

}



/* =========================================================
   UPCOMING GAMES
   ========================================================= */

function renderUpcomingGames(
  tournamentRows,
  tournament
) {

  const container =
    document.getElementById(
      "upcomingGames"
    );


  const subtitle =
    document.getElementById(
      "upcomingSubtitle"
    );


  if (
    !container ||
    !subtitle
  ) {

    return;

  }


  if (!tournament) {

    subtitle.textContent =
      "No tournament found";


    container.innerHTML =
      `
        <div class="home-empty">
          No tournament schedule available
        </div>
      `;


    return;

  }


  subtitle.textContent =
    `${tournament.year} ${tournament.location}`;


  const today =
    todayISO();


  const todaysGames =
    tournamentRows

      .filter(
        row =>
          dateToISO(
            row["GameDate"]
          ) ===
          today
      )

      .sort(
        (
          a,
          b
        ) => {

          const aStart =
            eventDate(
              a.GameDate,
              a.Time
            );


          const bStart =
            eventDate(
              b.GameDate,
              b.Time
            );


          if (
            !aStart &&
            !bStart
          ) {

            return 0;

          }


          if (!aStart) {
            return 1;
          }


          if (!bStart) {
            return -1;
          }


          return (
            aStart -
            bStart
          );

        }
      );


  if (
    !todaysGames.length
  ) {

    container.innerHTML =
      `
        <div class="home-empty">
          No scheduled games for today
        </div>
      `;


    return;

  }


  const now =
    new Date();


  let markedNext =
    false;


  container.innerHTML =
    todaysGames

      .map(
        game => {

          const start =
            eventDate(
              game.GameDate,
              game.Time
            );


          if (!start) {

            return "";

          }


          const end =
            new Date(
              start.getTime() +
              CONFIG.gameLengthMin *
              60000
            );


          let rowClass =
            "";


          let status =
            "";


          if (
            now >= start &&
            now < end
          ) {

            rowClass =
              "live";


            status =
              "LIVE";

          } else if (
            !markedNext &&
            now < start
          ) {

            markedNext =
              true;


            rowClass =
              "up-next";


            status =
              "UP NEXT";

          }


          return `
            <div class="game-row ${rowClass}">

              <div class="game-meta">

                <span class="game-time">
                  ${escapeHtml(formatTimeFromGame(game))}
                </span>

                <span class="game-gym">
                  ${escapeHtml(game["Gym"] || "")}
                </span>

                <span class="game-division">
                  ${escapeHtml(game["M/W"] || "")}
                </span>

              </div>

              <div class="game-time desktop-game-field">
                ${escapeHtml(formatTimeFromGame(game))}
              </div>

              <div class="game-gym desktop-game-field">
                ${escapeHtml(game["Gym"] || "")}
              </div>

              <div class="game-division desktop-game-field">
                ${escapeHtml(game["M/W"] || "")}
              </div>

              <div class="game-match">
                ${escapeHtml(game["Team A"])}
                vs
                ${escapeHtml(game["Team B"])}
              </div>

              <div class="game-status">
                ${escapeHtml(status)}
              </div>

            </div>
          `;

        }
      )

      .join("");

}



/* =========================================================
   LATEST RESULTS
   ========================================================= */

function timeToMinutes(
  timeString
) {

  const hhmm =
    timeTo24Hour(
      timeString
    );


  if (!hhmm) {

    return -1;

  }


  const parts =
    hhmm.split(":");


  return (
    parseInt(
      parts[0],
      10
    ) *
    60 +
    parseInt(
      parts[1],
      10
    )
  );

}



function renderLatestResults(
  tournamentRows,
  tournament
) {

  const container =
    document.getElementById(
      "latestResults"
    );


  const subtitle =
    document.getElementById(
      "latestResultsSubtitle"
    );


  if (
    !container ||
    !subtitle
  ) {

    return;

  }


  if (!tournament) {

    subtitle.textContent =
      "No tournament data found";


    container.innerHTML =
      `
        <div class="home-empty">
          No results available
        </div>
      `;


    return;

  }


  subtitle.textContent =
    `${tournament.year} ${tournament.location}`;


  const completed =
    tournamentRows

      .filter(
        row =>
          hasResult(
            row
          )
      );


  completed.sort(
    (
      a,
      b
    ) => {

      const dateA =
        dateToISO(
          a["GameDate"]
        );


      const dateB =
        dateToISO(
          b["GameDate"]
        );


      if (
        dateA !==
        dateB
      ) {

        return (
          dateB >
          dateA
            ? 1
            : -1
        );

      }


      return (
        timeToMinutes(
          b["Time"]
        ) -
        timeToMinutes(
          a["Time"]
        )
      );

    }
  );


  const latest =
    completed.slice(
      0,
      CONFIG.maxResults
    );


  if (
    !latest.length
  ) {

    container.innerHTML =
      `
        <div class="home-empty">
          No completed results yet
        </div>
      `;


    return;

  }


  container.innerHTML =
    latest

      .map(
        row => `

          <article class="result-card">

            <div class="result-event">

              ${escapeHtml(row["Year"])}
              ${escapeHtml(row["Location"])}

            </div>


            <div class="result-meta">

              ${escapeHtml(formatGameDate(row["GameDate"] || row["Date"]))}

              •

              ${escapeHtml(formatTimeFromGame(row))}

              •

              ${escapeHtml(row["Gym"] || "Gym TBD")}

            </div>


            <div class="result-match">

              ${escapeHtml(row["Team A"])}

              vs

              ${escapeHtml(row["Team B"])}

            </div>


            <div class="result-score">

              ${escapeHtml(getResult(row))}

            </div>

          </article>

        `
      )

      .join("");

}



/* =========================================================
   LIVE COUNTDOWN REFRESH
   ========================================================= */

function updateCountdown() {

  if (
    !activeEventStart
  ) {

    return;

  }


  const now =
    new Date();


  const status =
    document.getElementById(
      "dashboardStatus"
    );


  const badge =
    document.getElementById(
      "mainStatusBadge"
    );


  if (
    !status ||
    !badge
  ) {

    return;

  }


  if (
    now <
    activeEventStart
  ) {

    status.textContent =
      formatCountdown(
        activeEventStart
      );


    return;

  }


  if (
    activeEventEnd &&
    now <= activeEventEnd
  ) {

    status.textContent =
      "LIVE NOW";


    return;

  }


  status.textContent =
    "FINAL";

}



/* =========================================================
   LOAD ALL HOMEPAGE DATA
   ========================================================= */

function loadHomeData() {

  fetch(
    CONFIG.dataUrl
  )

    .then(
      response => {

        if (
          !response.ok
        ) {

          throw new Error(
            `HTTP ${response.status}`
          );

        }


        return response.json();

      }
    )


    .then(
      data => {

        const rows =
          data.results ||
          [];


        const tournament =
          getLatestTournamentByGameDate(
            rows
          );


        if (!tournament) {

          renderDashboard(
            [],
            null
          );


          renderUpcomingGames(
            [],
            null
          );


          renderLatestResults(
            [],
            null
          );


          return;

        }


        const tournamentRows =
          rows.filter(
            row =>

              normalize(
                row["Year"]
              ) ===
              tournament.year

              &&

              normalize(
                row["Location"]
              ) ===
              tournament.location

          );


        renderDashboard(
          tournamentRows,
          tournament
        );


        renderUpcomingGames(
          tournamentRows,
          tournament
        );


        renderLatestResults(
          tournamentRows,
          tournament
        );

      }
    )


    .catch(
      error => {

        console.error(
          "Goalball Central homepage data error:",
          error
        );


        document
          .getElementById(
            "upcomingSubtitle"
          )
          .textContent =
          "Unable to load tournament";


        document
          .getElementById(
            "upcomingGames"
          )
          .innerHTML =
          `
            <div class="home-empty">
              Failed to load schedule
            </div>
          `;


        document
          .getElementById(
            "latestResultsSubtitle"
          )
          .textContent =
          "Unable to load tournament";


        document
          .getElementById(
            "latestResults"
          )
          .innerHTML =
          `
            <div class="home-empty">
              Failed to load latest results
            </div>
          `;

      }
    );

}



/* =========================================================
   START SITE
   ========================================================= */

loadHomeData();


/* countdown */

setInterval(
  updateCountdown,
  1000
);


/* Refresh live data every five minutes */

setInterval(
  loadHomeData,
  300000
);


/* Refresh game LIVE / UP NEXT state every 30 seconds */

setInterval(
  loadHomeData,
  30000
);