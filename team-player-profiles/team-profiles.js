(function () {
  "use strict";


  const SPREADSHEET_ID =
    "1Cz6zVB4KxBRgE4MMtY5X8xWpHhGKb82gYXYYfqYIcYg";


  const SHEET_GID =
    "1477199";


  const DATA_URL =
    "https://docs.google.com/spreadsheets/d/" +
    SPREADSHEET_ID +
    "/gviz/tq?gid=" +
    SHEET_GID +
    "&headers=1&tqx=responseHandler:gcHandleTeamStats";


  const state = {
    teams: [],
    filteredTeams: []
  };


  const elements = {
    search:
      document.getElementById(
        "gc-search"
      ),

    division:
      document.getElementById(
        "gc-division"
      ),

    season:
      document.getElementById(
        "gc-season"
      ),

    sort:
      document.getElementById(
        "gc-sort"
      ),

    status:
      document.getElementById(
        "gc-status"
      ),

    content:
      document.getElementById(
        "gc-content"
      ),

    cards:
      document.getElementById(
        "gc-team-cards"
      ),

    tableBody:
      document.getElementById(
        "gc-table-body"
      ),

    totalTeams:
      document.getElementById(
        "gc-total-teams"
      ),

    totalGames:
      document.getElementById(
        "gc-total-games"
      ),

    totalGoals:
      document.getElementById(
        "gc-total-goals"
      ),

    totalEvents:
      document.getElementById(
        "gc-total-events"
      ),

    lastUpdated:
      document.getElementById(
        "gc-last-updated"
      )
  };


  function normalizeHeader(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );
  }


  function numberValue(value) {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    const parsed =
      Number(
        String(value ?? "")
          .replace(/,/g, "")
          .trim()
      );

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }


  function textValue(value) {
    return (
      value === null ||
      value === undefined
    )
      ? ""
      : String(value).trim();
  }


  function escapeHtml(value) {
    return textValue(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function formatNumber(
    value,
    decimals
  ) {
    return numberValue(value)
      .toLocaleString(
        undefined,
        {
          minimumFractionDigits:
            decimals,

          maximumFractionDigits:
            decimals
        }
      );
  }


  function formatDifferential(value) {
    const number =
      numberValue(value);

    if (number > 0) {
      return "+" + number;
    }

    return String(number);
  }


  function differentialClass(value) {
    const number =
      numberValue(value);

    if (number > 0) {
      return "team-positive";
    }

    if (number < 0) {
      return "team-negative";
    }

    return "";
  }


  function getDivisionLabel(division) {
    const normalized =
      textValue(division)
        .toUpperCase();

    if (normalized === "M") {
      return "Men";
    }

    if (normalized === "W") {
      return "Women";
    }

    return normalized || "Unspecified";
  }


  function getCellValue(cell) {
    if (!cell) {
      return "";
    }

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cell,
          "v"
        ) &&
      cell.v !== null
    ) {
      return cell.v;
    }

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          cell,
          "f"
        ) &&
      cell.f !== null
    ) {
      return cell.f;
    }

    return "";
  }


  function findValue(
    record,
    candidates
  ) {
    for (
      const candidate
      of candidates
    ) {
      const key =
        normalizeHeader(
          candidate
        );

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            record,
            key
          ) &&
        record[key] !== ""
      ) {
        return record[key];
      }
    }

    return "";
  }


  function transformResponse(
    response
  ) {
    if (
      !response ||
      response.status === "error"
    ) {
      const message =
        response &&
        response.errors &&
        response.errors[0] &&
        response.errors[0]
          .detailed_message
          ? response.errors[0]
              .detailed_message
          : "The Google Sheet could not be read.";

      throw new Error(message);
    }


    if (
      !response.table ||
      !Array.isArray(
        response.table.cols
      ) ||
      !Array.isArray(
        response.table.rows
      )
    ) {
      throw new Error(
        "The spreadsheet returned an unexpected format."
      );
    }


    const headers =
      response.table.cols.map(
        function (
          column,
          index
        ) {
          const label =
            column &&
            column.label
              ? column.label
              : "column" + index;

          return normalizeHeader(
            label
          );
        }
      );


    return response.table.rows

      .map(
        function (row) {

          const record = {};


          headers.forEach(
            function (
              header,
              index
            ) {
              record[header] =
                getCellValue(
                  row &&
                  Array.isArray(
                    row.c
                  )
                    ? row.c[index]
                    : null
                );
            }
          );


          const season =
            textValue(
              findValue(
                record,
                ["Season"]
              )
            );


          const team =
            textValue(
              findValue(
                record,
                ["Team"]
              )
            );


          const division =
            textValue(
              findValue(
                record,
                [
                  "Men/Women",
                  "Men Women",
                  "Division"
                ]
              )
            )
            .toUpperCase();


          const gp =
            numberValue(
              findValue(
                record,
                [
                  "GP",
                  "Games Played"
                ]
              )
            );


          const wins =
            numberValue(
              findValue(
                record,
                [
                  "W",
                  "Wins"
                ]
              )
            );


          const losses =
            numberValue(
              findValue(
                record,
                [
                  "L",
                  "Losses"
                ]
              )
            );


          const ties =
            numberValue(
              findValue(
                record,
                [
                  "T",
                  "Ties"
                ]
              )
            );


          const gf =
            numberValue(
              findValue(
                record,
                [
                  "GF",
                  "Goals For"
                ]
              )
            );


          const ga =
            numberValue(
              findValue(
                record,
                [
                  "GA",
                  "Goals Against"
                ]
              )
            );


          const gd =
            numberValue(
              findValue(
                record,
                [
                  "GD",
                  "Goal Differential"
                ]
              )
            );


          const appearances =
            numberValue(
              findValue(
                record,
                [
                  "Tournament Appearances",
                  "Appearances",
                  "Events"
                ]
              )
            );


          return {
            season,
            team,
            division,
            gp,
            wins,
            losses,
            ties,
            gf,
            ga,
            gd,

            gpg:
              gp > 0
                ? gf / gp
                : 0,

            gapg:
              gp > 0
                ? ga / gp
                : 0,

            winPct:
              gp > 0
                ? wins / gp
                : 0,

            largestWin:
              textValue(
                findValue(
                  record,
                  ["Largest Win"]
                )
              ),

            largestLoss:
              textValue(
                findValue(
                  record,
                  ["Largest Loss"]
                )
              ),

            appearances,

            lastTournament:
              textValue(
                findValue(
                  record,
                  ["Last Tournament"]
                )
              ),

            lastUpdated:
              textValue(
                findValue(
                  record,
                  ["Last Updated"]
                )
              )
          };
        }
      )

      .filter(
        function (team) {
          return team.team !== "";
        }
      );
  }


  function populateSeasonFilter() {
    const seasons =
      Array.from(
        new Set(
          state.teams
            .map(
              function (team) {
                return team.season;
              }
            )
            .filter(Boolean)
        )
      )
      .sort(
        function (a, b) {
          return String(b)
            .localeCompare(
              String(a),
              undefined,
              {
                numeric: true
              }
            );
        }
      );


    elements.season.innerHTML =
      '<option value="ALL">All seasons</option>' +

      seasons
        .map(
          function (season) {
            return (
              '<option value="' +
              escapeHtml(season) +
              '">' +
              escapeHtml(season) +
              "</option>"
            );
          }
        )
        .join("");


    if (seasons.length > 0) {
      elements.season.value =
        seasons[0];
    }
  }


  function sortTeams(
    teams,
    sortValue
  ) {
    const sorted =
      teams.slice();


    const sortFunctions = {

      "team-asc":
        function (a, b) {
          return a.team
            .localeCompare(
              b.team
            );
        },

      "gp-desc":
        function (a, b) {
          return (
            b.gp -
            a.gp ||
            a.team.localeCompare(
              b.team
            )
          );
        },

      "wins-desc":
        function (a, b) {
          return (
            b.wins -
            a.wins ||
            a.team.localeCompare(
              b.team
            )
          );
        },

      "winPct-desc":
        function (a, b) {
          return (
            b.winPct -
            a.winPct ||
            b.wins -
            a.wins ||
            a.team.localeCompare(
              b.team
            )
          );
        },

      "gf-desc":
        function (a, b) {
          return (
            b.gf -
            a.gf ||
            a.team.localeCompare(
              b.team
            )
          );
        },

      "ga-asc":
        function (a, b) {
          return (
            a.ga -
            b.ga ||
            a.team.localeCompare(
              b.team
            )
          );
        },

      "gd-desc":
        function (a, b) {
          return (
            b.gd -
            a.gd ||
            a.team.localeCompare(
              b.team
            )
          );
        },

      "gpg-desc":
        function (a, b) {
          return (
            b.gpg -
            a.gpg ||
            a.team.localeCompare(
              b.team
            )
          );
        },

      "gapg-asc":
        function (a, b) {
          return (
            a.gapg -
            b.gapg ||
            a.team.localeCompare(
              b.team
            )
          );
        },

      "appearances-desc":
        function (a, b) {
          return (
            b.appearances -
            a.appearances ||
            a.team.localeCompare(
              b.team
            )
          );
        }
    };


    sorted.sort(
      sortFunctions[sortValue] ||
      sortFunctions["team-asc"]
    );


    return sorted;
  }


  function applyFilters() {
    const searchTerm =
      elements.search.value
        .trim()
        .toLowerCase();


    const selectedDivision =
      elements.division.value;


    const selectedSeason =
      elements.season.value;


    const filtered =
      state.teams.filter(
        function (team) {

          const matchesSearch =
            !searchTerm ||
            team.team
              .toLowerCase()
              .includes(
                searchTerm
              ) ||
            team.lastTournament
              .toLowerCase()
              .includes(
                searchTerm
              );


          const matchesDivision =
            selectedDivision ===
              "ALL" ||
            team.division ===
              selectedDivision;


          const matchesSeason =
            selectedSeason ===
              "ALL" ||
            team.season ===
              selectedSeason;


          return (
            matchesSearch &&
            matchesDivision &&
            matchesSeason
          );
        }
      );


    state.filteredTeams =
      sortTeams(
        filtered,
        elements.sort.value
      );


    render();
  }


  function renderSummary() {
    const teams =
      state.filteredTeams;


    const totalGames =
      teams.reduce(
        function (
          sum,
          team
        ) {
          return sum + team.gp;
        },
        0
      );


    const totalGoals =
      teams.reduce(
        function (
          sum,
          team
        ) {
          return sum + team.gf;
        },
        0
      );


    const totalEvents =
      teams.reduce(
        function (
          sum,
          team
        ) {
          return (
            sum +
            team.appearances
          );
        },
        0
      );


    elements.totalTeams.textContent =
      teams.length
        .toLocaleString();


    elements.totalGames.textContent =
      totalGames
        .toLocaleString();


    elements.totalGoals.textContent =
      totalGoals
        .toLocaleString();


    elements.totalEvents.textContent =
      totalEvents
        .toLocaleString();
  }


  function renderCards() {
    if (
      state.filteredTeams.length ===
      0
    ) {
      elements.cards.innerHTML =
        `
          <div class="profiles-status">
            No teams match the selected filters.
          </div>
        `;

      return;
    }


    elements.cards.innerHTML =
      state.filteredTeams

        .map(
          function (team) {

            const gdClass =
              differentialClass(
                team.gd
              );


            return `
              <article class="team-profile-card">

                <div class="team-profile-card-header">

                  <h4 class="team-profile-name">
                    ${escapeHtml(team.team)}
                  </h4>

                  <div class="team-profile-meta">

                    ${escapeHtml(
                      getDivisionLabel(
                        team.division
                      )
                    )}

                    ${
                      team.season
                        ? " • " +
                          escapeHtml(
                            team.season
                          ) +
                          " Season"
                        : ""
                    }

                  </div>


                  <div class="team-profile-record">
                    ${team.wins}-${team.losses}-${team.ties}
                  </div>

                </div>


                <div class="team-profile-stat-grid">

                  <div class="team-profile-stat">

                    <strong>
                      ${team.gp}
                    </strong>

                    <span>
                      GP
                    </span>

                  </div>


                  <div class="team-profile-stat">

                    <strong>
                      ${team.gf}
                    </strong>

                    <span>
                      GF
                    </span>

                  </div>


                  <div class="team-profile-stat">

                    <strong>
                      ${team.ga}
                    </strong>

                    <span>
                      GA
                    </span>

                  </div>


                  <div class="team-profile-stat">

                    <strong class="${gdClass}">
                      ${formatDifferential(team.gd)}
                    </strong>

                    <span>
                      GD
                    </span>

                  </div>


                  <div class="team-profile-stat">

                    <strong>
                      ${formatNumber(team.gpg, 2)}
                    </strong>

                    <span>
                      GF/GP
                    </span>

                  </div>


                  <div class="team-profile-stat">

                    <strong>
                      ${formatNumber(team.gapg, 2)}
                    </strong>

                    <span>
                      GA/GP
                    </span>

                  </div>


                  <div class="team-profile-stat">

                    <strong>
                      ${formatNumber(
                        team.winPct * 100,
                        1
                      )}%
                    </strong>

                    <span>
                      Win %
                    </span>

                  </div>


                  <div class="team-profile-stat">

                    <strong>
                      ${team.appearances}
                    </strong>

                    <span>
                      Events
                    </span>

                  </div>

                </div>


                <div class="team-profile-details">

                  <div class="team-profile-detail">

                    <span>
                      Largest Win
                    </span>

                    <strong>
                      ${escapeHtml(
                        team.largestWin ||
                        "None recorded"
                      )}
                    </strong>

                  </div>


                  <div class="team-profile-detail">

                    <span>
                      Largest Loss
                    </span>

                    <strong>
                      ${escapeHtml(
                        team.largestLoss ||
                        "None recorded"
                      )}
                    </strong>

                  </div>


                  <div class="team-profile-detail">

                    <span>
                      Last Tournament
                    </span>

                    <strong>
                      ${escapeHtml(
                        team.lastTournament ||
                        "Not available"
                      )}
                    </strong>

                  </div>

                </div>

              </article>
            `;
          }
        )

        .join("");
  }


  function renderTable() {
    elements.tableBody.innerHTML =
      state.filteredTeams

        .map(
          function (team) {

            const gdClass =
              differentialClass(
                team.gd
              );


            return `

              <tr>

                <td>
                  <strong>
                    ${escapeHtml(team.team)}
                  </strong>
                </td>

                <td>
                  ${escapeHtml(
                    getDivisionLabel(
                      team.division
                    )
                  )}
                </td>

                <td>
                  ${escapeHtml(team.season)}
                </td>

                <td>
                  ${team.wins}-${team.losses}-${team.ties}
                </td>

                <td>${team.gp}</td>
                <td>${team.wins}</td>
                <td>${team.losses}</td>
                <td>${team.ties}</td>
                <td>${team.gf}</td>
                <td>${team.ga}</td>

                <td class="${gdClass}">
                  ${formatDifferential(team.gd)}
                </td>

                <td>
                  ${formatNumber(team.gpg, 2)}
                </td>

                <td>
                  ${formatNumber(team.gapg, 2)}
                </td>

                <td>
                  ${team.appearances}
                </td>

                <td>
                  ${escapeHtml(
                    team.lastTournament ||
                    "—"
                  )}
                </td>

              </tr>

            `;
          }
        )

        .join("");
  }


  function renderLastUpdated() {
    const timestamps =
      state.teams
        .map(
          function (team) {
            return team.lastUpdated;
          }
        )
        .filter(Boolean);


    const latestText =
      timestamps.length
        ? timestamps[0]
        : "";


    elements.lastUpdated.textContent =
      latestText
        ? "Statistics last updated: " +
          latestText
        : "Statistics are loaded directly from Google Sheets.";
  }


  function render() {
    renderSummary();
    renderCards();
    renderTable();

    elements.status.hidden =
      true;

    elements.content.hidden =
      false;
  }


  function showError(error) {
    console.error(error);

    elements.content.hidden =
      true;

    elements.status.hidden =
      false;

    elements.status.classList.add(
      "profiles-error"
    );

    elements.status.innerHTML =
      "<strong>Team statistics could not be loaded.</strong><br>" +
      escapeHtml(
        error.message ||
        "Unknown error"
      );
  }


  window.gcHandleTeamStats =
    function (response) {

      try {

        state.teams =
          transformResponse(
            response
          );


        if (
          state.teams.length ===
          0
        ) {
          throw new Error(
            "No team rows were found."
          );
        }


        populateSeasonFilter();
        renderLastUpdated();
        applyFilters();

      } catch (error) {

        showError(error);

      }

    };


  elements.search
    .addEventListener(
      "input",
      applyFilters
    );


  elements.division
    .addEventListener(
      "change",
      applyFilters
    );


  elements.season
    .addEventListener(
      "change",
      applyFilters
    );


  elements.sort
    .addEventListener(
      "change",
      applyFilters
    );


  const script =
    document.createElement(
      "script"
    );


  script.src =
    DATA_URL;


  script.async =
    true;


  script.onerror =
    function () {

      showError(
        new Error(
          "The browser could not connect to the published Google Sheet."
        )
      );

    };


  document.body
    .appendChild(
      script
    );

})();