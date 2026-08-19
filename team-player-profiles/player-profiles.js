const PLAYER_DATA_URL =
  "https://script.google.com/macros/s/AKfycby0kWtGkH4G9mI9jRVwajBWA8D_tJDRj4Uexgj_jmdin6-t6jbQap-SYIVG76F_8Fl4/exec?mode=profiles";


let playerData = [];


const playerSelect =
  document.getElementById(
    "playerSelect"
  );


const viewSelect =
  document.getElementById(
    "viewSelect"
  );


const yearSelect =
  document.getElementById(
    "yearSelect"
  );


const tournamentSelect =
  document.getElementById(
    "tournamentSelect"
  );


function playerUnique(array) {
  return [
    ...new Set(
      array.filter(Boolean)
    )
  ]
  .sort(
    (a, b) =>
      String(a)
        .localeCompare(
          String(b),
          undefined,
          {
            numeric: true
          }
        )
  );
}


function playerNum(value) {
  return (
    Number(
      String(value ?? "")
        .replace(
          /[^0-9.\-]/g,
          ""
        )
    ) ||
    0
  );
}


function playerDisplay(value) {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  )
    ? "-"
    : value;
}


function playerPct(value) {
  return (
    isFinite(value) &&
    !isNaN(value)
  )
    ? (
        value * 100
      ).toFixed(2) + "%"
    : "-";
}


function playerSum(
  rows,
  key
) {
  return rows.reduce(
    (
      total,
      row
    ) =>
      total +
      playerNum(
        row[key]
      ),
    0
  );
}


function playerEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function populatePlayerDropdowns() {
  playerSelect.innerHTML =
    playerUnique(
      playerData.map(
        row =>
          row["NAME"]
      )
    )
    .map(
      value =>
        `<option>${playerEscapeHtml(value)}</option>`
    )
    .join("");


  const years =
    playerUnique(
      playerData.map(
        row =>
          row["YEAR"]
      )
    )
    .sort(
      (a, b) =>
        String(b)
          .localeCompare(
            String(a),
            undefined,
            {
              numeric: true
            }
          )
    );


  yearSelect.innerHTML =
    years
      .map(
        value =>
          `<option>${playerEscapeHtml(value)}</option>`
      )
      .join("");


  updatePlayerTournamentDropdown();
}


function updatePlayerTournamentDropdown() {
  const player =
    playerSelect.value;

  const year =
    yearSelect.value;


  const possible =
    playerData.filter(
      row => {

        if (
          viewSelect.value ===
          "CAREER"
        ) {
          return (
            row["NAME"] ===
            player
          );
        }

        return (
          row["NAME"] ===
            player &&
          row["YEAR"] ===
            year
        );

      }
    );


  tournamentSelect.innerHTML =
    playerUnique(
      possible.map(
        row =>
          row["TOURNAMENT"]
      )
    )
    .map(
      value =>
        `<option>${playerEscapeHtml(value)}</option>`
    )
    .join("");
}


function getPlayerFilteredRows() {
  const player =
    playerSelect.value;

  const view =
    viewSelect.value;

  const year =
    yearSelect.value;

  const tournament =
    tournamentSelect.value;


  if (
    view ===
    "CAREER"
  ) {
    return playerData.filter(
      row =>
        row["NAME"] ===
        player
    );
  }


  if (
    view ===
    "YEAR"
  ) {
    return playerData.filter(
      row =>
        row["NAME"] ===
          player &&
        row["YEAR"] ===
          year
    );
  }


  return playerData.filter(
    row =>
      row["NAME"] ===
        player &&
      row["YEAR"] ===
        year &&
      row["TOURNAMENT"] ===
        tournament
  );
}


function mostCommonPenalty(rows) {
  const counts = {};


  rows.forEach(
    row => {

      const penalty =
        row[
          "Most Common Penalty"
        ];


      if (!penalty) {
        return;
      }


      counts[penalty] =
        (
          counts[penalty] ||
          0
        ) + 1;

    }
  );


  const sorted =
    Object.entries(
      counts
    )
    .sort(
      (a, b) =>
        b[1] -
        a[1]
    );


  return sorted.length
    ? sorted[0][0]
    : "-";
}


function latestUpdated(rows) {
  return (
    rows
      .map(
        row =>
          row["LAST UPDATED"]
      )
      .filter(Boolean)
      .pop() ||
    "-"
  );
}


function updatePlayerControlVisibility() {
  const view =
    viewSelect.value;


  yearSelect
    .closest(
      ".profile-control"
    )
    .style.display =
      view === "CAREER"
        ? "none"
        : "block";


  tournamentSelect
    .closest(
      ".profile-control"
    )
    .style.display =
      view === "TOURNAMENT"
        ? "block"
        : "none";
}


function renderPlayerProfile() {
  updatePlayerControlVisibility();

  updatePlayerTournamentDropdown();


  const rows =
    getPlayerFilteredRows();


  const loading =
    document.getElementById(
      "loading"
    );


  const profileGrid =
    document.getElementById(
      "profileGrid"
    );


  if (!rows.length) {

    loading.style.display =
      "block";

    loading.textContent =
      "No matching player data found.";

    profileGrid.style.display =
      "none";

    return;
  }


  loading.style.display =
    "none";


  profileGrid.style.display =
    "grid";


  const first =
    rows[0];


  const games =
    playerSum(
      rows,
      "# of Games"
    );


  const shots =
    playerSum(
      rows,
      "Shots Attempted"
    );


  const goals =
    playerSum(
      rows,
      "Goals Scored"
    );


  const blocks =
    playerSum(
      rows,
      "Block Attempts"
    );


  const goalsAllowed =
    playerSum(
      rows,
      "Goals Allowed"
    );


  const penScored =
    playerSum(
      rows,
      "Penalties Scored"
    );


  const penAllowed =
    playerSum(
      rows,
      "Penalties Allowed"
    );


  const totalPenalties =
    playerSum(
      rows,
      "Total Penalties Committed"
    );


  document
    .getElementById(
      "playerName"
    )
    .textContent =
    playerDisplay(
      first["NAME"]
    );


  document
    .getElementById(
      "position"
    )
    .textContent =
    playerDisplay(
      first["MAIN POSITION"]
    );


  document
    .getElementById(
      "hand"
    )
    .textContent =
    playerDisplay(
      first["HAND"]
    );


  document
    .getElementById(
      "games"
    )
    .textContent =
    playerDisplay(
      games
    );


  document
    .getElementById(
      "team"
    )
    .textContent =
    playerDisplay(
      first["TEAM"]
    );


  document
    .getElementById(
      "lastUpdated"
    )
    .textContent =
    latestUpdated(
      rows
    );


  document
    .getElementById(
      "yearsPlayed"
    )
    .textContent =
    playerDisplay(
      playerUnique(
        playerData
          .filter(
            row =>
              row["NAME"] ===
              first["NAME"]
          )
          .map(
            row =>
              row["YEAR"]
          )
      )
      .join(", ")
    );


  document
    .getElementById(
      "shots"
    )
    .textContent =
    playerDisplay(shots);


  document
    .getElementById(
      "goals"
    )
    .textContent =
    playerDisplay(goals);


  document
    .getElementById(
      "shootingPct"
    )
    .textContent =
    shots
      ? playerPct(
          goals /
          shots
        )
      : "-";


  document
    .getElementById(
      "goalPct"
    )
    .textContent =
    goalsAllowed
      ? playerPct(
          goals /
          goalsAllowed
        )
      : "-";


  document
    .getElementById(
      "goalsPerGame"
    )
    .textContent =
    games
      ? (
          goals /
          games
        ).toFixed(2)
      : "-";


  document
    .getElementById(
      "shotsPerGame"
    )
    .textContent =
    games
      ? (
          shots /
          games
        ).toFixed(2)
      : "-";


  document
    .getElementById(
      "blocks"
    )
    .textContent =
    playerDisplay(blocks);


  document
    .getElementById(
      "goalsAllowed"
    )
    .textContent =
    playerDisplay(
      goalsAllowed
    );


  document
    .getElementById(
      "blocksPerGame"
    )
    .textContent =
    games
      ? (
          blocks /
          games
        ).toFixed(2)
      : "-";


  document
    .getElementById(
      "blockPct"
    )
    .textContent =
    (
      blocks +
      goalsAllowed
    )
      ? playerPct(
          blocks /
          (
            blocks +
            goalsAllowed
          )
        )
      : "-";


  document
    .getElementById(
      "penScored"
    )
    .textContent =
    playerDisplay(
      penScored
    );


  document
    .getElementById(
      "penAllowed"
    )
    .textContent =
    playerDisplay(
      penAllowed
    );


  document
    .getElementById(
      "commonPenalty"
    )
    .textContent =
    mostCommonPenalty(
      rows
    );


  document
    .getElementById(
      "totalPenalties"
    )
    .textContent =
    playerDisplay(
      totalPenalties
    );


  document
    .getElementById(
      "summaryView"
    )
    .textContent =
    playerDisplay(
      viewSelect.options[
        viewSelect.selectedIndex
      ].text
    );


  document
    .getElementById(
      "summaryYear"
    )
    .textContent =
    viewSelect.value ===
      "CAREER"
      ? "-"
      : playerDisplay(
          yearSelect.value
        );


  document
    .getElementById(
      "summaryTournament"
    )
    .textContent =
    viewSelect.value ===
      "TOURNAMENT"
      ? playerDisplay(
          tournamentSelect.value
        )
      : "-";


  document
    .getElementById(
      "summaryRows"
    )
    .textContent =
    playerDisplay(
      rows.length
    );
}


[
  playerSelect,
  viewSelect,
  yearSelect,
  tournamentSelect
]
.forEach(
  element => {

    element.addEventListener(
      "change",
      renderPlayerProfile
    );

  }
);


fetch(
  PLAYER_DATA_URL
)

  .then(
    response =>
      response.json()
  )

  .then(
    rows => {

      playerData =
        rows.filter(
          row =>
            row["NAME"]
        );


      populatePlayerDropdowns();


      renderPlayerProfile();

    }
  )

  .catch(
    error => {

      console.error(error);


      document
        .getElementById(
          "loading"
        )
        .textContent =
        "Failed to load player profile data.";

    }
  );