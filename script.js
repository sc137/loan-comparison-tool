// Theme handling
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', 
        theme === 'dark' ? '#1a1a1a' : '#f5f7fa'
    );
}

function initTheme() {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme(prefersDark ? 'dark' : 'light');
    }
}

// Theme toggle button handler
document.getElementById('theme-toggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// Initialize theme on page load
initTheme();

const HISTORY_STORAGE_KEY = 'loanHistoryEntries';
const historyToggle = document.getElementById('history-toggle');
const historyDropdown = document.getElementById('history-dropdown');
const historyList = document.getElementById('history-list');
const historyCount = document.getElementById('history-count');
const historyClose = document.getElementById('history-close');

function getHistoryEntries() {
    try {
        const stored = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY));
        return Array.isArray(stored) ? stored : [];
    } catch (error) {
        return [];
    }
}

function saveHistoryEntries(entries) {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
}

function formatSavedDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function buildHistoryListItems(values) {
    return values.map(({ label, value }) => `
        <li>
            <span>${label}</span>
            <span>${value}</span>
        </li>
    `).join('');
}

function renderHistory() {
    const entries = getHistoryEntries();
    historyCount.textContent = entries.length;

    if (!entries.length) {
        historyList.innerHTML = '<p class="history-empty">No saved comparisons yet.</p>';
        return;
    }

    historyList.innerHTML = entries.map(entry => `
        <article class="history-item">
            <h5>${entry.type} Loan</h5>
            <time datetime="${entry.savedAt}">${formatSavedDate(entry.savedAt)}</time>
            ${entry.terms.map(term => `
                <div class="history-term">
                    <p class="history-term-title">${term.label}</p>
                    <ul>
                        ${buildHistoryListItems(term.values)}
                    </ul>
                </div>
            `).join('')}
            <button class="history-remove" type="button" data-entry-id="${entry.id}">Remove</button>
        </article>
    `).join('');
}

function addHistoryEntry(entry) {
    const entries = getHistoryEntries();
    entries.unshift(entry);
    saveHistoryEntries(entries);
    renderHistory();
}

function removeHistoryEntry(entryId) {
    const entries = getHistoryEntries().filter(entry => entry.id !== entryId);
    saveHistoryEntries(entries);
    renderHistory();
}

function openHistoryMenu() {
    historyDropdown.classList.add('open');
    historyToggle.setAttribute('aria-expanded', 'true');
    historyDropdown.setAttribute('aria-hidden', 'false');
}

function closeHistoryMenu() {
    historyDropdown.classList.remove('open');
    historyToggle.setAttribute('aria-expanded', 'false');
    historyDropdown.setAttribute('aria-hidden', 'true');
}

historyToggle.addEventListener('click', () => {
    if (historyDropdown.classList.contains('open')) {
        closeHistoryMenu();
        return;
    }
    openHistoryMenu();
});

historyClose.addEventListener('click', closeHistoryMenu);

document.addEventListener('click', (event) => {
    if (!historyDropdown.classList.contains('open')) {
        return;
    }
    if (!historyDropdown.contains(event.target) && !historyToggle.contains(event.target)) {
        closeHistoryMenu();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && historyDropdown.classList.contains('open')) {
        closeHistoryMenu();
    }
});

historyList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.history-remove');
    if (!removeButton) {
        return;
    }
    removeHistoryEntry(removeButton.dataset.entryId);
});

renderHistory();

// Tab switching functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and sections
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.calculator-section').forEach(section => section.classList.remove('active'));
        
        // Add active class to clicked button and corresponding section
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(`${tabId}-calculator`).classList.add('active');
    });
});

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Calculate monthly mortgage payment
function calculateMortgage(principal, rate, years) {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = years * 12;
    
    // Handle edge case where rate is 0
    if (rate === 0) {
        return principal / numberOfPayments;
    }
    
    const monthlyPayment = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return monthlyPayment;
}

// Calculate monthly interest payment
function calculateMonthlyInterest(principal, rate) {
    return (principal * (rate / 100)) / 12;
}

// Calculate total interest paid
function calculateTotalInterest(monthlyPayment, principal, years) {
    const totalPaid = monthlyPayment * years * 12;
    return totalPaid - principal;
}

// Function to scroll to and highlight results
function scrollToResults(formId) {
    const resultsSection = document.querySelector(`#${formId} .results`);
    if (resultsSection) {
        // Add highlight class
        resultsSection.classList.add('highlight');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Remove highlight class after animation
        setTimeout(() => {
            resultsSection.classList.remove('highlight');
        }, 2000);
    }
}

// Handle mortgage form submission
document.getElementById('mortgage-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get input values with default to 0 for empty fields
    const homePrice = parseFloat(document.getElementById('home-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const rate = parseFloat(document.getElementById('mortgage-rate').value);
    const propertyTax = parseFloat(document.getElementById('property-tax').value) || 0;
    const homeInsurance = parseFloat(document.getElementById('home-insurance').value) || 0;
    const savedAt = new Date().toISOString();
    
    // Calculate loan amount
    const principal = homePrice - downPayment;
    
    // Calculate for each term
    const terms = [15, 30];
    const mortgageHistoryTerms = [];
    terms.forEach(term => {
        // Calculate monthly payments
        const monthlyPrincipalAndInterest = calculateMortgage(principal, rate, term);
        const monthlyTax = propertyTax;
        const monthlyInsurance = homeInsurance;
        const totalMonthlyPayment = monthlyPrincipalAndInterest + monthlyTax + monthlyInsurance;
        
        // Calculate monthly interest and principal
        const monthlyInterest = calculateMonthlyInterest(principal, rate);
        const monthlyPrincipal = monthlyPrincipalAndInterest - monthlyInterest;
        
        // Calculate total interest and cost
        const totalInterest = calculateTotalInterest(monthlyPrincipalAndInterest, principal, term);
        const totalCost = principal + totalInterest;
        
        // Update results for this term
        document.getElementById(`mortgage-amount-financed-${term}`).textContent = formatCurrency(principal);
        document.getElementById(`mortgage-monthly-payment-${term}`).textContent = formatCurrency(monthlyPrincipalAndInterest);
        document.getElementById(`mortgage-monthly-interest-${term}`).textContent = formatCurrency(monthlyInterest);
        document.getElementById(`mortgage-monthly-principal-${term}`).textContent = formatCurrency(monthlyPrincipal);
        document.getElementById(`mortgage-monthly-tax-${term}`).textContent = formatCurrency(monthlyTax);
        document.getElementById(`mortgage-monthly-insurance-${term}`).textContent = formatCurrency(monthlyInsurance);
        document.getElementById(`mortgage-total-monthly-${term}`).textContent = formatCurrency(totalMonthlyPayment);
        document.getElementById(`mortgage-total-interest-${term}`).textContent = formatCurrency(totalInterest);
        document.getElementById(`mortgage-total-cost-${term}`).textContent = formatCurrency(totalCost);

        mortgageHistoryTerms.push({
            label: `${term} Year Term`,
            values: [
                { label: 'Amount Financed', value: formatCurrency(principal) },
                { label: 'Monthly Principal & Interest', value: formatCurrency(monthlyPrincipalAndInterest) },
                { label: 'Monthly Interest', value: formatCurrency(monthlyInterest) },
                { label: 'Monthly Principal', value: formatCurrency(monthlyPrincipal) },
                { label: 'Monthly Tax', value: formatCurrency(monthlyTax) },
                { label: 'Monthly Insurance', value: formatCurrency(monthlyInsurance) },
                { label: 'Total Monthly Payment', value: formatCurrency(totalMonthlyPayment) },
                { label: 'Total Interest Paid', value: formatCurrency(totalInterest) },
                { label: 'Total Cost of Loan', value: formatCurrency(totalCost) }
            ]
        });
    });

    // Show and scroll to results
    const resultsSection = document.getElementById('mortgage-results');
    resultsSection.classList.add('visible');
    scrollToResults('mortgage-calculator');

    addHistoryEntry({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: 'Mortgage',
        savedAt,
        terms: mortgageHistoryTerms
    });
});

// Handle auto loan form submission
document.getElementById('auto-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get input values with default to 0 for empty fields
    const vehiclePrice = parseFloat(document.getElementById('vehicle-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('auto-down-payment').value) || 0;
    const tradeIn = parseFloat(document.getElementById('trade-in').value) || 0;
    const rate = parseFloat(document.getElementById('auto-rate').value);
    const savedAt = new Date().toISOString();
    
    // Calculate loan amount
    const principal = vehiclePrice - downPayment - tradeIn;
    
    // Calculate for each term
    const terms = [48, 60, 72];
    const autoHistoryTerms = [];
    terms.forEach(term => {
        const years = term / 12;
        const monthlyPayment = calculateMortgage(principal, rate, years);
        const totalInterest = calculateTotalInterest(monthlyPayment, principal, years);
        const totalCost = principal + totalInterest;
        
        // Update results for this term
        document.getElementById(`auto-monthly-payment-${term}`).textContent = formatCurrency(monthlyPayment);
        document.getElementById(`auto-total-interest-${term}`).textContent = formatCurrency(totalInterest);
        document.getElementById(`auto-total-cost-${term}`).textContent = formatCurrency(totalCost);

        autoHistoryTerms.push({
            label: `${term} Month Term`,
            values: [
                { label: 'Monthly Payment', value: formatCurrency(monthlyPayment) },
                { label: 'Total Interest Paid', value: formatCurrency(totalInterest) },
                { label: 'Total Cost of Loan', value: formatCurrency(totalCost) }
            ]
        });
    });

    // Show and scroll to results
    const resultsSection = document.getElementById('auto-results');
    resultsSection.classList.add('visible');
    scrollToResults('auto-calculator');

    addHistoryEntry({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: 'Auto',
        savedAt,
        terms: autoHistoryTerms
    });
});

// Add input validation for non-interest rate number inputs
document.querySelectorAll('input[data-allow-decimal], input[type="number"]').forEach(input => {
    input.addEventListener('input', function() {
        const stepValue = this.getAttribute('step');
        const stepAllowsDecimal = stepValue && stepValue !== 'any' && stepValue.includes('.');
        const allowsDecimal = this.dataset.allowDecimal === 'true' || stepAllowsDecimal || this.inputMode === 'decimal';
        const decimalPlaces = stepAllowsDecimal ? (stepValue.split('.')[1] || '').length : 2;

        if (allowsDecimal) {
            let sanitized = this.value.replace(/[^0-9.]/g, '');
            const parts = sanitized.split('.');
            if (parts.length > 2) {
                sanitized = `${parts[0]}.${parts.slice(1).join('')}`;
            }
            if (sanitized.includes('.')) {
                const [whole, fraction = ''] = sanitized.split('.');
                this.value = `${whole}.${fraction.slice(0, decimalPlaces)}`;
                return;
            }
            this.value = sanitized;
            return;
        }

        // Only allow whole numbers
        this.value = this.value.replace(/[^\d]/g, '');
    });
});

// Function to reset all forms and results
function resetAllForms() {
    // Reset mortgage form
    document.getElementById('mortgage-form').reset();
    const mortgageResults = document.getElementById('mortgage-results');
    mortgageResults.classList.remove('visible');
    const mortgageResultSpans = mortgageResults.querySelectorAll('span[id^="mortgage-"]');
    mortgageResultSpans.forEach(span => {
        span.textContent = span.id.includes('amount-financed') ? '$0.00' : 
                          span.id.includes('term-months') ? '0' : '$0.00';
    });

    // Reset auto form
    document.getElementById('auto-form').reset();
    const autoResults = document.getElementById('auto-results');
    autoResults.classList.remove('visible');
    const autoResultSpans = autoResults.querySelectorAll('span[id^="auto-"]');
    autoResultSpans.forEach(span => {
        span.textContent = '$0.00';
    });
}

// Add event listener for reset button
document.getElementById('reset-button').addEventListener('click', resetAllForms);
