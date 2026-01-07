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
    
    // Calculate loan amount
    const principal = homePrice - downPayment;
    
    // Calculate for each term
    const terms = [15, 30];
    terms.forEach(term => {
        // Calculate monthly payments
        const monthlyPrincipalAndInterest = calculateMortgage(principal, rate, term);
        const monthlyTax = propertyTax / 12;
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
    });

    // Show and scroll to results
    const resultsSection = document.getElementById('mortgage-results');
    resultsSection.classList.add('visible');
    scrollToResults('mortgage-calculator');
});

// Handle auto loan form submission
document.getElementById('auto-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get input values with default to 0 for empty fields
    const vehiclePrice = parseFloat(document.getElementById('vehicle-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('auto-down-payment').value) || 0;
    const tradeIn = parseFloat(document.getElementById('trade-in').value) || 0;
    const rate = parseFloat(document.getElementById('auto-rate').value);
    
    // Calculate loan amount
    const principal = vehiclePrice - downPayment - tradeIn;
    
    // Calculate for each term
    const terms = [48, 60, 72];
    terms.forEach(term => {
        const years = term / 12;
        const monthlyPayment = calculateMortgage(principal, rate, years);
        const totalInterest = calculateTotalInterest(monthlyPayment, principal, years);
        const totalCost = principal + totalInterest;
        
        // Update results for this term
        document.getElementById(`auto-monthly-payment-${term}`).textContent = formatCurrency(monthlyPayment);
        document.getElementById(`auto-total-interest-${term}`).textContent = formatCurrency(totalInterest);
        document.getElementById(`auto-total-cost-${term}`).textContent = formatCurrency(totalCost);
    });

    // Show and scroll to results
    const resultsSection = document.getElementById('auto-results');
    resultsSection.classList.add('visible');
    scrollToResults('auto-calculator');
});

// Add input validation for non-interest rate number inputs
document.querySelectorAll('input[type="number"]').forEach(input => {
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
