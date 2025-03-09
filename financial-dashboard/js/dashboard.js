// Setup receipt processing
function setupReceiptProcessing() {
  const receiptModal = document.getElementById("receipt-modal");
  const closeBtn = receiptModal.querySelector(".close-modal");
  const cancelBtn = document.getElementById("receipt-cancel-transaction");
  const form = document.getElementById("receipt-transaction-form");

  // Close modal when X is clicked
  closeBtn.addEventListener("click", function () {
    receiptModal.style.display = "none";
  });

  // Close modal when Cancel button is clicked
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      receiptModal.style.display = "none";
    });
  }

  // Close modal when clicking outside
  window.addEventListener("click", function (e) {
    if (e.target === receiptModal) {
      receiptModal.style.display = "none";
    }
  });

  // Handle form submission from receipt processing
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const transactionData = {
        date: document.getElementById("receipt-transaction-date").value,
        type: document.getElementById("receipt-transaction-type").value,
        description: document.getElementById("receipt-transaction-description")
          .value,
        amount: parseFloat(
          document.getElementById("receipt-transaction-amount").value
        ),
      };

      try {
        // Add new transaction
        await transactionManager.addTransaction(transactionData);

        // Close modal and refresh data
        receiptModal.style.display = "none";
        loadDashboardData();
      } catch (error) {
        console.error("Error saving transaction from receipt:", error);
        alert("Error saving transaction. Please try again.");
      }
    });
  }
} // Global variables
let transactionManager;
let currentUser;

// Initialize dashboard when user is authenticated
function initDashboard(user) {
  currentUser = user;
  transactionManager = new TransactionManager(user.uid);

  // Setup navigation
  setupNavigation();

  // Setup transaction modal
  setupTransactionModal();

  // Setup receipt processing
  setupReceiptProcessing();

  // Setup filters
  setupFilters();

  // Load initial data
  loadDashboardData();
}

// Setup navigation between dashboard pages
function setupNavigation() {
  document.querySelectorAll(".sidebar nav a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Update active nav link
      document.querySelectorAll(".sidebar nav a").forEach((el) => {
        el.classList.remove("active");
      });
      this.classList.add("active");

      // Show selected page
      const pageId = this.getAttribute("data-page");
      document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("active");
      });
      document.getElementById(pageId).classList.add("active");
    });
  });
}

// Setup transaction modal and form
function setupTransactionModal() {
  const modal = document.getElementById("transaction-modal");
  const addBtn = document.getElementById("add-transaction-btn");
  const closeBtn = document.querySelector(".close-modal");
  const cancelBtn = document.getElementById("cancel-transaction");
  const form = document.getElementById("transaction-form");

  // Set today's date as default
  document.getElementById("transaction-date").valueAsDate = new Date();

  // Open modal when Add Transaction is clicked
  addBtn.addEventListener("click", function () {
    document.getElementById("modal-title").textContent = "Add Transaction";
    document.getElementById("transaction-id").value = "";
    form.reset();
    document.getElementById("transaction-date").valueAsDate = new Date();
    modal.style.display = "block";
  });

  // Close modal methods
  closeBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  cancelBtn.addEventListener("click", function () {
    modal.style.display = "none";
  });

  window.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Handle form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const transactionData = {
      date: document.getElementById("transaction-date").value,
      type: document.getElementById("transaction-type").value,
      description: document.getElementById("transaction-description").value,
      amount: parseFloat(document.getElementById("transaction-amount").value),
    };

    const transactionId = document.getElementById("transaction-id").value;

    try {
      if (transactionId) {
        // Update existing transaction
        await transactionManager.updateTransaction(
          transactionId,
          transactionData
        );
      } else {
        // Add new transaction
        await transactionManager.addTransaction(transactionData);
      }

      // Close modal and refresh data
      modal.style.display = "none";
      loadDashboardData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Error saving transaction. Please try again.");
    }
  });
}

// Setup filters for transactions
function setupFilters() {
  const typeFilter = document.getElementById("type-filter");
  const dateFilter = document.getElementById("date-filter");
  const searchFilter = document.getElementById("search-transactions");

  // Apply filters when changed
  typeFilter.addEventListener("change", applyFilters);
  dateFilter.addEventListener("change", applyFilters);

  // Debounce search to prevent too many updates
  let searchTimeout;
  searchFilter.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });
}

// Apply transaction filters
async function applyFilters() {
  const typeFilter = document.getElementById("type-filter").value;
  const dateFilter = document.getElementById("date-filter").value;
  const searchFilter = document.getElementById("search-transactions").value;

  const filters = {
    type: typeFilter,
    dateRange: dateFilter,
    search: searchFilter,
  };

  try {
    const transactions = await transactionManager.getFilteredTransactions(
      filters
    );
    renderTransactionsTable(transactions);
  } catch (error) {
    console.error("Error applying filters:", error);
  }
}

// Load all dashboard data
async function loadDashboardData() {
  try {
    const transactions = await transactionManager.getAllTransactions();

    // Render transactions table
    renderTransactionsTable(transactions);

    // Update dashboard stats
    updateDashboardStats();

    // Update charts
    if (typeof updateCharts === "function") {
      updateCharts();
    }

    // Update predictions
    if (typeof updatePredictions === "function") {
      updatePredictions();
    }

    // Update partner summary
    updatePartnerSummary();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// Render transactions table
function renderTransactionsTable(transactions) {
  const tableBody = document.getElementById("transactions-body");

  if (!transactions || transactions.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">No transactions found</td></tr>';
    return;
  }

  tableBody.innerHTML = "";

  // Sort by date (newest first for display)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sortedTransactions.forEach((transaction) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td class="${transaction.type}">${transaction.type}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td>${formatCurrency(transaction.balance)}</td>
            <td>
                <button class="btn-edit" data-id="${
                  transaction.id
                }">Edit</button>
                <button class="btn-delete" data-id="${
                  transaction.id
                }">Delete</button>
            </td>
        `;

    tableBody.appendChild(row);
  });

  // Add event listeners to edit/delete buttons
  document.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", function () {
      editTransaction(this.getAttribute("data-id"));
    });
  });

  document.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", function () {
      deleteTransaction(this.getAttribute("data-id"));
    });
  });
}

// Edit transaction
async function editTransaction(id) {
  const modal = document.getElementById("transaction-modal");

  try {
    // Find transaction in existing data
    const transaction = transactionManager.transactions.find(
      (t) => t.id === id
    );

    if (!transaction) {
      console.error("Transaction not found");
      return;
    }

    // Populate form
    document.getElementById("modal-title").textContent = "Edit Transaction";
    document.getElementById("transaction-id").value = id;
    document.getElementById("transaction-date").value = transaction.date;
    document.getElementById("transaction-type").value = transaction.type;
    document.getElementById("transaction-description").value =
      transaction.description;
    document.getElementById("transaction-amount").value = transaction.amount;

    // Show modal
    modal.style.display = "block";
  } catch (error) {
    console.error("Error editing transaction:", error);
  }
}

// Delete transaction
async function deleteTransaction(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    try {
      await transactionManager.deleteTransaction(id);
      loadDashboardData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Error deleting transaction. Please try again.");
    }
  }
}

// Update dashboard statistics
function updateDashboardStats() {
  const stats = transactionManager.getFinancialStats();

  // Update overview stats
  document.getElementById("total-sent").textContent = formatCurrency(
    stats.totalSent
  );
  document.getElementById("total-received").textContent = formatCurrency(
    stats.totalReceived
  );
  document.getElementById("net-balance").textContent = formatCurrency(
    stats.netBalance
  );
  document.getElementById("recent-activity").textContent = stats.recentActivity;

  // Update analytics metrics if available
  const analytics = transactionManager.getAnalyticsData();
  if (analytics) {
    document.getElementById("avg-transaction").textContent = formatCurrency(
      analytics.avgTransaction
    );
    document.getElementById("largest-transaction").textContent = formatCurrency(
      analytics.largestTransaction
    );
    document.getElementById("transaction-frequency").textContent =
      analytics.frequency.toFixed(1) + " / month";
    document.getElementById("growth-rate").textContent =
      analytics.growthRate.toFixed(1) + "%";
  }
}

// Update partner summary
function updatePartnerSummary() {
  const stats = transactionManager.getFinancialStats();
  const partnerSummary = document.getElementById("partner-summary");

  if (stats.netBalance > 0) {
    partnerSummary.innerHTML = `
            <p>Current balance is in your favor.</p>
            <p>Net: <strong class="received">${formatCurrency(
              stats.netBalance
            )}</strong></p>
        `;
  } else if (stats.netBalance < 0) {
    partnerSummary.innerHTML = `
            <p>Current balance is in partner's favor.</p>
            <p>Net: <strong class="sent">${formatCurrency(
              Math.abs(stats.netBalance)
            )}</strong></p>
        `;
  } else {
    partnerSummary.innerHTML = `
            <p>Current balance is even.</p>
            <p>Net: <strong>${formatCurrency(0)}</strong></p>
        `;
  }
}
