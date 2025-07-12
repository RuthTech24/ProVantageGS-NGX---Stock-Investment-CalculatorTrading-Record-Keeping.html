(function(){
  let currentMode = 'investment'; // 'investment' or 'shares'
  let roiChart = null;
  let tradingRecords = JSON.parse(localStorage.getItem('tradingRecords')) || [];
  
  const view = document.getElementById("view");
  const darkModeToggle = document.getElementById("darkModeToggle");
  
  // Initialize
  document.getElementById("btnSingle").onclick = loadSingleView;
  document.getElementById("btnMultiple").onclick = loadMultipleView;
  document.getElementById("btnTrading").onclick = loadTradingView;
  darkModeToggle.onclick = toggleDarkMode;
  
  // Load dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.setAttribute('data-theme', 'dark');
    darkModeToggle.textContent = '☀️ Light Mode';
  }
  
  loadSingleView();

  function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.body.removeAttribute('data-theme');
      darkModeToggle.textContent = '🌙 Dark Mode';
      localStorage.setItem('darkMode', 'false');
    } else {
      document.body.setAttribute('data-theme', 'dark');
      darkModeToggle.textContent = '☀️ Light Mode';
      localStorage.setItem('darkMode', 'true');
    }
  }

  function getCommissionRate() {
    return parseFloat(document.getElementById("commissionRate").value) || 3;
  }

  function getProfitTarget() {
    return parseFloat(document.getElementById("profitTarget").value) || 10;
  }

  function activateTab(id) {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  function loadSingleView() {
    activateTab("btnSingle");
    view.innerHTML = `
      <section class="section">
        <h2>Single Stock Calculator</h2>
        
        <div class="calculation-mode">
          <button class="mode-btn ${currentMode === 'investment' ? 'active' : ''}" onclick="switchMode('investment')">
            💰 By Investment Amount
          </button>
          <button class="mode-btn ${currentMode === 'shares' ? 'active' : ''}" onclick="switchMode('shares')">
            📊 By Number of Shares
          </button>
        </div>
        
        <div id="singleInputs"></div>
        <button class="calc" onclick="singleCalc()">Calculate Stock</button>
        <div id="singleResult"></div>
      </section>`;
    renderSingleInputs();
  }

  function renderSingleInputs() {
    const container = document.getElementById("singleInputs");
    if (currentMode === 'investment') {
      container.innerHTML = `
        <label>Investment Amount (₦):</label>
        <input id="invAmt" type="number" placeholder="e.g. 500000">
        <label>Price per Share (₦):</label>
        <input id="buyPrice" type="number" placeholder="e.g. 3.0">
      `;
    } else {
      container.innerHTML = `
        <label>Number of Shares:</label>
        <input id="numShares" type="number" placeholder="e.g. 1000">
        <label>Price per Share (₦):</label>
        <input id="buyPrice" type="number" placeholder="e.g. 3.0">
      `;
    }
  }

  window.switchMode = function(mode) {
    currentMode = mode;
    renderSingleInputs();
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  }

  window.singleCalc = function() {
    const buyPrice = +document.getElementById("buyPrice").value;
    const commissionRate = getCommissionRate() / 100;
    const profitTargetRate = getProfitTarget() / 100;
    
    if (!buyPrice) return alert("Enter valid price per share");
    
    let investment, shares;
    
    if (currentMode === 'investment') {
      investment = +document.getElementById("invAmt").value;
      if (!investment) return alert("Enter valid investment amount");
      shares = investment / buyPrice;
    } else {
      shares = +document.getElementById("numShares").value;
      if (!shares) return alert("Enter valid number of shares");
      investment = shares * buyPrice;
    }
    
    const targetPrice = buyPrice * (1 + profitTargetRate);
    const grossProfit = shares * (targetPrice - buyPrice);
    const commissionFee = investment * commissionRate;
    const netProfit = grossProfit - commissionFee;
    const roi = (netProfit / investment) * 100;
    
    const performanceIndicator = roi > 15 ? '🚀' : roi > 5 ? '📈' : roi > 0 ? '📊' : '📉';
    const performanceText = roi > 15 ? 'High Performer' : roi > 5 ? 'Good Performer' : roi > 0 ? 'Moderate Performer' : 'Low Performer';
    
    document.getElementById("singleResult").innerHTML = `
      <div class="card ${roi > 10 ? 'best' : ''}">
        <div class="performance-indicator">${performanceIndicator}</div>
        <strong>Investment Analysis - ${performanceText}</strong><br><br>
        <strong>Investment Details:</strong><br>
        Total Investment: ₦${investment.toLocaleString()}<br>
        Number of Shares: ${shares.toLocaleString()}<br>
        Buy Price per Share: ₦${buyPrice.toFixed(2)}<br>
        Target Price (${getProfitTarget()}% profit): ₦${targetPrice.toFixed(2)}<br><br>
        
        <strong>Profit Analysis:</strong><br>
        Gross Profit: ₦${grossProfit.toLocaleString()}<br>
        Commission Fee (${getCommissionRate()}%): ₦${commissionFee.toLocaleString()}<br>
        <strong>Net Profit: ₦${netProfit.toLocaleString()}</strong><br>
        <strong>ROI: ${roi.toFixed(2)}%</strong>
      </div>
      
      <div class="chart-container">
        <h3>Investment Breakdown</h3>
        <div class="chart-wrapper">
          <canvas id="singleChart"></canvas>
        </div>
      </div>`;
    
    // Create pie chart for single stock
    createSingleStockChart(investment, grossProfit, commissionFee, netProfit);
  }

  function createSingleStockChart(investment, grossProfit, commissionFee, netProfit) {
    const ctx = document.getElementById('singleChart').getContext('2d');
    
    if (window.singleChart) {
      window.singleChart.destroy();
    }
    
    window.singleChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Initial Investment', 'Gross Profit', 'Commission Fee'],
        datasets: [{
          data: [investment, Math.max(0, grossProfit), commissionFee],
          backgroundColor: [
            'rgba(1, 77, 1, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(1, 77, 1, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
              padding: 20,
              font: {
                size: 14
              }
            }
          },
          title: {
            display: true,
            text: `Net Profit: ₦${netProfit.toLocaleString()}`,
            color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    });
  }

  function loadMultipleView() {
    activateTab("btnMultiple");
    view.innerHTML = `
      <section class="section">
        <h2>Multiple Stock Calculator</h2>
        <label>Total Investment (₦):</label>
        <input id="totalInv" type="number" placeholder="e.g. 100000">
        <div id="multiInputs"></div>
        <button class="calc" onclick="multiCalc()">Calculate Stock</button>
        <div id="multiResults"></div>
      </section>`;
    renderMultiInputs();
  }

  function renderMultiInputs() {
    const container = document.getElementById("multiInputs");
    container.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      container.innerHTML += `
        <div class="stockRow">
          <input id="name${i}" type="text" placeholder="Stock ${i + 1} Name">
          <input id="buy${i}" type="number" placeholder="Buying Price (₦)">
          <input id="sell${i}" type="number" placeholder="Selling Price (₦)">
        </div>`;
    }
  }

  window.multiCalc = function() {
    const totalInvestment = +document.getElementById("totalInv").value;
    if (!totalInvestment) return alert("Enter total investment amount");
    
    const commissionRate = getCommissionRate() / 100;
    const results = [];
    const resDiv = document.getElementById("multiResults");
    resDiv.innerHTML = "";
    
    let bestROI = -Infinity;
    let worstROI = Infinity;
    let bestIdx = -1;
    let worstIdx = -1;
    
    // Calculate for each stock using the FULL investment amount for each
    for (let i = 0; i < 4; i++) {
      const name = document.getElementById(`name${i}`).value || `Stock ${i + 1}`;
      const buyPrice = +document.getElementById(`buy${i}`).value;
      const sellPrice = +document.getElementById(`sell${i}`).value;
      
      if (!buyPrice || !sellPrice) continue;
      
      // Use full investment amount for each stock separately
      const shares = totalInvestment / buyPrice;
      const grossProfit = shares * (sellPrice - buyPrice);
      const commissionFee = totalInvestment * commissionRate;
      const netProfit = grossProfit - commissionFee;
      const roi = (netProfit / totalInvestment) * 100;
      
      if (roi > bestROI) {
        bestROI = roi;
        bestIdx = results.length;
      }
      if (roi < worstROI) {
        worstROI = roi;
        worstIdx = results.length;
      }
      
      results.push({
        name,
        shares,
        buyPrice,
        sellPrice,
        investment: totalInvestment, // Now using full investment for each
        grossProfit,
        commissionFee,
        netProfit,
        roi
      });
    }
    
    if (results.length === 0) {
      return alert("Please enter at least one stock with valid buy and sell prices");
    }
    
    // Display results
    results.forEach((r, idx) => {
      const isBest = idx === bestIdx;
      const isWorst = idx === worstIdx && results.length > 1;
      
      let performanceIndicator = '📊';
      let performanceClass = '';
      let performanceText = '';
      
      if (isBest) {
        performanceIndicator = '🚀';
        performanceClass = 'best';
        performanceText = ' - Best Performer';
      } else if (isWorst) {
        performanceIndicator = '📉';
        performanceText = ' - Needs Attention';
      } else if (r.roi > 10) {
        performanceIndicator = '📈';
        performanceText = ' - Good Performer';
      }
      
      const div = document.createElement("div");
      div.className = `card ${performanceClass}`;
      div.innerHTML = `
        <div class="performance-indicator">${performanceIndicator}</div>
        <strong>${r.name}${performanceText}</strong><br><br>
        <strong>Investment:</strong> ₦${r.investment.toLocaleString()}<br>
        <strong>Shares:</strong> ${r.shares.toLocaleString()}<br>
        <strong>Buy Price:</strong> ₦${r.buyPrice.toFixed(2)} | <strong>Sell Price:</strong> ₦${r.sellPrice.toFixed(2)}<br>
        <strong>Gross Profit:</strong> ₦${r.grossProfit.toLocaleString()}<br>
        <strong>Commission:</strong> ₦${r.commissionFee.toLocaleString()}<br>
        <strong>Net Profit:</strong> ₦${r.netProfit.toLocaleString()}<br>
        <strong>ROI:</strong> ${r.roi.toFixed(2)}%
      `;
      resDiv.appendChild(div);
    });
    
    // Add comparison summary - each stock uses the same investment amount
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "card";
    summaryDiv.innerHTML = `
      <h3>📊 Stock Comparison Summary</h3>
      <p><strong>Comparison Method:</strong> Each stock analyzed with ₦${totalInvestment.toLocaleString()} investment</p>
      <strong>Investment per Stock:</strong> ₦${totalInvestment.toLocaleString()}<br>
      <strong>Best Performing Stock:</strong> ${results[bestIdx]?.name || 'N/A'} (${bestROI.toFixed(2)}% ROI)<br>
      <strong>Worst Performing Stock:</strong> ${results[worstIdx]?.name || 'N/A'} (${worstROI.toFixed(2)}% ROI)<br>
      <strong>Number of Stocks Compared:</strong> ${results.length}
    `;
    resDiv.appendChild(summaryDiv);
    
    // Add ROI summary cards
    const roiSummaryDiv = document.createElement("div");
    roiSummaryDiv.className = "roi-summary";
    roiSummaryDiv.innerHTML = `
      <div class="roi-card">
        <div class="roi-value">${bestROI.toFixed(1)}%</div>
        <div class="roi-label">Best ROI</div>
      </div>
      <div class="roi-card">
        <div class="roi-value">${worstROI.toFixed(1)}%</div>
        <div class="roi-label">Worst ROI</div>
      </div>
      <div class="roi-card">
        <div class="roi-value">₦${totalInvestment.toLocaleString()}</div>
        <div class="roi-label">Investment per Stock</div>
      </div>
      <div class="roi-card">
        <div class="roi-value">${results.length}</div>
        <div class="roi-label">Stocks Compared</div>
      </div>
    `;
    resDiv.appendChild(roiSummaryDiv);
    
    // Add charts
    const chartContainer = document.createElement("div");
    chartContainer.className = "chart-container";
    chartContainer.innerHTML = `
      <h3>Portfolio Performance Analysis</h3>
      <div class="chart-wrapper">
        <canvas id="roiChart"></canvas>
      </div>
      <div class="chart-wrapper">
        <canvas id="profitChart"></canvas>
      </div>
    `;
    resDiv.appendChild(chartContainer);
    
    // Create charts
    createROIChart(results);
    createProfitChart(results);
  }

  function createROIChart(results) {
    const ctx = document.getElementById('roiChart').getContext('2d');
    
    if (roiChart) {
      roiChart.destroy();
    }
    
    const colors = results.map(r => {
      if (r.roi > 15) return 'rgba(16, 185, 129, 0.8)'; // Green for high performers
      if (r.roi > 5) return 'rgba(59, 130, 246, 0.8)';  // Blue for good performers
      if (r.roi > 0) return 'rgba(245, 158, 11, 0.8)';  // Yellow for moderate
      return 'rgba(239, 68, 68, 0.8)';                   // Red for poor performers
    });
    
    roiChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: results.map(r => r.name),
        datasets: [{
          label: 'ROI (%)',
          data: results.map(r => r.roi),
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.body).getPropertyValue('--text-primary')
            }
          },
          title: {
            display: true,
            text: 'Return on Investment (ROI) by Stock',
            color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'ROI (%)',
              color: getComputedStyle(document.body).getPropertyValue('--text-primary')
            },
            ticks: {
              color: getComputedStyle(document.body).getPropertyValue('--text-primary')
            },
            grid: {
              color: getComputedStyle(document.body).getPropertyValue('--border-color')
            }
          },
          x: {
            title: {
              display: true,
              text: 'Stocks',
              color: getComputedStyle(document.body).getPropertyValue('--text-primary')
            },
            ticks: {
              color: getComputedStyle(document.body).getPropertyValue('--text-primary')
            },
            grid: {
              color: getComputedStyle(document.body).getPropertyValue('--border-color')
            }
          }
        }
      }
    });
  }

  function createProfitChart(results) {
    const ctx = document.getElementById('profitChart').getContext('2d');
    
    if (window.profitChart) {
      window.profitChart.destroy();
    }
    
    window.profitChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: results.map(r => r.name),
        datasets: [{
          data: results.map(r => Math.max(0, r.netProfit)),
          backgroundColor: [
            'rgba(1, 77, 1, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: [
            'rgba(1, 77, 1, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(245, 158, 11, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
              padding: 20
            }
          },
          title: {
            display: true,
            text: 'Net Profit Distribution',
            color: getComputedStyle(document.body).getPropertyValue('--text-primary'),
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    });
  }

  // Trading Records Functionality
  function loadTradingView() {
    activateTab("btnTrading");
    view.innerHTML = `
      <section class="section">
        <h2>Daily Trading Statistics</h2>
        
        <!-- Trading Form -->
        <div class="trading-form-container">
          <h3>Add New Trading Record</h3>
          <form id="tradingForm" class="trading-form">
            <div class="form-row">
              <div class="form-group">
                <label for="datePurchased">Date Purchased:</label>
                <input type="date" id="datePurchased" required>
              </div>
              <div class="form-group">
                <label for="dateSold">Date Sold:</label>
                <input type="date" id="dateSold" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="stockName">Stock Name:</label>
                <input type="text" id="stockName" placeholder="e.g. DANGCEM" required>
              </div>
              <div class="form-group">
                <label for="quantity">Quantity:</label>
                <input type="number" id="quantity" placeholder="e.g. 1000" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="buyPriceTrading">Buy Price (₦):</label>
                <input type="number" id="buyPriceTrading" step="0.01" placeholder="e.g. 5.50" required>
              </div>
              <div class="form-group">
                <label for="sellPriceTrading">Sell Price (₦):</label>
                <input type="number" id="sellPriceTrading" step="0.01" placeholder="e.g. 6.00" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="commissionTrading">Commission (₦):</label>
                <input type="number" id="commissionTrading" step="0.01" placeholder="Auto-calculated or manual">
              </div>
              <div class="form-group">
                <label for="notes">Notes:</label>
                <input type="text" id="notes" placeholder="Optional notes">
              </div>
            </div>
            
            <button type="submit" class="calc">Add Trading Record</button>
          </form>
        </div>
        
        <!-- Search and Filter -->
        <div class="filter-container">
          <div class="filter-row">
            <input type="text" id="searchFilter" placeholder="Search by stock name..." class="search-input">
            <input type="date" id="dateFilter" class="date-filter">
            <button onclick="clearFilters()" class="filter-btn">Clear Filters</button>
            <button onclick="exportToCSV()" class="export-btn">📊 Export CSV</button>
          </div>
        </div>
        
        <!-- Trading Records Table -->
        <div class="records-container">
          <h3>Trading Records</h3>
          <div id="tradingRecordsTable"></div>
        </div>
      </section>`;
    
    renderTradingRecords();
    setupTradingForm();
  }

  function setupTradingForm() {
    const form = document.getElementById('tradingForm');
    const buyPriceInput = document.getElementById('buyPriceTrading');
    const quantityInput = document.getElementById('quantity');
    const commissionInput = document.getElementById('commissionTrading');
    
    // Auto-calculate commission when buy price or quantity changes
    function autoCalculateCommission() {
      const buyPrice = parseFloat(buyPriceInput.value) || 0;
      const quantity = parseFloat(quantityInput.value) || 0;
      const totalInvestment = buyPrice * quantity;
      const commissionRate = getCommissionRate() / 100;
      const commission = totalInvestment * commissionRate;
      
      if (buyPrice && quantity && !commissionInput.value) {
        commissionInput.value = commission.toFixed(2);
      }
    }
    
    buyPriceInput.addEventListener('input', autoCalculateCommission);
    quantityInput.addEventListener('input', autoCalculateCommission);
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      addTradingRecord();
    });
  }

  function addTradingRecord() {
    const datePurchased = document.getElementById('datePurchased').value;
    const dateSold = document.getElementById('dateSold').value;
    const stockName = document.getElementById('stockName').value;
    const quantity = parseFloat(document.getElementById('quantity').value);
    const buyPrice = parseFloat(document.getElementById('buyPriceTrading').value);
    const sellPrice = parseFloat(document.getElementById('sellPriceTrading').value);
    const commission = parseFloat(document.getElementById('commissionTrading').value) || 0;
    const notes = document.getElementById('notes').value;
    
    // Calculate derived values
    const totalInvestment = buyPrice * quantity;
    const grossProfit = (sellPrice - buyPrice) * quantity;
    const netProfit = grossProfit - commission;
    const roi = (netProfit / totalInvestment) * 100;
    
    const record = {
      id: Date.now(),
      datePurchased,
      dateSold,
      stockName,
      quantity,
      buyPrice,
      sellPrice,
      commission,
      notes,
      totalInvestment,
      grossProfit,
      netProfit,
      roi,
      createdAt: new Date().toISOString()
    };
    
    tradingRecords.push(record);
    saveTradingRecords();
    renderTradingRecords();
    
    // Reset form
    document.getElementById('tradingForm').reset();
    
    alert('Trading record added successfully!');
  }

  function saveTradingRecords() {
    localStorage.setItem('tradingRecords', JSON.stringify(tradingRecords));
  }

  function renderTradingRecords() {
    const container = document.getElementById('tradingRecordsTable');
    if (!container) return;
    
    const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';
    
    let filteredRecords = tradingRecords.filter(record => {
      const matchesSearch = record.stockName.toLowerCase().includes(searchTerm);
      const matchesDate = !dateFilter || record.datePurchased === dateFilter || record.dateSold === dateFilter;
      return matchesSearch && matchesDate;
    });
    
    if (filteredRecords.length === 0) {
      container.innerHTML = '<p class="no-records">No trading records found.</p>';
      return;
    }
    
    let tableHTML = `
      <div class="table-responsive">
        <table class="trading-table">
          <thead>
            <tr>
              <th>Purchase Date</th>
              <th>Sell Date</th>
              <th>Stock</th>
              <th>Quantity</th>
              <th>Buy Price</th>
              <th>Sell Price</th>
              <th>Investment</th>
              <th>Gross Profit</th>
              <th>Commission</th>
              <th>Net Profit</th>
              <th>ROI %</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>`;
    
    filteredRecords.forEach(record => {
      const roiClass = record.roi > 10 ? 'high-roi' : record.roi > 0 ? 'positive-roi' : 'negative-roi';
      tableHTML += `
        <tr class="record-row ${roiClass}">
          <td>${record.datePurchased}</td>
          <td>${record.dateSold}</td>
          <td><strong>${record.stockName}</strong></td>
          <td>${record.quantity.toLocaleString()}</td>
          <td>₦${record.buyPrice.toFixed(2)}</td>
          <td>₦${record.sellPrice.toFixed(2)}</td>
          <td>₦${record.totalInvestment.toLocaleString()}</td>
          <td>₦${record.grossProfit.toLocaleString()}</td>
          <td>₦${record.commission.toLocaleString()}</td>
          <td>₦${record.netProfit.toLocaleString()}</td>
          <td class="roi-cell">${record.roi.toFixed(2)}%</td>
          <td>${record.notes || '-'}</td>
          <td class="actions-cell">
            <button onclick="editRecord(${record.id})" class="edit-btn">✏️</button>
            <button onclick="deleteRecord(${record.id})" class="delete-btn">🗑️</button>
          </td>
        </tr>`;
    });
    
    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
    
    // Add summary statistics
    const totalInvestment = filteredRecords.reduce((sum, r) => sum + r.totalInvestment, 0);
    const totalNetProfit = filteredRecords.reduce((sum, r) => sum + r.netProfit, 0);
    const avgROI = filteredRecords.length > 0 ? filteredRecords.reduce((sum, r) => sum + r.roi, 0) / filteredRecords.length : 0;
    
    const summaryHTML = `
      <div class="trading-summary">
        <h4>Summary Statistics</h4>
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-value">₦${totalInvestment.toLocaleString()}</div>
            <div class="summary-label">Total Investment</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">₦${totalNetProfit.toLocaleString()}</div>
            <div class="summary-label">Total Net Profit</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${avgROI.toFixed(2)}%</div>
            <div class="summary-label">Average ROI</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${filteredRecords.length}</div>
            <div class="summary-label">Total Trades</div>
          </div>
        </div>
      </div>`;
    
    container.innerHTML += summaryHTML;
  }

  window.editRecord = function(id) {
    const record = tradingRecords.find(r => r.id === id);
    if (!record) return;
    
    // Populate form with record data
    document.getElementById('datePurchased').value = record.datePurchased;
    document.getElementById('dateSold').value = record.dateSold;
    document.getElementById('stockName').value = record.stockName;
    document.getElementById('quantity').value = record.quantity;
    document.getElementById('buyPriceTrading').value = record.buyPrice;
    document.getElementById('sellPriceTrading').value = record.sellPrice;
    document.getElementById('commissionTrading').value = record.commission;
    document.getElementById('notes').value = record.notes;
    
    // Remove the record temporarily
    deleteRecord(id, false);
    
    alert('Record loaded for editing. Make changes and submit to update.');
  }

  window.deleteRecord = function(id, confirm = true) {
    if (confirm && !window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    tradingRecords = tradingRecords.filter(r => r.id !== id);
    saveTradingRecords();
    renderTradingRecords();
  }

  window.clearFilters = function() {
    document.getElementById('searchFilter').value = '';
    document.getElementById('dateFilter').value = '';
    renderTradingRecords();
  }

  window.exportToCSV = function() {
    if (tradingRecords.length === 0) {
      alert('No records to export');
      return;
    }
    
    const headers = [
      'Purchase Date', 'Sell Date', 'Stock Name', 'Quantity', 'Buy Price', 'Sell Price',
      'Total Investment', 'Gross Profit', 'Commission', 'Net Profit', 'ROI %', 'Notes'
    ];
    
    const csvContent = [
      headers.join(','),
      ...tradingRecords.map(record => [
        record.datePurchased,
        record.dateSold,
        record.stockName,
        record.quantity,
        record.buyPrice,
        record.sellPrice,
        record.totalInvestment,
        record.grossProfit,
        record.commission,
        record.netProfit,
        record.roi.toFixed(2),
        `"${record.notes || ''}"`
      ].join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Add search functionality
  document.addEventListener('input', function(e) {
    if (e.target.id === 'searchFilter' || e.target.id === 'dateFilter') {
      renderTradingRecords();
    }
  });
})();

