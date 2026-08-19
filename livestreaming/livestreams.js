/* =========================================================
   GOALBALL CENTRAL
   LIVESTREAM PAGE
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

const LIVESTREAM_CONFIG = {

  dataUrl:
    "https://script.google.com/macros/s/AKfycbydCRMOtEddewEYDGjMzq63NM35MJnJvAQz1p4-CAmm10pCUrh_qwhdzK6FdTYfUzX2/exec"

};



let allLivestreams =
  [];


/* =========================================================
   HELPERS
   ========================================================= */

function streamNormalize(value) {

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



function streamEscapeHtml(value) {

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
   BUILD TOURNAMENT LIST
   ========================================================= */

function getLivestreamTournaments(streams, scheduleRows) {

  const tournaments = new Map();


  /*
     First create the tournament list
     from tournaments that actually
     have livestreams.
  */

  streams.forEach(stream => {

    const year =
      streamNormalize(stream["Year"]);

    const location =
      streamNormalize(stream["Location"]);

    if (!year || !location) {
      return;
    }

    const key =
      `${year}|||${location}`;

    if (!tournaments.has(key)) {

      tournaments.set(key, {
        key,
        year,
        location,
        latestDate: new Date(0)
      });

    }

  });


  /*
     Now use Schedules/Results to find
     the actual latest game date for
     each tournament.
  */

  scheduleRows.forEach(row => {

    const year =
      streamNormalize(row["Year"]);

    const location =
      streamNormalize(row["Location"]);

    const key =
      `${year}|||${location}`;

    /*
       Ignore tournaments that don't
       have livestreams.
    */

    if (!tournaments.has(key)) {
      return;
    }


    const dateValue =
      row["GameDate"] ||
      row["Date"] ||
      "";

    if (!dateValue) {
      return;
    }


    const parsed =
      new Date(dateValue);

    if (isNaN(parsed.getTime())) {
      return;
    }


    const tournament =
      tournaments.get(key);


    if (parsed > tournament.latestDate) {

      tournament.latestDate =
        parsed;

    }

  });


  /*
     Sort newest tournament first.
  */

  return Array
    .from(tournaments.values())
    .sort((a, b) => {

      const dateDiff =
        b.latestDate -
        a.latestDate;

      if (dateDiff !== 0) {
        return dateDiff;
      }


      /*
         Fallback if schedule date
         could not be found.
      */

      const yearDiff =
        Number(b.year) -
        Number(a.year);

      if (yearDiff !== 0) {
        return yearDiff;
      }


      return a.location.localeCompare(
        b.location
      );

    });

}


/* =========================================================
   BUILD SELECTOR
   ========================================================= */

function buildTournamentSelector(
  tournaments
) {

  const select =
    document.getElementById(
      "streamTournamentSelect"
    );


  if (!select) {

    return;

  }


  if (
    !tournaments.length
  ) {

    select.innerHTML =
      `
        <option value="">
          No tournaments available
        </option>
      `;


    return;

  }


  select.innerHTML =
    tournaments

      .map(
        tournament => `

          <option
            value="${streamEscapeHtml(tournament.key)}"
          >

            ${streamEscapeHtml(tournament.year)}
            ${streamEscapeHtml(tournament.location)}

          </option>

        `
      )

      .join("");


  select.addEventListener(
    "change",
    () => {

      renderSelectedTournament(
        select.value
      );

    }
  );


  /* automatically show newest tournament */

  select.value =
    tournaments[0].key;


  renderSelectedTournament(
    tournaments[0].key
  );

}



/* =========================================================
   SORT DAYS
   ========================================================= */

function sortDays(
  a,
  b
) {

  const numberA =
    Number(a);


  const numberB =
    Number(b);


  if (
    !isNaN(numberA) &&
    !isNaN(numberB)
  ) {

    return (
      numberA -
      numberB
    );

  }


  return String(a)
    .localeCompare(
      String(b),
      undefined,
      {
        numeric: true
      }
    );

}



/* =========================================================
   DAY LABEL
   ========================================================= */

function getDayLabel(
  day
) {

  const cleanDay =
    streamNormalize(
      day
    );


  if (!cleanDay) {

    return "Tournament";

  }


  /* If sheet already says Friday/Saturday/etc */

  if (
    isNaN(
      Number(
        cleanDay
      )
    )
  ) {

    return cleanDay;

  }


  return `Day ${cleanDay}`;

}



/* =========================================================
   STREAM STATUS
   ========================================================= */

function getStreamStatusClass(
  status
) {

  const clean =
    streamNormalize(
      status
    )
    .toLowerCase();


  if (
    clean === "live"
  ) {

    return "live";

  }


  if (
    clean.includes(
      "upcoming"
    ) ||
    clean.includes(
      "scheduled"
    )
  ) {

    return "upcoming";

  }


  if (
    clean.includes(
      "complete"
    ) ||
    clean.includes(
      "ended"
    ) ||
    clean.includes(
      "final"
    )
  ) {

    return "complete";

  }


  return "";

}



/* =========================================================
   RENDER TOURNAMENT
   ========================================================= */

function renderSelectedTournament(
  tournamentKey
) {

  const root =
    document.getElementById(
      "streamsRoot"
    );


  const title =
    document.getElementById(
      "streamTournamentTitle"
    );


  const subtitle =
    document.getElementById(
      "streamTournamentSubtitle"
    );


  if (
    !root ||
    !title ||
    !subtitle
  ) {

    return;

  }


  const parts =
    tournamentKey.split(
      "|||"
    );


  const year =
    parts[0] || "";


  const location =
    parts[1] || "";


  title.textContent =
    `${year} ${location}`;


  const filtered =
    allLivestreams.filter(
      stream =>

        streamNormalize(
          stream["Year"]
        ) ===
        year

        &&

        streamNormalize(
          stream["Location"]
        ) ===
        location

    );


  if (
    !filtered.length
  ) {

    subtitle.textContent =
      "No livestreams available";


    root.innerHTML =
      `
        <div class="stream-empty">
          No livestreams found for this tournament.
        </div>
      `;


    return;

  }


  subtitle.textContent =
    `${filtered.length} stream${
      filtered.length === 1
        ? ""
        : "s"
    } available`;


  const grouped =
    {};


  filtered.forEach(
    stream => {

      const day =
        streamNormalize(
          stream["Day"]
        ) ||
        "Tournament";


      const gym =
        streamNormalize(
          stream["Gym"]
        ) ||
        "TBD";


      if (
        !grouped[day]
      ) {

        grouped[day] =
          {};

      }


      if (
        !grouped[day][gym]
      ) {

        grouped[day][gym] =
          [];

      }


      grouped[day][gym]
        .push(
          stream
        );

    }
  );


  const days =
    Object
      .keys(
        grouped
      )
      .sort(
        sortDays
      );


  let html =
    "";


  days.forEach(
    day => {

      html += `

        <section class="stream-day">

          <div class="stream-day-header">

            <h3>
              ${streamEscapeHtml(getDayLabel(day))}
            </h3>

          </div>


          <div class="stream-gym-grid">

      `;


      const gyms =
        Object
          .keys(
            grouped[day]
          )

          .sort(
            (
              a,
              b
            ) =>
              String(a)
                .localeCompare(
                  String(b),
                  undefined,
                  {
                    numeric: true
                  }
                )
          );


      gyms.forEach(
        gym => {

          html += `

            <article class="stream-gym-card">

              <div class="stream-gym-title">

                ${streamEscapeHtml(
                  gym.toLowerCase().startsWith("gym")
                    ? gym
                    : `Gym ${gym}`
                )}

              </div>


              <div class="stream-links">

          `;


          grouped[day][gym]
            .forEach(
              stream => {

                const url =
                  streamNormalize(
                    stream["YouTube URL"]
                  );


                if (!url) {

                  return;

                }


                const part =
                  streamNormalize(
                    stream["Stream Part"]
                  ) ||
                  "Watch Stream";


                const status =
                  streamNormalize(
                    stream["Status"]
                  );


                const statusClass =
                  getStreamStatusClass(
                    status
                  );


                html += `

                  <div class="stream-item">

                    <a
                      class="stream-watch-button"
                      href="${streamEscapeHtml(url)}"
                      target="_blank"
                      rel="noopener"
                    >

                      ▶ ${streamEscapeHtml(part)}

                    </a>

                `;


                if (status) {

                  html += `

                    <span
                      class="stream-status ${streamEscapeHtml(statusClass)}"
                    >

                      ${streamEscapeHtml(status)}

                    </span>

                  `;

                }


                html += `

                  </div>

                `;

              }
            );


          html += `

              </div>

            </article>

          `;

        }
      );


      html += `

          </div>

        </section>

      `;

    }
  );


  root.innerHTML =
    html;

}



/* =========================================================
   LOAD STREAMS
   ========================================================= */

function loadLivestreams() {

  fetch(
    LIVESTREAM_CONFIG.dataUrl
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

    allLivestreams =
      data.livestreams || [];

    const scheduleRows =
      data.results || [];

    const tournaments =
      getLivestreamTournaments(
        allLivestreams,
        scheduleRows
      );

    buildTournamentSelector(
      tournaments
    );

      }
    )


    .catch(
      error => {

        console.error(
          "Livestream page error:",
          error
        );


        document
          .getElementById(
            "streamTournamentTitle"
          )
          .textContent =
          "Unable to load livestreams";


        document
          .getElementById(
            "streamTournamentSubtitle"
          )
          .textContent =
          "Please try again shortly";


        document
          .getElementById(
            "streamsRoot"
          )
          .innerHTML =
          `
            <div class="stream-empty">
              Failed to load livestream information.
            </div>
          `;

      }
    );

}



/* =========================================================
   START
   ========================================================= */

loadLivestreams();