/* =========================================================
   GOALBALL CENTRAL
   TOURNAMENT INFORMATION HUB
   ========================================================= */


/* =========================================================
   MOBILE NAVIGATION
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

const CONFIG = {
  dataUrl:
    "https://script.google.com/macros/s/AKfycbydCRMOtEddewEYDGjMzq63NM35MJnJvAQz1p4-CAmm10pCUrh_qwhdzK6FdTYfUzX2/exec"
};


/* =========================================================
   DATA
   ========================================================= */

let allResults = [];
let allPools = [];
let allFinalStandings = [];
let allLivestreams = [];

let currentTournament = "";

let scheduleData = {};
let resultsData = {};

let scheduleDayOrder = [];
let resultsDayOrder = [];


/* =========================================================
   HELPERS
   ========================================================= */

function normalize(value) {
  return String(value ?? "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function parsePossibleDate(value) {
  const text =
    String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const parsed =
    new Date(text);

  return isNaN(parsed.getTime())
    ? null
    : parsed;
}


function getDateKey(value) {
  const parsed =
    parsePossibleDate(value);

  if (parsed) {
    return parsed.toISOString();
  }

  return normalize(value);
}


function formatTabLabel(value) {
  const parsed =
    parsePossibleDate(value);

  if (parsed) {
    return parsed.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC"
      }
    );
  }

  return normalize(value);
}


function formatTime(value) {
  const text =
    String(value ?? "").trim();

  if (!text) {
    return "";
  }

  /*
    Handle ISO-formatted time values.
  */

  const isoMatch =
    text.match(/T(\d{2}):(\d{2})/);

  if (isoMatch) {
    const hour24 =
      Number(isoMatch[1]);

    const minute =
      isoMatch[2];

    const period =
      hour24 >= 12
        ? "PM"
        : "AM";

    let hour =
      hour24 % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${hour}:${minute} ${period}`;
  }


  /*
    Handle 24-hour HH:MM.
  */

  const twentyFour =
    text.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFour) {
    const hour24 =
      Number(twentyFour[1]);

    const minute =
      twentyFour[2];

    const period =
      hour24 >= 12
        ? "PM"
        : "AM";

    let hour =
      hour24 % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${hour}:${minute} ${period}`;
  }


  return text;
}


function formatResult(value) {
  const text =
    String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const parsed =
    new Date(text);

  if (
    !isNaN(parsed.getTime()) &&
    text.includes("T")
  ) {
    return (
      `${parsed.getUTCMonth() + 1}-` +
      `${parsed.getUTCDate()}`
    );
  }

  return text;
}


function makeTournamentKey(
  year,
  location
) {
  return (
    `${normalize(year)}|||` +
    `${normalize(location)}`
  );
}


function splitTournamentKey(key) {
  const parts =
    String(key || "").split("|||");

  return {
    year:
      parts[0] || "",

    location:
      parts[1] || ""
  };
}


/* =========================================================
   MAIN SECTION TABS
   ========================================================= */

function showSection(
  section,
  element
) {
  document
    .querySelectorAll(".main-tab")
    .forEach(tab => {
      tab.classList.remove("active");
    });

  if (element) {
    element.classList.add("active");
  }

  document
    .querySelectorAll(".section")
    .forEach(sectionElement => {
      sectionElement.classList.remove("active");
    });

  const target =
    document.getElementById(
      `${section}-section`
    );

  if (target) {
    target.classList.add("active");
  }
}


/* =========================================================
   TOURNAMENT TITLE
   ========================================================= */

function updateTournamentTitle() {
  const event =
    splitTournamentKey(
      currentTournament
    );

  const title =
    document.getElementById(
      "selected-tournament-title"
    );

  if (title) {
    title.textContent =
      `${event.year} ${event.location}`;
  }
}


/* =========================================================
   GAME TABLE
   ========================================================= */

function makeGameTable(
  rows,
  showResults
) {
  if (!rows.length) {
    return `
      <div class="notice">
        No games for this day.
      </div>
    `;
  }

  return `
    <div class="hub-table-wrap">

      <table class="hub-table game-table">

        <thead>

          <tr>
            <th>Time</th>
            <th>Gym</th>
            <th>M/W</th>
            <th>Team A</th>
            <th>VS</th>
            <th>Team B</th>

            ${
              showResults
                ? "<th>Result</th>"
                : ""
            }

          </tr>

        </thead>

        <tbody>

          ${rows.map(row => `

            <tr>

              <td data-label="Time">
                ${escapeHtml(formatTime(row["Time"]))}
              </td>

              <td data-label="Gym">

                <span class="gym-badge">
                  ${escapeHtml(row["Gym"] || "")}
                </span>

              </td>

              <td data-label="Division">
                ${escapeHtml(row["M/W"] || "")}
              </td>

              <td data-label="Team A">
                ${escapeHtml(row["Team A"] || "")}
              </td>

              <td
                data-label=""
                class="hub-vs"
              >
                vs
              </td>

              <td data-label="Team B">
                ${escapeHtml(row["Team B"] || "")}
              </td>

              ${
                showResults
                  ? `
                    <td
                      data-label="Result"
                      class="hub-result"
                    >
                      ${escapeHtml(formatResult(row["Result"]))}
                    </td>
                  `
                  : ""
              }

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


/* =========================================================
   DAY TABS
   ========================================================= */

function renderDayTabs(
  rootId,
  days,
  type
) {
  const root =
    document.getElementById(
      rootId
    );

  if (!root) {
    return;
  }

  root.innerHTML =
    days.map(
      (day, index) => {

        const key =
          getDateKey(day);

        const label =
          formatTabLabel(day);

        return `
          <button
            type="button"
            class="sub-tab ${index === 0 ? "active" : ""}"
            data-day-key="${escapeHtml(key)}"
          >
            ${escapeHtml(label)}
          </button>
        `;
      }
    )
    .join("");


  root
    .querySelectorAll(".sub-tab")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          if (type === "schedule") {
            showScheduleDay(
              button.dataset.dayKey,
              button
            );
          }

          if (type === "results") {
            showResultsDay(
              button.dataset.dayKey,
              button
            );
          }

        }
      );

    });
}


/* =========================================================
   SHOW SCHEDULE DAY
   ========================================================= */

function showScheduleDay(
  dayKey,
  element
) {
  document
    .querySelectorAll(
      "#schedule-tabs .sub-tab"
    )
    .forEach(tab => {
      tab.classList.remove("active");
    });

  if (element) {
    element.classList.add("active");
  }

  const root =
    document.getElementById(
      "schedule-root"
    );

  if (root) {
    root.innerHTML =
      scheduleData[dayKey] ||
      `
        <div class="notice">
          No games for this day.
        </div>
      `;
  }
}


/* =========================================================
   SHOW RESULTS DAY
   ========================================================= */

function showResultsDay(
  dayKey,
  element
) {
  document
    .querySelectorAll(
      "#results-tabs .sub-tab"
    )
    .forEach(tab => {
      tab.classList.remove("active");
    });

  if (element) {
    element.classList.add("active");
  }

  const root =
    document.getElementById(
      "results-root"
    );

  if (root) {
    root.innerHTML =
      resultsData[dayKey] ||
      `
        <div class="notice">
          No results for this day.
        </div>
      `;
  }
}


/* =========================================================
   POOL SORTING
   ========================================================= */

function sortPoolRows(rows) {
  return [...rows].sort(
    (a, b) => {

      const pointsDiff =
        Number(
          b["POINT TOTAL"] ||
          b["POINTS"] ||
          0
        ) -
        Number(
          a["POINT TOTAL"] ||
          a["POINTS"] ||
          0
        );

      if (pointsDiff !== 0) {
        return pointsDiff;
      }


      const gdDiff =
        Number(b["GD"] || 0) -
        Number(a["GD"] || 0);

      if (gdDiff !== 0) {
        return gdDiff;
      }


      const forDiff =
        Number(b["FOR"] || 0) -
        Number(a["FOR"] || 0);

      if (forDiff !== 0) {
        return forDiff;
      }


      return normalize(
        a["TEAM"]
      ).localeCompare(
        normalize(
          b["TEAM"]
        )
      );

    }
  );
}


/* =========================================================
   POOL TABLE
   ========================================================= */

function makePoolTable(
  poolName,
  rows
) {
  const sortedRows =
    sortPoolRows(rows);

  return `
    <section class="pool-block">

      <h3 class="pool-title">
        Pool ${escapeHtml(poolName)}
      </h3>

      <div class="hub-table-wrap">

        <table class="hub-table pool-table">

          <thead>

            <tr>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>FOR</th>
              <th>AGAINST</th>
              <th>GD</th>
              <th>PTS</th>
              <th>GP</th>
            </tr>

          </thead>

          <tbody>

            ${sortedRows.map(row => `

              <tr>

                <td
                  data-label="Team"
                  class="hub-team-cell"
                >
                  ${escapeHtml(row["TEAM"] || "")}
                </td>

                <td data-label="W">
                  ${escapeHtml(row["WON"] || "0")}
                </td>

                <td data-label="L">
                  ${escapeHtml(row["LOST"] || "0")}
                </td>

                <td data-label="T">
                  ${escapeHtml(row["TIED"] || "0")}
                </td>

                <td data-label="FOR">
                  ${escapeHtml(row["FOR"] || "0")}
                </td>

                <td data-label="AGAINST">
                  ${escapeHtml(row["AGAINST"] || "0")}
                </td>

                <td data-label="GD">
                  ${escapeHtml(row["GD"] || "0")}
                </td>

                <td data-label="PTS">
                  ${escapeHtml(
                    row["POINT TOTAL"] ||
                    row["POINTS"] ||
                    "0"
                  )}
                </td>

                <td data-label="GP">
                  ${escapeHtml(row["GP"] || "0")}
                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    </section>
  `;
}


/* =========================================================
   FINAL STANDINGS
   ========================================================= */

function makeStandingsCard(row) {
  return `
    <div class="standings-wrap">

      <section class="division-standings">

        <div class="gc-section-title">
          Men's Division
        </div>

        <ul class="gc-list">

          <li>
            <span class="gc-medal gold">
              Gold
            </span>

            <span class="gc-team">
              ${escapeHtml(row["Men Gold"] || "TBD")}
            </span>
          </li>

          <li>
            <span class="gc-medal silver">
              Silver
            </span>

            <span class="gc-team">
              ${escapeHtml(row["Men Silver"] || "TBD")}
            </span>
          </li>

          <li>
            <span class="gc-medal bronze">
              Bronze
            </span>

            <span class="gc-team">
              ${escapeHtml(row["Men Bronze"] || "TBD")}
            </span>
          </li>

        </ul>

      </section>


      <section class="division-standings">

        <div class="gc-section-title">
          Women's Division
        </div>

        <ul class="gc-list">

          <li>
            <span class="gc-medal gold">
              Gold
            </span>

            <span class="gc-team">
              ${escapeHtml(row["Women Gold"] || "TBD")}
            </span>
          </li>

          <li>
            <span class="gc-medal silver">
              Silver
            </span>

            <span class="gc-team">
              ${escapeHtml(row["Women Silver"] || "TBD")}
            </span>
          </li>

          <li>
            <span class="gc-medal bronze">
              Bronze
            </span>

            <span class="gc-team">
              ${escapeHtml(row["Women Bronze"] || "TBD")}
            </span>
          </li>

        </ul>

      </section>

    </div>
  `;
}


/* =========================================================
   LIVESTREAMS
   ========================================================= */

function makeLivestreamsSection(event) {
  const filtered =
    allLivestreams.filter(
      row =>
        normalize(row["Year"]) ===
          normalize(event.year) &&
        normalize(row["Location"]) ===
          normalize(event.location)
    );


  if (!filtered.length) {
    return `
      <div class="notice">
        No livestreams found for
        ${escapeHtml(event.year)}
        ${escapeHtml(event.location)}.
      </div>
    `;
  }


  const grouped = {};


  filtered.forEach(row => {

    const day =
      normalize(row["Day"]) ||
      "Tournament";

    const gym =
      normalize(row["Gym"]) ||
      "TBD";


    if (!grouped[day]) {
      grouped[day] = {};
    }


    if (!grouped[day][gym]) {
      grouped[day][gym] = [];
    }


    grouped[day][gym].push(row);

  });


  const dayOrder =
    Object.keys(grouped)
      .sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            undefined,
            {
              numeric: true
            }
          )
      );


  return dayOrder.map(day => {

    const gyms =
      Object.keys(grouped[day])
        .sort(
          (a, b) =>
            String(a).localeCompare(
              String(b),
              undefined,
              {
                numeric: true
              }
            )
        );


    const dayLabel =
      isNaN(Number(day))
        ? day
        : `Day ${day}`;


    return `
      <section class="hub-stream-day">

        <h3 class="hub-stream-day-title">
          ${escapeHtml(dayLabel)}
        </h3>


        <div class="hub-stream-grid">

          ${gyms.map(gym => {

            const gymLabel =
              gym.toLowerCase()
                .startsWith("gym")
                ? gym
                : `Gym ${gym}`;

            return `

              <article class="hub-stream-card">

                <div class="hub-stream-gym">
                  ${escapeHtml(gymLabel)}
                </div>


                <div class="hub-stream-links">

                  ${grouped[day][gym]
                    .map(stream => {

                      const url =
                        normalize(
                          stream["YouTube URL"]
                        );

                      if (!url) {
                        return "";
                      }

                      return `

                        <div class="hub-stream-item">

                          <a
                            class="hub-stream-button"
                            href="${escapeHtml(url)}"
                            target="_blank"
                            rel="noopener"
                          >
                            ▶ ${escapeHtml(
                              stream["Stream Part"] ||
                              "Watch Stream"
                            )}
                          </a>

                          ${
                            normalize(stream["Status"])
                              ? `
                                <span class="hub-stream-status">
                                  ${escapeHtml(stream["Status"])}
                                </span>
                              `
                              : ""
                          }

                        </div>

                      `;

                    })
                    .join("")}

                </div>

              </article>

            `;

          }).join("")}

        </div>

      </section>
    `;

  }).join("");
}


/* =========================================================
   TOURNAMENT SELECTOR
   ========================================================= */

function buildTournamentSelector() {
  const selector =
    document.getElementById(
      "tournament-select"
    );

  if (!selector) {
    return;
  }


  const tournamentMap =
    new Map();


  /*
    RESULTS / SCHEDULE
  */

  allResults.forEach(row => {

    const year =
      normalize(row["Year"]);

    const location =
      normalize(row["Location"]);

    if (!year || !location) {
      return;
    }

    tournamentMap.set(
      makeTournamentKey(
        year,
        location
      ),
      `${year} ${location}`
    );

  });


  /*
    POOLS
  */

  allPools.forEach(row => {

    const year =
      normalize(row["YEAR"]);

    const location =
      normalize(row["LOCATION"]);

    if (!year || !location) {
      return;
    }

    tournamentMap.set(
      makeTournamentKey(
        year,
        location
      ),
      `${year} ${location}`
    );

  });


  /*
    FINAL STANDINGS
  */

  allFinalStandings.forEach(row => {

    const year =
      normalize(row["Year"]);

    const location =
      normalize(row["Location"]);

    if (!year || !location) {
      return;
    }

    tournamentMap.set(
      makeTournamentKey(
        year,
        location
      ),
      `${year} ${location}`
    );

  });


  /*
    LIVESTREAMS
  */

  allLivestreams.forEach(row => {

    const year =
      normalize(row["Year"]);

    const location =
      normalize(row["Location"]);

    if (!year || !location) {
      return;
    }

    tournamentMap.set(
      makeTournamentKey(
        year,
        location
      ),
      `${year} ${location}`
    );

  });


  /*
    DETERMINE TOURNAMENT ORDER
    FROM LATEST GAME DATE
  */

  const tournamentDates = {};


  allResults.forEach(row => {

    const year =
      normalize(row["Year"]);

    const location =
      normalize(row["Location"]);

    if (!year || !location) {
      return;
    }


    const key =
      makeTournamentKey(
        year,
        location
      );


    const date =
      parsePossibleDate(
        row["GameDate"] ||
        row["Date"]
      );


    if (!date) {
      return;
    }


    if (
      !tournamentDates[key] ||
      date > tournamentDates[key]
    ) {
      tournamentDates[key] =
        date;
    }

  });


  const sorted =
    Array
      .from(
        tournamentMap.entries()
      )

      .sort(
        (a, b) => {

          const dateA =
            tournamentDates[a[0]] ||
            new Date(0);

          const dateB =
            tournamentDates[b[0]] ||
            new Date(0);

          return (
            dateB -
            dateA
          );

        }
      );


  selector.innerHTML =
    sorted.map(
      ([key, label]) => `

        <option
          value="${escapeHtml(key)}"
        >
          ${escapeHtml(label)}
        </option>

      `
    )
    .join("");


  if (sorted.length) {

    selector.value =
      sorted[0][0];

    currentTournament =
      sorted[0][0];

  }


  selector.addEventListener(
    "change",
    function () {

      currentTournament =
        this.value;

      renderTournament();

    }
  );
}


/* =========================================================
   RENDER TOURNAMENT
   ========================================================= */

function renderTournament() {
  scheduleData = {};
  resultsData = {};

  scheduleDayOrder = [];
  resultsDayOrder = [];


  updateTournamentTitle();


  const event =
    splitTournamentKey(
      currentTournament
    );


  /* =======================================================
     SCHEDULE / RESULTS
     ======================================================= */

  const filteredResults =
    allResults.filter(
      row =>
        normalize(row["Year"]) ===
          normalize(event.year) &&
        normalize(row["Location"]) ===
          normalize(event.location)
    );


  if (!filteredResults.length) {

    document
      .getElementById(
        "schedule-tabs"
      )
      .innerHTML = "";


    document
      .getElementById(
        "results-tabs"
      )
      .innerHTML = "";


    document
      .getElementById(
        "schedule-root"
      )
      .innerHTML =
      `
        <div class="notice">
          No schedule data found for
          ${escapeHtml(event.year)}
          ${escapeHtml(event.location)}.
        </div>
      `;


    document
      .getElementById(
        "results-root"
      )
      .innerHTML =
      `
        <div class="notice">
          No results data found for
          ${escapeHtml(event.year)}
          ${escapeHtml(event.location)}.
        </div>
      `;

  } else {


    /*
      SORT GAMES CHRONOLOGICALLY
    */

    filteredResults.sort(
      (a, b) => {

        const dateA =
          parsePossibleDate(
            a["GameDate"] ||
            a["Date"]
          );

        const dateB =
          parsePossibleDate(
            b["GameDate"] ||
            b["Date"]
          );


        if (
          dateA &&
          dateB
        ) {

          const dateDiff =
            dateA -
            dateB;

          if (dateDiff !== 0) {
            return dateDiff;
          }

        }


        return formatTime(
          a["Time"]
        ).localeCompare(
          formatTime(
            b["Time"]
          )
        );

      }
    );


    /*
      SCHEDULE DAYS
    */

    const seenSchedule =
      new Set();


    scheduleDayOrder =
      filteredResults

        .map(
          row =>
            row["Date"] ||
            row["GameDate"]
        )

        .filter(day => {

          const key =
            getDateKey(day);

          if (
            !key ||
            seenSchedule.has(key)
          ) {
            return false;
          }

          seenSchedule.add(key);

          return true;

        });


    scheduleDayOrder.forEach(day => {

      const key =
        getDateKey(day);


      const dayRows =
        filteredResults.filter(
          row =>
            getDateKey(
              row["Date"] ||
              row["GameDate"]
            ) ===
            key
        );


      scheduleData[key] =
        makeGameTable(
          dayRows,
          false
        );

    });


    /*
      RESULTS DAYS
    */

    const seenResults =
      new Set();


    resultsDayOrder =
      filteredResults

        .map(
          row =>
            row["Date"] ||
            row["GameDate"]
        )

        .filter(day => {

          const key =
            getDateKey(day);

          if (
            !key ||
            seenResults.has(key)
          ) {
            return false;
          }

          seenResults.add(key);

          return true;

        });


    resultsDayOrder.forEach(day => {

      const key =
        getDateKey(day);


      const dayRows =
        filteredResults.filter(
          row => {

            const sameDay =
              getDateKey(
                row["Date"] ||
                row["GameDate"]
              ) ===
              key;


            const result =
              normalize(
                row["Result"]
              );


            return (
              sameDay &&
              result !== "" &&
              result !== "TBD" &&
              result !== "?"
            );

          }
        );


      resultsData[key] =
        makeGameTable(
          dayRows,
          true
        );

    });


    /*
      RENDER DAY TABS
    */

    renderDayTabs(
      "schedule-tabs",
      scheduleDayOrder,
      "schedule"
    );


    if (
      scheduleDayOrder.length
    ) {

      const firstScheduleTab =
        document.querySelector(
          "#schedule-tabs .sub-tab"
        );


      showScheduleDay(
        getDateKey(
          scheduleDayOrder[0]
        ),
        firstScheduleTab
      );

    }


    renderDayTabs(
      "results-tabs",
      resultsDayOrder,
      "results"
    );


    if (
      resultsDayOrder.length
    ) {

      const firstResultsTab =
        document.querySelector(
          "#results-tabs .sub-tab"
        );


      showResultsDay(
        getDateKey(
          resultsDayOrder[0]
        ),
        firstResultsTab
      );

    }

  }


  /* =======================================================
     POOLS
     ======================================================= */

  const filteredPools =
    allPools.filter(
      row =>
        normalize(row["YEAR"]) ===
          normalize(event.year) &&
        normalize(row["LOCATION"]) ===
          normalize(event.location)
    );


  const poolsRoot =
    document.getElementById(
      "pools-root"
    );


  if (!filteredPools.length) {

    poolsRoot.innerHTML =
      `
        <div class="notice">
          No pool data found for
          ${escapeHtml(event.year)}
          ${escapeHtml(event.location)}.
        </div>
      `;

  } else {

    const poolMap =
      {};


    filteredPools.forEach(row => {

      const pool =
        normalize(
          row["POOL"]
        );


      if (!poolMap[pool]) {
        poolMap[pool] = [];
      }


      poolMap[pool]
        .push(row);

    });


    const poolOrder =
      Object
        .keys(poolMap)
        .sort(
          (a, b) =>
            String(a).localeCompare(
              String(b),
              undefined,
              {
                numeric: true
              }
            )
        );


    poolsRoot.innerHTML =
      poolOrder
        .map(
          pool =>
            makePoolTable(
              pool,
              poolMap[pool]
            )
        )
        .join("");

  }


  /* =======================================================
     FINAL STANDINGS
     ======================================================= */

  const standingsMatch =
    allFinalStandings.find(
      row =>
        normalize(row["Year"]) ===
          normalize(event.year) &&
        normalize(row["Location"]) ===
          normalize(event.location)
    );


  const standingsRoot =
    document.getElementById(
      "standings-root"
    );


  standingsRoot.innerHTML =
    standingsMatch
      ? makeStandingsCard(
          standingsMatch
        )
      : `
          <div class="notice">
            No final standings found for
            ${escapeHtml(event.year)}
            ${escapeHtml(event.location)}.
          </div>
        `;


  /* =======================================================
     LIVESTREAMS
     ======================================================= */

  document
    .getElementById(
      "livestreams-root"
    )
    .innerHTML =
    makeLivestreamsSection(
      event
    );
}


/* =========================================================
   LOAD HUB DATA
   ========================================================= */

function loadTournamentHub() {
  fetch(
    CONFIG.dataUrl
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

      allResults =
        data.results || [];

      allPools =
        data.pools || [];

      allFinalStandings =
        data.finalStandings || [];

      allLivestreams =
        data.livestreams || [];


      buildTournamentSelector();

      renderTournament();

    })

    .catch(error => {

      console.error(
        "Tournament Hub Error:",
        error
      );


      document
        .getElementById(
          "schedule-root"
        )
        .innerHTML =
        `
          <div class="notice">
            Failed to load tournament hub.
          </div>
        `;


      document
        .getElementById(
          "results-root"
        )
        .innerHTML = "";


      document
        .getElementById(
          "pools-root"
        )
        .innerHTML = "";


      document
        .getElementById(
          "standings-root"
        )
        .innerHTML = "";


      document
        .getElementById(
          "livestreams-root"
        )
        .innerHTML = "";

    });
}


/* =========================================================
   START
   ========================================================= */

loadTournamentHub();