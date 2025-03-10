/**
 * Navigation Module - Handles UI navigation between dashboard pages
 */

// Initialize navigation when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  setupNavigation();
});

/**
 * Set up navigation between dashboard pages
 */
function setupNavigation() {
  const navLinks = document.querySelectorAll(".sidebar nav a");

  if (!navLinks.length) {
    console.error("Navigation links not found");
    return;
  }

  // Set up click handlers for navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Update active nav link
      navLinks.forEach((el) => {
        el.classList.remove("active");
      });
      this.classList.add("active");

      // Show selected page
      const pageId = this.getAttribute("data-page");
      navigateToPage(pageId);

      // Update URL hash
      window.location.hash = pageId;

      // Track page view (for analytics in a real app)
      trackPageView(pageId);
    });
  });

  // Check for hash in URL on page load
  checkUrlHash();

  // Add history change handler
  window.addEventListener("hashchange", checkUrlHash);
}

/**
 * Navigate to specific page
 * @param {String} pageId - ID of the page to show
 */
function navigateToPage(pageId) {
  if (!pageId) return;

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");

    // Trigger page-specific updates
    triggerPageUpdates(pageId);
  }
}

/**
 * Check URL hash and navigate to corresponding page
 */
function checkUrlHash() {
  const hash = window.location.hash.substring(1);

  if (hash) {
    // Navigate to the page specified in the hash
    document.querySelectorAll(".sidebar nav a").forEach((link) => {
      if (link.getAttribute("data-page") === hash) {
        link.click();
      }
    });
  }
}

/**
 * Trigger page-specific data updates
 * @param {String} pageId - ID of the active page
 */
function triggerPageUpdates(pageId) {
  // Only update data specific to the current page to improve performance

  switch (pageId) {
    case "overview":
      // Update overview data
      if (window.dashboard) {
        window.dashboard.updateCurrencyCards();
        window.dashboard.updateExchangeAlerts();
      }

      // Update overview chart
      if (window.overviewChart) {
        window.overviewChart.update();
      }
      break;

    case "exchange-rates":
      // Update exchange rate data
      if (window.dashboard) {
        window.dashboard.updateRateSourcesTable();
      }

      // Update currency charts
      if (window.currencyCharts) {
        if (window.currencyManager && window.transactionManager) {
          window.currencyCharts.updateCurrencyCharts(
            window.currencyManager,
            window.transactionManager
          );
        }
      }
      break;

    case "transactions":
      // Update transactions filtering
      if (window.applyTransactionFilters) {
        window.applyTransactionFilters();
      }
      break;

    case "analytics":
      // Update analytics charts
      if (window.charts) {
        window.charts.updateCharts();
      }
      break;

    case "predictions":
      // Update prediction data
      if (window.predictions) {
        window.predictions.updatePredictions();
      }

      // Update forecast chart
      if (window.forecastChart) {
        window.forecastChart.update();
      }
      break;
  }
}

/**
 * Track page view (for analytics in a real app)
 * @param {String} pageId - ID of the viewed page
 */
function trackPageView(pageId) {
  // In a real app, this would send analytics data
  console.log(`Page view: ${pageId}`);
}

// Export navigation functions
window.navigation = {
  navigateToPage,
  triggerPageUpdates,
};
