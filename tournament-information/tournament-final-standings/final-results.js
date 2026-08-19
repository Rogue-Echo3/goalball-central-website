/* =========================================================
   GOALBALL CENTRAL
   TOURNAMENT FINAL RESULTS
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

const FINAL_RESULTS_CONFIG = {
  dataUrl:
    "https://script.google.com/macros/s/AKfycbydCRMOtEddewEYDGjMzq63NM35MJnJvAQz1p4-CAmm10pCUrh_qwhdzK6FdTYfUzX2/exec"
};


/* =========================================================
   DATA
   ========================================================= */

let allFinalStandings = [];
let allScheduleRows = [];


/* =========================================================
   HELPERS
   ========================================================= */

function finalNormalize(value) {
  return String(value ?? "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function finalEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function finalTournamentKey(
  year,
  location
) {
  return (
    `${finalNormalize(year)}|||` +
    `${finalNormalize(location)}`
  );
}


function splitFinalTournamentKey(key) {
  const parts =
    String(key || "").split("|||");

  return {
    year:
      parts[0] || "",

    location:
      parts[1] || ""
  };
}


function parseFinalDate(value) {
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


/* =========================================================
   BUILD TOURNAMENT LIST
   ========================================================= */

function buildFinalResultsTournamentList() {
  const tournamentMap =
    new Map();


  allFinalStandings.forEach(row => {

    const year =
      finalNormalize(
        row["Year"]
      );

    const location =
      finalNormalize(
        row["Location"]
      );

    if (!year || !location) {
      return;
    }


    const key =
      finalTournamentKey(
        year,
        location
      );


    tournamentMap.set(
      key,
      {
        key,
        year,
        location,
        latestDate:
          new Date(0)
      }
    );

  });


  /*
    Use schedule/results dates
    to sort tournament final results
    newest to oldest.
  */

  allScheduleRows.forEach(row => {

    const year =
      finalNormalize(
        row["Year"]
      );

    const location =
      finalNormalize(
        row["Location"]
      );


    if (!year || !location) {
      return;
    }


    const key =
      finalTournamentKey(
        year,
        location
      );


    if (!tournamentMap.has(key)) {
      return;
    }


    const parsed =
      parseFinalDate(
        row["GameDate"] ||
        row["Date"]
      );


    if (!parsed) {
      return;
    }


    const tournament =
      tournamentMap.get(key);


    if (
      parsed >
      tournament.latestDate
    ) {
      tournament.latestDate =
        parsed;
    }

  });


  return Array
    .from(
      tournamentMap.values()
    )

    .sort(
      (a, b) => {

        const dateDiff =
          b.latestDate -
          a.latestDate;

        if (dateDiff !== 0) {
          return dateDiff;
        }


        const yearDiff =
          Number(b.year) -
          Number(a.year);

        if (yearDiff !== 0) {
          return yearDiff;
        }


        return a.location.localeCompare(
          b.location
        );

      }
    );
}


/* =========================================================
   BUILD SELECTOR
   ========================================================= */

function buildFinalResultsSelector(
  tournaments
) {
  const select =
    document.getElementById(
      "finalResultsTournamentSelect"
    );


  if (!select) {
    return;
  }


  if (!tournaments.length) {
    select.innerHTML =
      `
        <option value="">
          No final results available
        </option>
      `;

    return;
  }


  select.innerHTML =
    tournaments

      .map(
        tournament => `

          <option
            value="${finalEscapeHtml(tournament.key)}"
          >
            ${finalEscapeHtml(tournament.year)}
            ${finalEscapeHtml(tournament.location)}
          </option>

        `
      )

      .join("");


  select.addEventListener(
    "change",
    () => {

      renderFinalResults(
        select.value
      );

    }
  );


  select.value =
    tournaments[0].key;


  renderFinalResults(
    tournaments[0].key
  );
}


/* =========================================================
   MEDAL ROW
   ========================================================= */

function makeMedalRow(
  medal,
  team,
  className
) {
  return `
    <li class="final-medal-row">

      <span class="final-medal ${className}">
        ${finalEscapeHtml(medal)}
      </span>

      <span class="final-team">
        ${finalEscapeHtml(team || "TBD")}
      </span>

    </li>
  `;
}


/* =========================================================
   DIVISION CARD
   ========================================================= */

function makeDivisionCard(
  title,
  gold,
  silver,
  bronze
) {
  return `
    <article class="final-division-card">

      <div class="final-division-title">
        ${finalEscapeHtml(title)}
      </div>

      <ul class="final-medal-list">

        ${makeMedalRow(
          "Gold",
          gold,
          "gold"
        )}

        ${makeMedalRow(
          "Silver",
          silver,
          "silver"
        )}

        ${makeMedalRow(
          "Bronze",
          bronze,
          "bronze"
        )}

      </ul>

    </article>
  `;
}


/* =========================================================
   RENDER FINAL RESULTS
   ========================================================= */

function renderFinalResults(
  tournamentKey
) {
  const root =
    document.getElementById(
      "finalResultsRoot"
    );

  const title =
    document.getElementById(
      "finalResultsTournamentTitle"
    );


  if (!root || !title) {
    return;
  }


  const tournament =
    splitFinalTournamentKey(
      tournamentKey
    );


  title.textContent =
    `${tournament.year} ${tournament.location}`;


  const row =
    allFinalStandings.find(
      standing =>
        finalNormalize(
          standing["Year"]
        ) ===
          tournament.year
        &&
        finalNormalize(
          standing["Location"]
        ) ===
          tournament.location
    );


  if (!row) {
    root.innerHTML =
      `
        <div class="final-results-empty">
          No final standings found for this tournament.
        </div>
      `;

    return;
  }


  root.innerHTML =
    `
      <div class="final-results-grid">

        ${makeDivisionCard(
          "Men's Division",
          row["Men Gold"],
          row["Men Silver"],
          row["Men Bronze"]
        )}

        ${makeDivisionCard(
          "Women's Division",
          row["Women Gold"],
          row["Women Silver"],
          row["Women Bronze"]
        )}

      </div>
    `;
}


/* =========================================================
   LOAD DATA
   ========================================================= */

function loadFinalResults() {
  fetch(
    FINAL_RESULTS_CONFIG.dataUrl
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

      allFinalStandings =
        data.finalStandings || [];

      allScheduleRows =
        data.results || [];


      const tournaments =
        buildFinalResultsTournamentList();


      buildFinalResultsSelector(
        tournaments
      );

    })

    .catch(error => {

      console.error(
        "Tournament Final Results Error:",
        error
      );


      const root =
        document.getElementById(
          "finalResultsRoot"
        );


      const title =
        document.getElementById(
          "finalResultsTournamentTitle"
        );


      if (title) {
        title.textContent =
          "Unable to load final results";
      }


      if (root) {
        root.innerHTML =
          `
            <div class="final-results-empty">
              Failed to load tournament final results.
            </div>
          `;
      }

    });
}


/* =========================================================
   START
   ========================================================= */

loadFinalResults();