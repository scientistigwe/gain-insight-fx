/\*\*

- Update optimal trading times
  \*/
  function updateOptimalTradingTimes() {
  const container = document.getElementById('optimal-days');
  if (!container) return;

const currencies = currencyManager.currencies.filter(c => c !== 'NGN');

if (!currencies || currencies.length === 0) {
container.innerHTML = '<p>No trading time data available</p>';
return;
}

let html = '<div class="trading-times-list">';

currencies.forEach(currency => {
const optimalTimes = currencyManager.getOptimalTradingTimes(currency);

    if (!optimalTimes || !optimalTimes.buyDay || !optimalTimes.sellDay) {
      return;
    }

    html += `
      <div class="trading-time-item">
        <div class="trading-currency">${currency}/NGN</div>
        <div class="trading-days">
          <div class="trading-best-buy">
            <span class="trading-label">Best day to buy ${currency}:</span>
            <span class="trading-value">${optimalTimes.buyDay.name}</span>
            <span class="trading-rate">Avg: ₦${optimalTimes.buyDay.avgRate.toFixed(2)}</span>
          </div>
          <div class="trading-best-sell">
            <span class="trading-label">Best day to sell ${currency}:</span>
            <span class="trading-value">${optimalTimes.sellDay.name}</span>
            <span class="trading-rate">Avg: ₦${optimalTimes.sellDay.avgRate.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

});

html += '</div>';
container.innerHTML = html;
}

/\*\*

- Update alerts table
  \*/
  function updateAlertsTable() {
  const container = document.getElementById('alerts-table');
  if (!container) return;

const currencies = currencyManager.currencies.filter(c => c !== 'NGN');

if (!currencies || currencies.length === 0) {
container.innerHTML = '<p>No alert data available</p>';
return;
}

let html = `    <table class="alerts-table">
      <thead>
        <tr>
          <th>Currency</th>
          <th>Current Rate</th>
          <th>Buy Alert</th>
          <th>Sell Alert</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
 `;

currencies.forEach(currency => {
const currentRate = currencyManager.rates[currency];
const thresholds = currencyManager.thresholds[currency] || { buy: 0, sell: 0 };

    if (!currentRate) return;

    html += `
      <tr>
        <td>${currency}/NGN</td>
        <td>₦${currentRate.toFixed(2)}</td>
        <td>
          ${thresholds.buy > 0 ?
            `₦${thresholds.buy.toFixed(2)}
             ${currentRate <= thresholds.buy ?
               '<span class="alert-active">ACTIVE</span>' :
               ''}` :
            'Not set'}
        </td>
        <td>
          ${thresholds.sell > 0 ?
            `₦${thresholds.sell.toFixed(2)}
             ${currentRate >= thresholds.sell ?
               '<span class="alert-active">ACTIVE</span>' :
               ''}` :
            'Not set'}
        </td>
        <td>
          <button class="btn-edit-alert" data-currency="${currency}">Edit</button>
          <button class="btn-delete-alert" data-currency="${currency}">Delete</button>
        </td>
      </tr>
    `;

});

html += `      </tbody>
    </table>
 `;

container.innerHTML = html;

// Add event listeners to edit/delete buttons
document.querySelectorAll('.btn-edit-alert').forEach(button => {
button.addEventListener('click', function() {
const currency = this.getAttribute('data-currency');
editAlert(currency);
});
});

document.querySelectorAll('.btn-delete-alert').forEach(button => {
button.addEventListener('click', function() {
const currency = this.getAttribute('data-currency');
deleteAlert(currency);
});
});
}

/\*\*

- Edit alert
  \*/
  function editAlert(currency) {
  const modal = document.getElementById('alert-modal');
  if (!modal) return;

// Set selected currency
const currencySelect = document.getElementById('alert-currency');
if (currencySelect) {
currencySelect.value = currency;
}

// Update rate information
updateAlertRateInfo();

// Show existing thresholds
if (currencyManager.thresholds && currencyManager.thresholds[currency]) {
document.getElementById('buy-threshold').value =
currencyManager.thresholds[currency].buy > 0 ?
currencyManager.thresholds[currency].buy : '';

    document.getElementById('sell-threshold').value =
      currencyManager.thresholds[currency].sell > 0 ?
      currencyManager.thresholds[currency].sell : '';

} else {
document.getElementById('buy-threshold').value = '';
document.getElementById('sell-threshold').value = '';
}

// Show modal
modal.style.display = 'block';
}

/\*\*

- Delete alert
  \*/
  async function deleteAlert(currency) {
  if (confirm(`Are you sure you want to delete the alert for ${currency}?`)) {
  try {
  await currencyManager.setAlertThresholds(currency, 0, 0);
  updateAlertsTable();
  updateExchangeAlerts();
  } catch (error) {
  console.error('Error deleting alert:', error);
  alert('Error deleting alert. Please try again.');
  }
  }
  }

/\*\*

- Update forecast chart
  \*/
  function updateForecastChart() {
  const canvas = document.getElementById('forecast-chart');
  if (!canvas) return;

const ctx = canvas.getContext('2d');
if (!ctx) return;

const currencies = currencyManager.currencies.filter(c => c !== 'NGN');

if (!currencies || currencies.length === 0) {
// No data available
return;
}

// Prepare datasets
const datasets = [];

currencies.forEach(currency => {
const currentRate = currencyManager.rates[currency];
if (!currentRate) return;

    const prediction7 = currencyManager.predictFutureRate(currency, 7);
    const prediction14 = currencyManager.predictFutureRate(currency, 14);
    const prediction30 = currencyManager.predictFutureRate(currency, 30);

    if (!prediction7 || !prediction14 || !prediction30) return;

    const now = new Date();
    const day7 = new Date(now);
    day7.setDate(now.getDate() + 7);
    const day14 = new Date(now);
    day14.setDate(now.getDate() + 14);
    const day30 = new Date(now);
    day30.setDate(now.getDate() + 30);

    datasets.push({
      label: `${currency}/NGN`,
      data: [
        { x: now, y: currentRate },
        { x: day7, y: prediction7.rate },
        { x: day14, y: prediction14.rate },
        { x: day30, y: prediction30.rate }
      ],
      borderColor: window.currencyColors ? window.currencyColors[currency] : getRandomColor(),
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderDash: [5, 5], // Dashed line for forecasts
      fill: false
    });

});

if (datasets.length === 0) {
return;
}

// Create chart
if (window.forecastChart) {
window.forecastChart.destroy();
}

window.forecastChart = new Chart(ctx, {
type: 'line',
data: {
datasets: datasets
},
options: {
responsive: true,
maintainAspectRatio: false,
scales: {
x: {
type: 'time',
time: {
unit: 'day',
displayFormats: {
day: 'MMM d'
}
},
title: {
display: true,
text: 'Date'
}
},
y: {
title: {
display: true,
text: 'Exchange Rate (NGN)'
}
}
},
plugins: {
legend: {
position: 'top'
},
tooltip: {
mode: 'index',
intersect: false,
callbacks: {
title: function(context) {
const date = new Date(context[0].parsed.x);
return date.toLocaleDateString('en-US', {
year: 'numeric',
month: 'short',
day: 'numeric'
});
},
label: function(context) {
const label = context.dataset.label || '';
const value = context.parsed.y;

              // Calculate days from now
              const now = new Date();
              const pointDate = new Date(context.parsed.x);
              const daysDiff = Math.round((pointDate - now) / (1000 * 60 * 60 * 24));

              let suffix = '';
              if (daysDiff > 0) {
                suffix = ` (Forecast: +${daysDiff} days)`;
              }

              return `${label}: ₦${value.toFixed(2)}${suffix}`;
            }
          }
        }
      }
    }

});
}

/\*\*

- Update economic indicators display
  \*/
  function updateEconomicIndicators() {
  const container = document.getElementById('economic-indicators');
  if (!container) return;

// We will fetch economic indicators using the scraper
exchangeRateScraper.getEconomicIndicators().then(data => {
if (!data || !data.indicators || Object.keys(data.indicators).length === 0) {
container.innerHTML = '<p>No economic data available</p>';
return;
}

    let html = '';

    for (const [key, indicator] of Object.entries(data.indicators)) {
      // Format indicator name
      const name = key.replace(/([A-Z])/g, ' $1').trim();
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

      // Format change direction
      const changeClass = indicator.change > 0 ? 'positive' : indicator.change < 0 ? 'negative' : 'neutral';
      const changeSign = indicator.change > 0 ? '+' : '';

      // Format unit
      const unit = indicator.unit ? ` ${indicator.unit}` : '%';

      html += `
        <div class="indicator-card">
          <div class="indicator-header">
            <span class="indicator-name">${formattedName}</span>
            <span class="indicator-impact impact-${indicator.impact || 'medium'}">${indicator.impact || 'medium'} impact</span>
          </div>
          <div class="indicator-value">${indicator.value}${unit}</div>
          <div class="indicator-change ${changeClass}">${changeSign}${indicator.change}${unit}</div>
          <div class="indicator-date">${formatDate(indicator.date)}</div>
        </div>
      `;
    }

    container.innerHTML = html;

}).catch(error => {
console.error('Error fetching economic indicators:', error);
container.innerHTML = '<p>Error loading economic data</p>';
});
}

/\*\*

- Update market news display
  \*/
  function updateMarketNews() {
  const container = document.getElementById('market-news');
  if (!container) return;

// We will fetch news using the scraper
exchangeRateScraper.getRelevantNews().then(news => {
if (!news || news.length === 0) {
container.innerHTML = '<p>No market news available</p>';
return;
}

    let html = '';

    news.forEach(item => {
      // Format sentiment
      const sentimentClass = item.sentiment === 'positive' ? 'positive' :
                            item.sentiment === 'negative' ? 'negative' :
                            'neutral';

      const sentimentIcon = item.sentiment === 'positive' ? '📈' :
                           item.sentiment === 'negative' ? '📉' :
                           '📊';

      html += `
        <div class="news-item">
          <div class="news-header">
            <span class="news-sentiment ${sentimentClass}">${sentimentIcon}</span>
            <span class="news-title">${item.title}</span>
          </div>
          <div class="news-summary">${item.summary}</div>
          <div class="news-meta">
            <span class="news-source">${item.source}</span>
            <span class="news-date">${formatDate(item.date)}</span>
            <span class="news-relevance">Relevance: ${(item.relevance * 100).toFixed(0)}%</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

}).catch(error => {
console.error('Error fetching market news:', error);
container.innerHTML = '<p>Error loading market news</p>';
});
}

/\*\*

- Format date
  \*/
  function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
  });
  }

/\*\*

- Format currency with symbol
  \*/
  function formatCurrencyWithSymbol(amount, currency) {
  let symbol = '₦';

switch (currency) {
case 'USD':
symbol = '$';
break;
case 'GBP':
symbol = '£';
break;
case 'EUR':
symbol = '€';
break;
}

return `${symbol}${amount.toFixed(2)}`;
}

/\*\*

- Generate random color
  _/
  function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
  color += letters[Math.floor(Math.random() _ 16)];
  }
  return color;
  }

// Export functions
window.dashboard = {
initDashboard,
loadDashboardData,
updateCurrencyCards,
updateExchangeAlerts,
updateRateSourcesTable
};
