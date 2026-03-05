// Dental Intelligence Surcharging ROI Calculator
// For existing DI customers — focused on processing fee savings

// ── URL Parameter Pre-fill ──────────────────────────────────────────────────

function prefillFromURLParams() {
    const urlParams = new URLSearchParams(window.location.search);

    // Visible input fields
    const visibleMap = {
        'volume':      'monthlyVolume',
        'cc_percent':  'creditCardPercentage'
    };

    Object.keys(visibleMap).forEach(param => {
        const value = urlParams.get(param);
        if (value === null) return;
        const el = document.getElementById(visibleMap[param]);
        if (!el) return;
        if (param === 'volume') {
            const num = parseFloat(value.replace(/,/g, ''));
            el.value = isNaN(num) ? '' : num.toLocaleString('en-US');
        } else {
            el.value = value;
        }
    });

    // Hidden fields — current_rate and di_cost are set via URL but never shown to the customer
    const hiddenMap = { 'current_rate': 'currentRate', 'di_cost': 'diCost' };
    Object.keys(hiddenMap).forEach(param => {
        const value = urlParams.get(param);
        if (value !== null) {
            const el = document.getElementById(hiddenMap[param]);
            if (el) el.value = value;
        }
    });

    // Practice name — personalizes "Your" / "You" throughout the page
    const practiceName = urlParams.get('practice');
    if (practiceName) {
        const makePossessive = (name) =>
            name.endsWith('s') ? name + "'" : name + "'s";

        const titleEl  = document.getElementById('practiceNameTitle');
        const headerEl = document.getElementById('practiceNameHeader');
        const annualEl = document.getElementById('practiceNameAnnual');
        if (titleEl)  titleEl.textContent  = practiceName;
        if (headerEl) headerEl.textContent = makePossessive(practiceName);
        if (annualEl) annualEl.textContent  = practiceName;
    }
}

// ── Formatting Helpers ──────────────────────────────────────────────────────

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatCurrencyDecimal(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// ── ROI Claim Builder ───────────────────────────────────────────────────────

function buildROIClaim(monthlySavings, diCost) {
    if (diCost > 0) {
        const months = monthlySavings / diCost;
        if (months >= 1) {
            const rounded = Math.floor(months);
            if (rounded === 1) {
                return `Your monthly savings <span>more than cover your entire Dental Intelligence subscription</span> — Dental Intelligence is essentially paying for itself.`;
            }
            return `Just <em>one month</em> of surcharging covers <span>${rounded} months of your Dental Intelligence subscription</span>.`;
        }
    }
    // Fallback: no di_cost provided, or savings < 1 month of subscription
    return `That's meaningful savings that go straight to your practice's bottom line — every single month.`;
}

// ── Main Calculation ────────────────────────────────────────────────────────

function calculateROI() {
    const monthlyVolumeInput        = document.getElementById('monthlyVolume');
    const creditCardPercentageInput = document.getElementById('creditCardPercentage');
    const currentRateInput          = document.getElementById('currentRate');
    const diCostInput               = document.getElementById('diCost');

    const monthlyVolume        = parseFloat((monthlyVolumeInput.value || monthlyVolumeInput.placeholder).replace(/,/g, '')) || 0;
    const creditCardPercentage = parseFloat(creditCardPercentageInput.value || creditCardPercentageInput.placeholder) || 0;
    const currentRate          = parseFloat(currentRateInput.value) || 2.79;
    const diCost               = parseFloat((diCostInput.value || '0').replace(/,/g, '')) || 0;

    if (monthlyVolume <= 0) {
        alert('Please enter a valid monthly processing volume.');
        return;
    }

    const creditCardVolume    = monthlyVolume * (creditCardPercentage / 100);
    const surchargeCollected  = creditCardVolume * 0.03;
    const grossedVolume       = monthlyVolume + surchargeCollected;

    // ── BEFORE ──
    const currentProcessingCost = monthlyVolume * (currentRate / 100);

    // ── AFTER ──
    // Excel formula: =(H*2.913% - (K*1.03)*2.913%) / (H+(K*3%))
    const feesWithSurcharging = (monthlyVolume * 0.02913) - (creditCardVolume * 1.03 * 0.02913);
    const effectiveRateAfter  = (feesWithSurcharging / grossedVolume) * 100;

    // ── Savings ──
    const monthlySavings = currentProcessingCost - feesWithSurcharging;
    const annualSavings  = monthlySavings * 12;

    updateResults({
        currentProcessingCost,
        currentRate,
        feesWithSurcharging,
        effectiveRateAfter,
        monthlySavings,
        annualSavings,
        diCost
    });

    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ── Update Results in the DOM ───────────────────────────────────────────────

function updateResults(data) {
    const {
        currentProcessingCost, currentRate,
        feesWithSurcharging, effectiveRateAfter,
        monthlySavings, annualSavings, diCost
    } = data;

    // Before column
    setText('bfProcessing', formatCurrencyDecimal(currentProcessingCost));
    setText('bfRate',       currentRate.toFixed(2) + '%');
    setText('bfTotal',      formatCurrency(currentProcessingCost * 12));

    // After column
    setText('afProcessing', formatCurrencyDecimal(feesWithSurcharging));
    setText('afRate',       effectiveRateAfter.toFixed(2) + '%');
    setText('afTotal',      formatCurrency(feesWithSurcharging * 12));

    // Savings banner — set immediately, then animate over them
    setText('monthlySavings', formatCurrencyDecimal(monthlySavings));
    setText('annualSavings',  formatCurrencyDecimal(annualSavings));
    animateValue('annualSavings',  0, annualSavings,  1500);
    animateValue('monthlySavings', 0, monthlySavings, 1000);

    // Months of DI covered — only show third stat if di_cost was provided
    const diStatBlock   = document.getElementById('diStatBlock');
const diStatDivider = document.getElementById('diStatDivider');
const statRow       = document.querySelector('.savings-stat-row');

if (diCost > 0) {
    const monthsCovered = (monthlySavings / diCost).toFixed(1);
    setText('diMonthsCovered', monthsCovered + 'x');
    if (diStatBlock)   diStatBlock.style.display   = '';
    if (diStatDivider) diStatDivider.style.display = '';
    if (statRow) statRow.style.gridTemplateColumns = '1fr 1px 1fr 1px 1fr';
} else {
    if (diStatBlock)   diStatBlock.style.display   = 'none';
    if (diStatDivider) diStatDivider.style.display = 'none';
    if (statRow) statRow.style.gridTemplateColumns = '1fr 1px 1fr';
}

    // Dynamic ROI claim
    const roiEl = document.getElementById('roiClaimText');
    if (roiEl) roiEl.innerHTML = buildROIClaim(monthlySavings, diCost);
}

// ── Animate Number Count-up ─────────────────────────────────────────────────

function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const range     = end - start;
    const increment = range / (duration / 16); // target ~60fps
    let current     = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = formatCurrencyDecimal(current);
    }, 16);
}

// ── Utility ─────────────────────────────────────────────────────────────────

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Event Listeners ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Pre-fill from URL parameters
    prefillFromURLParams();

    // Enter key triggers calculation on any visible input
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calculateROI();
        });
    });

    // Clamp credit card percentage to 0–100
    const ccInput = document.getElementById('creditCardPercentage');
    if (ccInput) {
        ccInput.addEventListener('blur', () => {
            let v = parseFloat(ccInput.value);
            if (isNaN(v) || v < 0) v = 0;
            if (v > 100) v = 100;
            ccInput.value = v;
        });
    }

    // Format monthly volume with commas on blur
    const volumeInput = document.getElementById('monthlyVolume');
    if (volumeInput) {
        volumeInput.addEventListener('blur', () => {
            let v = parseFloat(volumeInput.value.replace(/,/g, ''));
            if (isNaN(v) || v < 0) v = 0;
            volumeInput.value = v.toLocaleString('en-US');
        });
    }
});
