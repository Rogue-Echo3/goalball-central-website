/* =========================================================
   GOALBALL CENTRAL
   SEARCHABLE RULEBOOK
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
   STATE
   ========================================================= */

const rulesState = {
  parts: [],
  currentPartIndex: 0,
  currentSectionIndex: 0,
  searchTerm: ""
};


/* =========================================================
   ELEMENTS
   ========================================================= */

const rulesSearch =
  document.getElementById("rulesSearch");

const rulesPartTabs =
  document.getElementById("rulesPartTabs");

const rulesSectionTabs =
  document.getElementById("rulesSectionTabs");

const rulesStatus =
  document.getElementById("rulesStatus");

const rulesRoot =
  document.getElementById("rulesRoot");


/* =========================================================
   HELPERS
   ========================================================= */

function rulesEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function normalizeRulesText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function slugifyRules(value) {
  return normalizeRulesText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


/* =========================================================
   PARSE RULES.MD
   ========================================================= */

function parseRulesMarkdown(markdown) {

  const lines =
    String(markdown || "")
      .replace(/\r\n/g, "\n")
      .split("\n");


  const parts = [];

  let currentPart = null;
  let currentSection = null;
  let currentRule = null;


  function saveCurrentRule() {

    if (
      currentRule &&
      currentSection
    ) {

      currentRule.body =
        currentRule.body
          .join("\n")
          .trim();

      currentSection.rules.push(
        currentRule
      );

      currentRule = null;
    }

  }


  lines.forEach(rawLine => {

    const line =
      rawLine.trim();


    if (!line) {

      if (currentRule) {
        currentRule.body.push("");
      }

      return;
    }


    /* =====================================================
       PART HEADINGS

       # PART A - GOALBALL RULES
       # PART B - TOURNAMENT REGULATIONS
       ===================================================== */

    if (
      /^#\s+PART\s+[AB]\b/i.test(line)
    ) {

      saveCurrentRule();

      currentPart = {
        title:
          normalizeRulesText(
            line.replace(/^#\s+/, "")
          ),

        sections: []
      };

      parts.push(
        currentPart
      );

      currentSection = null;

      return;
    }


    /* =====================================================
       SECTION HEADINGS

       ## SECTION A - PREPARATION FOR THE GAME
       ===================================================== */

    if (
      /^##\s+SECTION\s+[A-H]\b/i.test(line)
    ) {

      saveCurrentRule();


      if (!currentPart) {

        currentPart = {
          title: "GOALBALL RULES",
          sections: []
        };

        parts.push(
          currentPart
        );
      }


      currentSection = {
        title:
          normalizeRulesText(
            line.replace(/^##\s+/, "")
          ),

        rules: []
      };


      currentPart.sections.push(
        currentSection
      );

      return;
    }


    /* =====================================================
       APPENDIX HEADINGS

       If the markdown contains appendices, treat each
       appendix as its own section.
       ===================================================== */

    if (
      /^#\s+APPENDIX\s+/i.test(line)
    ) {

      saveCurrentRule();


      if (!currentPart) {

        currentPart = {
          title: "APPENDICES",
          sections: []
        };

        parts.push(
          currentPart
        );
      }


      currentSection = {
        title:
          normalizeRulesText(
            line.replace(/^#\s+/, "")
          ),

        rules: []
      };


      currentPart.sections.push(
        currentSection
      );

      return;
    }


    /* =====================================================
       MAIN RULE HEADINGS

       ### 1 Court
       ### 13 Game Protocol
       ### 31 Unsportsmanlike Conduct
       ===================================================== */

    if (
      /^###\s+\d+\s+/.test(line)
    ) {

      saveCurrentRule();


      if (!currentPart) {

        currentPart = {
          title: "GOALBALL RULES",
          sections: []
        };

        parts.push(
          currentPart
        );
      }


      if (!currentSection) {

        currentSection = {
          title: "RULES",
          rules: []
        };

        currentPart.sections.push(
          currentSection
        );
      }


      const heading =
        normalizeRulesText(
          line.replace(/^###\s+/, "")
        );


      const match =
        heading.match(
          /^(\d+)\s+(.+)$/
        );


      currentRule = {

        number:
          match
            ? match[1]
            : "",

        title:
          match
            ? match[2]
            : heading,

        heading,

        body: []

      };

      return;
    }


    /* =====================================================
       SUBHEADINGS INSIDE RULES

       #### 43.1 Bid Evaluation
       ##### 43.1.1 etc.

       Keep these as readable text inside the rule.
       ===================================================== */

    if (
      /^#{4,6}\s+/.test(line)
    ) {

      if (currentRule) {

        const subheading =
          normalizeRulesText(
            line.replace(/^#{4,6}\s+/, "")
          );

        currentRule.body.push(
          `SUBHEADING:${subheading}`
        );

      }

      return;
    }


    /* =====================================================
       NORMAL RULE TEXT
       ===================================================== */

    if (currentRule) {

      currentRule.body.push(
        line
      );

    }

  });


  saveCurrentRule();


  /* =======================================================
     REMOVE EMPTY SECTIONS AND PARTS
     ======================================================= */

  return parts
    .map(part => ({

      ...part,

      sections:
        part.sections.filter(
          section =>
            section.rules.length > 0
        )

    }))

    .filter(
      part =>
        part.sections.length > 0
    );

}


/* =========================================================
   FORMAT RULE BODY
   ========================================================= */

function formatRuleBody(body) {

  const lines =
    String(body || "")
      .split("\n");


  let html = "";


  lines.forEach(line => {

    const clean =
      line.trim();


    if (!clean) {
      return;
    }


    /* Subheading */

    if (
      clean.startsWith(
        "SUBHEADING:"
      )
    ) {

      const heading =
        clean.replace(
          "SUBHEADING:",
          ""
        );

      html += `
        <h4 class="rule-subheading">
          ${rulesEscapeHtml(heading)}
        </h4>
      `;

      return;
    }


    /* Markdown bullet */

    if (
      clean.startsWith("- ")
    ) {

      html += `
        <div class="rule-bullet">
          • ${rulesEscapeHtml(
            clean.substring(2)
          )}
        </div>
      `;

      return;
    }


    /* Regular rule text */

    html += `
      <p>
        ${rulesEscapeHtml(clean)}
      </p>
    `;

  });


  return html;
}


/* =========================================================
   PART TABS
   ========================================================= */

function renderPartTabs() {

  rulesPartTabs.innerHTML =
    rulesState.parts
      .map(
        (part, index) => `

          <button
            type="button"
            class="rules-part-tab ${
              index ===
              rulesState.currentPartIndex
                ? "active"
                : ""
            }"
            data-part-index="${index}"
          >

            ${rulesEscapeHtml(
              part.title
            )}

          </button>

        `
      )
      .join("");


  rulesPartTabs
    .querySelectorAll(
      ".rules-part-tab"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          rulesState.currentPartIndex =
            Number(
              button.dataset.partIndex
            );

          rulesState.currentSectionIndex =
            0;

          rulesState.searchTerm =
            "";

          rulesSearch.value =
            "";

          renderRulesInterface();

        }
      );

    });

}


/* =========================================================
   SECTION TABS
   ========================================================= */

function renderSectionTabs() {

  const part =
    rulesState.parts[
      rulesState.currentPartIndex
    ];


  if (!part) {

    rulesSectionTabs.innerHTML =
      "";

    return;

  }


  rulesSectionTabs.innerHTML =
    part.sections
      .map(
        (section, index) => `

          <button
            type="button"
            class="rules-section-tab ${
              index ===
              rulesState.currentSectionIndex
                ? "active"
                : ""
            }"
            data-section-index="${index}"
          >

            ${rulesEscapeHtml(
              section.title
            )}

          </button>

        `
      )
      .join("");


  rulesSectionTabs
    .querySelectorAll(
      ".rules-section-tab"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          rulesState.currentSectionIndex =
            Number(
              button.dataset.sectionIndex
            );

          renderRules();

        }
      );

    });

}


/* =========================================================
   RULE CARD
   ========================================================= */

function makeRuleCard(
  rule,
  sectionTitle
) {

  return `

    <article
      class="rule-card"
      id="rule-${rulesEscapeHtml(
        rule.number
      )}-${slugifyRules(
        rule.title
      )}"
    >

      <div class="rule-card-header">

        <div class="rule-number">

          RULE
          ${rulesEscapeHtml(
            rule.number
          )}

        </div>


        <h3>

          ${rulesEscapeHtml(
            rule.title
          )}

        </h3>


        <div class="rule-section-name">

          ${rulesEscapeHtml(
            sectionTitle
          )}

        </div>

      </div>


      <div class="rule-card-body">

        ${formatRuleBody(
          rule.body
        )}

      </div>

    </article>

  `;

}


/* =========================================================
   SEARCH
   ========================================================= */

function getSearchResults(term) {

  const query =
    normalizeRulesText(term)
      .toLowerCase();


  if (!query) {
    return [];
  }


  const results = [];


  rulesState.parts.forEach(
    (part, partIndex) => {

      part.sections.forEach(
        (section, sectionIndex) => {

          section.rules.forEach(
            rule => {

              const haystack =
                [
                  part.title,
                  section.title,
                  rule.number,
                  rule.title,
                  rule.body
                ]

                .join(" ")

                .toLowerCase();


              if (
                haystack.includes(
                  query
                )
              ) {

                results.push({

                  partIndex,

                  sectionIndex,

                  partTitle:
                    part.title,

                  sectionTitle:
                    section.title,

                  rule

                });

              }

            }
          );

        }
      );

    }
  );


  return results;
}


/* =========================================================
   RENDER RULES
   ========================================================= */

function renderRules() {

  rulesRoot.hidden =
    false;

  rulesStatus.hidden =
    true;


  /* =======================================================
     SEARCH RESULTS
     ======================================================= */

  if (
    rulesState.searchTerm
      .trim() !== ""
  ) {

    const matches =
      getSearchResults(
        rulesState.searchTerm
      );


    rulesSectionTabs.style.display =
      "none";


    if (!matches.length) {

      rulesRoot.innerHTML =
        `

          <div class="rules-empty">

            No rules matched
            "${rulesEscapeHtml(
              rulesState.searchTerm
            )}".

          </div>

        `;

      return;

    }


    rulesRoot.innerHTML =
      `

        <div class="rules-search-summary">

          ${matches.length}

          matching rule${
            matches.length === 1
              ? ""
              : "s"
          }

        </div>


        <div class="rules-card-list">

          ${matches
            .map(
              match =>
                makeRuleCard(
                  match.rule,
                  match.sectionTitle
                )
            )
            .join("")}

        </div>

      `;


    return;

  }


  rulesSectionTabs.style.display =
    "";


  /* =======================================================
     NORMAL SECTION VIEW
     ======================================================= */

  const part =
    rulesState.parts[
      rulesState.currentPartIndex
    ];


  if (!part) {

    rulesRoot.innerHTML =
      `

        <div class="rules-empty">
          No rule sections available.
        </div>

      `;

    return;

  }


  const section =
    part.sections[
      rulesState.currentSectionIndex
    ];


  if (!section) {

    rulesRoot.innerHTML =
      `

        <div class="rules-empty">
          No rules available in this section.
        </div>

      `;

    return;

  }


  rulesRoot.innerHTML =
    `

      <div class="rules-section-heading">

        <span>

          ${rulesEscapeHtml(
            part.title
          )}

        </span>


        <h2>

          ${rulesEscapeHtml(
            section.title
          )}

        </h2>


        <p>

          ${section.rules.length}

          rule${
            section.rules.length === 1
              ? ""
              : "s"
          }

        </p>

      </div>


      <div class="rules-card-list">

        ${section.rules
          .map(
            rule =>
              makeRuleCard(
                rule,
                section.title
              )
          )
          .join("")}

      </div>

    `;

}


/* =========================================================
   FULL INTERFACE
   ========================================================= */

function renderRulesInterface() {

  renderPartTabs();

  renderSectionTabs();

  renderRules();

}


/* =========================================================
   SEARCH EVENT
   ========================================================= */

rulesSearch.addEventListener(
  "input",
  () => {

    rulesState.searchTerm =
      rulesSearch.value;

    renderRules();

  }
);


/* =========================================================
   LOAD RULES.MD
   ========================================================= */

fetch("./rules.md", {
  cache: "no-store"
})

  .then(response => {

    if (!response.ok) {

      throw new Error(
        `Unable to load rules.md — HTTP ${response.status}`
      );

    }

    return response.text();

  })


  .then(markdown => {

    rulesState.parts =
      parseRulesMarkdown(
        markdown
      );


    console.log(
      "Goalball Rules loaded:",
      rulesState.parts
    );


    if (
      !rulesState.parts.length
    ) {

      throw new Error(
        "rules.md loaded, but no rule sections were detected."
      );

    }


    renderRulesInterface();

  })


  .catch(error => {

    console.error(
      "Rules page error:",
      error
    );


    rulesStatus.hidden =
      false;


    rulesRoot.hidden =
      true;


    rulesStatus.innerHTML =
      `

        <strong>
          Goalball rules could not be loaded.
        </strong>

        <br><br>

        ${rulesEscapeHtml(
          error.message
        )}

        <br><br>

        Confirm that
        <code>goalball-rules/rules.md</code>
        exists.

      `;

  });