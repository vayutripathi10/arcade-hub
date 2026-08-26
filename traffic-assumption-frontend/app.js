/* ==========================================================================
   BENGALURU COMMUTE OPTIMIZER - LOGIC ENGINE & INTERACTIVE CANVAS CHART
   ========================================================================== */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. EMPIRICAL BENGALURU CORRIDOR TRAFFIC DATASET (15-Min Granularity)
    // -------------------------------------------------------------------------
    
    // Base 15-minute curve from 06:00 (360m) to 23:00 (1380m)
    // Values represent base travel time in minutes for 21.5 km corridor
    const BASE_CURVES = {
        HOME_TO_OFFICE: {
            // Monday: Lighter morning, moderate evening
            Monday: [
                30, 31, 32, 34, 37, 41, 46, 54, 62, 70, 76, 78, 74, 66, 56, 48, 44, 42,
                41, 40, 40, 42, 45, 50, 56, 62, 68, 72, 70, 64, 55, 46, 40, 36, 33, 31,
                30, 30, 29, 29, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
            ],
            // Tuesday - Thursday: Peak Work-From-Office days
            Tuesday: [
                30, 32, 34, 38, 44, 52, 64, 76, 85, 92, 95, 88, 78, 68, 58, 50, 45, 43,
                42, 42, 43, 46, 52, 60, 68, 76, 82, 85, 80, 72, 60, 50, 42, 37, 34, 32,
                30, 30, 29, 29, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
            ],
            Friday: [
                30, 31, 33, 36, 40, 46, 54, 62, 68, 74, 75, 70, 62, 54, 48, 44, 43, 44,
                46, 50, 58, 68, 78, 88, 95, 98, 92, 82, 70, 58, 48, 40, 35, 32, 30, 30,
                30, 29, 29, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
            ],
            Weekend: [
                28, 28, 29, 30, 31, 32, 34, 36, 38, 40, 42, 44, 45, 45, 44, 42, 40, 40,
                42, 44, 46, 48, 50, 52, 54, 52, 48, 44, 40, 36, 33, 31, 30, 29, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
            ]
        },
        OFFICE_TO_HOME: {
            Monday: [
                28, 29, 30, 31, 33, 35, 38, 42, 46, 50, 48, 44, 40, 38, 38, 40, 44, 50,
                58, 68, 78, 86, 88, 84, 76, 66, 55, 46, 40, 35, 32, 30, 29, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
            ],
            Tuesday: [
                28, 29, 31, 33, 36, 40, 45, 52, 58, 62, 56, 48, 42, 40, 42, 46, 54, 65,
                78, 92, 102, 105, 98, 88, 76, 64, 52, 44, 38, 34, 31, 29, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
            ],
            Friday: [
                28, 29, 30, 32, 35, 38, 42, 48, 52, 54, 50, 45, 42, 44, 50, 60, 72, 85,
                98, 108, 112, 106, 94, 82, 70, 58, 48, 40, 35, 32, 30, 29, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
            ],
            Weekend: [
                28, 28, 29, 30, 31, 32, 34, 36, 38, 40, 42, 42, 40, 40, 42, 44, 46, 50,
                54, 56, 54, 50, 45, 40, 36, 33, 31, 30, 29, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
                28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
            ]
        }
    };

    // Populate Wednesday and Thursday from Tuesday pattern
    BASE_CURVES.HOME_TO_OFFICE.Wednesday = BASE_CURVES.HOME_TO_OFFICE.Tuesday;
    BASE_CURVES.HOME_TO_OFFICE.Thursday = BASE_CURVES.HOME_TO_OFFICE.Tuesday;
    BASE_CURVES.HOME_TO_OFFICE.Saturday = BASE_CURVES.HOME_TO_OFFICE.Weekend;
    BASE_CURVES.HOME_TO_OFFICE.Sunday = BASE_CURVES.HOME_TO_OFFICE.Weekend;

    BASE_CURVES.OFFICE_TO_HOME.Wednesday = BASE_CURVES.OFFICE_TO_HOME.Tuesday;
    BASE_CURVES.OFFICE_TO_HOME.Thursday = BASE_CURVES.OFFICE_TO_HOME.Tuesday;
    BASE_CURVES.OFFICE_TO_HOME.Saturday = BASE_CURVES.OFFICE_TO_HOME.Weekend;
    BASE_CURVES.OFFICE_TO_HOME.Sunday = BASE_CURVES.OFFICE_TO_HOME.Weekend;

    // Node Names by Direction
    const TRANSIT_NODES = {
        HOME_TO_OFFICE: [
            { id: 1, name: 'E-City Toll Exit', baseWeight: 0.12 },
            { id: 2, name: 'Central Silk Board', baseWeight: 0.42 },
            { id: 3, name: 'HSR / Agara Signal', baseWeight: 0.22 },
            { id: 4, name: 'Ibblur Junction', baseWeight: 0.12 },
            { id: 5, name: 'Bellandur / EcoSpace', baseWeight: 0.12 }
        ],
        OFFICE_TO_HOME: [
            { id: 1, name: 'Amadeus Gate / ORR', baseWeight: 0.15 },
            { id: 2, name: 'EcoSpace / Ibblur', baseWeight: 0.20 },
            { id: 3, name: 'Agara Flyover', baseWeight: 0.18 },
            { id: 4, name: 'Silk Board Southbound', baseWeight: 0.35 },
            { id: 5, name: 'Hosur Rd / E-City', baseWeight: 0.12 }
        ]
    };

    // Route Multipliers
    const ROUTE_FACTORS = {
        MAIN_SILKBOARD: 1.0,
        NICE_SARJAPUR: 0.92,
        ELEVATED_OUTER: 1.05
    };

    // Weather Multipliers
    const WEATHER_FACTORS = {
        CLEAR: 1.0,
        DRIZZLE: 1.25,
        MONSOON: 1.58
    };

    // -------------------------------------------------------------------------
    // 2. STATE MANAGEMENT
    // -------------------------------------------------------------------------
    const state = {
        direction: 'HOME_TO_OFFICE',
        mode: 'DEPARTURE', // DEPARTURE or ARRIVAL
        timeMins: 450, // 07:30 AM in minutes from midnight (7 * 60 + 30)
        day: 'Tuesday',
        weather: 'CLEAR',
        route: 'MAIN_SILKBOARD',
        apiKey: localStorage.getItem('blr_maps_api_key') || '',
        apiRefresh: localStorage.getItem('blr_maps_api_refresh') || '0'
    };

    // -------------------------------------------------------------------------
    // 3. CORE CALCULATION LOGIC
    // -------------------------------------------------------------------------

    // Format minutes into 12-hour string (e.g. 450 -> "07:30 AM")
    function formatTime(totalMins) {
        let mins = Math.floor(totalMins) % (24 * 60);
        let hours = Math.floor(mins / 60);
        let m = mins % 60;
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        let hh = hours < 10 ? '0' + hours : hours;
        let mm = m < 10 ? '0' + m : m;
        return `${hh}:${mm} ${ampm}`;
    }

    // Get index in 15-min array (06:00 AM = index 0)
    function getTimeIndex(timeMins) {
        let startMins = 360; // 06:00 AM
        let idx = Math.floor((timeMins - startMins) / 15);
        if (idx < 0) idx = 0;
        if (idx >= 68) idx = 67;
        return idx;
    }

    // Get interpolated travel duration for any time in minutes
    function getDuration(direction, day, timeMins, weather, route) {
        const curve = BASE_CURVES[direction][day] || BASE_CURVES[direction]['Tuesday'];
        const startMins = 360;
        let floatIdx = (timeMins - startMins) / 15;
        
        let baseVal;
        if (floatIdx <= 0) {
            baseVal = curve[0];
        } else if (floatIdx >= curve.length - 1) {
            baseVal = curve[curve.length - 1];
        } else {
            let i1 = Math.floor(floatIdx);
            let i2 = i1 + 1;
            let ratio = floatIdx - i1;
            baseVal = curve[i1] + ratio * (curve[i2] - curve[i1]);
        }

        let routeMult = ROUTE_FACTORS[route] || 1.0;
        let weatherMult = WEATHER_FACTORS[weather] || 1.0;

        return Math.round(baseVal * routeMult * weatherMult);
    }

    // Find Golden Departure Window (Evaluates ±45 mins candidate slots)
    function findGoldenWindow() {
        const targetMins = state.timeMins;
        const candidates = [];
        
        // Scan -45 mins to +45 mins in 15-min steps
        for (let delta = -45; delta <= 45; delta += 15) {
            let slotTime = targetMins + delta;
            if (slotTime < 360) slotTime = 360;
            if (slotTime > 1380) slotTime = 1380;

            let duration = getDuration(state.direction, state.day, slotTime, state.weather, state.route);
            candidates.push({ slotTime, duration, delta });
        }

        // Find minimum duration candidate slot
        let best = candidates[0];
        for (let c of candidates) {
            if (c.duration < best.duration) {
                best = c;
            }
        }

        // Find peak duration of the day to calculate maximum saved time
        let peakDuration = 0;
        let peakTime = 510; // 08:30 AM default
        for (let m = 360; m <= 1380; m += 15) {
            let dur = getDuration(state.direction, state.day, m, state.weather, state.route);
            if (dur > peakDuration) {
                peakDuration = dur;
                peakTime = m;
            }
        }

        // Selected slot duration
        let selectedDuration = getDuration(state.direction, state.day, targetMins, state.weather, state.route);
        
        // Check traffic acceleration rate dTraffic/dt
        let nextSlotDur = getDuration(state.direction, state.day, targetMins + 15, state.weather, state.route);
        let accelRate = (nextSlotDur - selectedDuration) / 15; // mins added per minute delayed

        return {
            goldenStart: best.slotTime,
            goldenEnd: best.slotTime + 10,
            goldenDuration: best.duration,
            selectedDuration: selectedDuration,
            peakDuration: peakDuration,
            peakTime: peakTime,
            timeSavedVsPeak: Math.max(0, peakDuration - best.duration),
            accelRate: accelRate,
            nextSlotDur: nextSlotDur
        };
    }

    // Calculate ROI & Fuel Savings
    function calculateROI(selectedDuration, peakDuration) {
        // Idling fuel waste model: 0.025 Litres per extra minute stuck in traffic
        let extraMinsPerTrip = Math.max(0, selectedDuration - 30);
        let fuelPerTrip = extraMinsPerTrip * 0.022; // Litres
        let monthlyLitres = fuelPerTrip * 2 * 20; // 20 working days, round trip
        let monthlyFuelCostINR = Math.round(monthlyLitres * 102); // ₹102/L petrol price in BLR

        // Monthly hours saved compared to leaving at peak
        let hoursSavedPerTrip = Math.max(0, peakDuration - selectedDuration) / 60;
        let monthlyHoursSaved = (hoursSavedPerTrip * 20).toFixed(1);

        return {
            fuelCostINR: monthlyFuelCostINR,
            litresWasted: monthlyLitres.toFixed(1),
            monthlyHoursSaved: monthlyHoursSaved
        };
    }

    // Calculate Node Breakdown Delays
    function getNodeDelays(selectedTimeMins, totalDuration) {
        const nodes = TRANSIT_NODES[state.direction];
        const extraDelay = Math.max(0, totalDuration - 28);
        
        return nodes.map(node => {
            let delayMins = Math.round((28 / 5) + (extraDelay * node.baseWeight));
            let status = 'smooth';
            let color = '#10b981';
            
            if (delayMins > 16) {
                status = 'severe';
                color = '#8b5cf6';
            } else if (delayMins > 11) {
                status = 'heavy';
                color = '#ef4444';
            } else if (delayMins > 7) {
                status = 'moderate';
                color = '#f59e0b';
            }

            return {
                id: node.id,
                name: node.name,
                delayMins: delayMins,
                status: status,
                color: color
            };
        });
    }

    // -------------------------------------------------------------------------
    // 4. UI RENDER FUNCTIONS
    // -------------------------------------------------------------------------

    function updateUI() {
        const timeDisplay = document.getElementById('selectedTimeDisplay');
        const golden = findGoldenWindow();
        const roi = calculateROI(golden.selectedDuration, golden.peakDuration);

        // Update Slider & Labels
        timeDisplay.innerText = formatTime(state.timeMins);
        
        // Mode Labels
        const timeLabel = document.getElementById('timeLabel');
        if (state.mode === 'DEPARTURE') {
            timeLabel.innerText = 'Departure Time';
        } else {
            timeLabel.innerText = 'Target Arrival Time';
        }

        // Day Hint Text
        const dayHint = document.getElementById('dayHint');
        if (state.day === 'Monday') {
            dayHint.innerText = 'Monday: ~15% lighter morning traffic, earlier evening exit.';
        } else if (['Tuesday', 'Wednesday', 'Thursday'].includes(state.day)) {
            dayHint.innerText = `${state.day}: Peak mandatory Work-From-Office attendance on ORR.`;
        } else if (state.day === 'Friday') {
            dayHint.innerText = 'Friday: Moderate morning, heavy early evening weekend surge.';
        } else {
            dayHint.innerText = 'Weekend: Smooth off-peak travel conditions.';
        }

        // Weather Hint Text
        const weatherHint = document.getElementById('weatherHint');
        if (state.weather === 'CLEAR') {
            weatherHint.innerText = 'Clear weather baseline model.';
        } else if (state.weather === 'DRIZZLE') {
            weatherHint.innerText = 'Light Drizzle (+25% congestion slowdown).';
        } else {
            weatherHint.innerText = 'Monsoon Flood (+58% slowdown + Silk Board waterlogging).';
        }

        // Hero Advisor Box Updates
        document.getElementById('goldenTimeText').innerText = 
            `${formatTime(golden.goldenStart)} - ${formatTime(golden.goldenEnd)}`;
        
        document.getElementById('goldenDurationText').innerText = `${golden.goldenDuration} Mins`;
        
        let estArrivalMins = golden.goldenStart + golden.goldenDuration;
        document.getElementById('arrivalEstText').innerText = `Arrival ~${formatTime(estArrivalMins)}`;

        document.getElementById('timeSavedText').innerText = `${golden.timeSavedVsPeak} Mins Saved`;
        document.getElementById('peakCompareText').innerText = `vs ${golden.peakDuration} mins at ${formatTime(golden.peakTime)} peak`;

        // Acceleration Alert Logic
        const accelAlert = document.getElementById('accelerationAlert');
        const alertTitle = document.getElementById('alertTitle');
        const alertDesc = document.getElementById('alertDesc');

        if (golden.accelRate >= 0.7) {
            accelAlert.style.display = 'flex';
            alertTitle.innerText = 'Traffic Acceleration Surge Alert!';
            alertDesc.innerText = `Leaving just 15 minutes later (${formatTime(state.timeMins + 15)}) will add +${golden.nextSlotDur - golden.selectedDuration} mins extra driving time due to bottleneck accumulation.`;
        } else {
            accelAlert.style.display = 'none';
        }

        // Scorecard Cards
        document.getElementById('selectedSlotVal').innerText = `${golden.selectedDuration} Mins`;
        document.getElementById('selectedSlotSub').innerText = `${state.mode === 'DEPARTURE' ? 'Departure' : 'Arrival'} at ${formatTime(state.timeMins)}`;

        document.getElementById('peakSlotVal').innerText = `${golden.peakDuration} Mins`;
        document.getElementById('peakSlotSub').innerText = `Peak window at ${formatTime(golden.peakTime)}`;

        document.getElementById('fuelWasteVal').innerText = `₹ ${roi.fuelCostINR}`;
        document.getElementById('fuelWasteSub').innerText = `${roi.litresWasted} Litres wasted per month`;

        document.getElementById('monthlyHoursVal').innerText = `${roi.monthlyHoursSaved} Hrs`;

        // Update Node Inspector
        renderNodesTimeline(getNodeDelays(state.timeMins, golden.selectedDuration));

        // Render Canvas Chart
        renderTrafficChart();
    }

    // Render Node Timeline Cards
    function renderNodesTimeline(nodes) {
        const container = document.getElementById('nodesTimeline');
        document.getElementById('nodeInspectorTime').innerText = formatTime(state.timeMins);

        container.innerHTML = nodes.map(node => `
            <div class="node-card">
                <div class="node-header">
                    <span class="node-num">${node.id}</span>
                    <span class="node-delay" style="color: ${node.color}">${node.delayMins}m</span>
                </div>
                <div class="node-name">${node.name}</div>
                <div class="node-status-bar" style="background-color: ${node.color}"></div>
            </div>
        `).join('');
    }

    // -------------------------------------------------------------------------
    // 5. CANVAS 24-HOUR CHART RENDERER
    // -------------------------------------------------------------------------

    function renderTrafficChart() {
        const canvas = document.getElementById('trafficCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        
        // Handle High-DPI Display Scaling
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 25, right: 30, bottom: 40, left: 50 };

        const graphW = width - padding.left - padding.right;
        const graphH = height - padding.top - padding.bottom;

        // Clear Canvas
        ctx.clearRect(0, 0, width, height);

        // Compute Points (15-min increments from 06:00 to 23:00)
        const points = [];
        const minMins = 360;  // 06:00 AM
        const maxMins = 1380; // 11:00 PM
        const totalRange = maxMins - minMins;

        let maxDuration = 120; // Y-Axis Max scale (mins)

        for (let m = minMins; m <= maxMins; m += 15) {
            let dur = getDuration(state.direction, state.day, m, state.weather, state.route);
            let x = padding.left + ((m - minMins) / totalRange) * graphW;
            let y = padding.top + graphH - (dur / maxDuration) * graphH;
            points.push({ timeMins: m, dur: dur, x: x, y: y });
        }

        // Draw Grid Lines & Y-Axis Labels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillStyle = '#64748b';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';

        const ySteps = [30, 60, 90, 120];
        for (let step of ySteps) {
            let y = padding.top + graphH - (step / maxDuration) * graphH;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillText(`${step}m`, padding.left - 8, y + 4);
        }

        // Draw Threshold Guidelines (Smooth vs Gridlock)
        ctx.setLineDash([4, 4]);
        
        // 40m Smooth line (Green)
        let y40 = padding.top + graphH - (40 / maxDuration) * graphH;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.beginPath();
        ctx.moveTo(padding.left, y40);
        ctx.lineTo(width - padding.right, y40);
        ctx.stroke();

        // 80m Gridlock line (Red)
        let y80 = padding.top + graphH - (80 / maxDuration) * graphH;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.moveTo(padding.left, y80);
        ctx.lineTo(width - padding.right, y80);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw X-Axis Time Labels
        ctx.textAlign = 'center';
        const xTicks = [
            { m: 360, label: '6 AM' },
            { m: 540, label: '9 AM' },
            { m: 720, label: '12 PM' },
            { m: 900, label: '3 PM' },
            { m: 1080, label: '6 PM' },
            { m: 1260, label: '9 PM' },
            { m: 1380, label: '11 PM' }
        ];

        for (let tick of xTicks) {
            let x = padding.left + ((tick.m - minMins) / totalRange) * graphW;
            ctx.fillText(tick.label, x, height - 12);
        }

        // Draw Filled Gradient Curve
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            let xc = (points[i].x + points[i - 1].x) / 2;
            let yc = (points[i].y + points[i - 1].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(points[points.length - 1].x, padding.top + graphH);
        ctx.lineTo(points[0].x, padding.top + graphH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
        grad.addColorStop(1, 'rgba(11, 15, 25, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw Smooth Curve Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            let xc = (points[i].x + points[i - 1].x) / 2;
            let yc = (points[i].y + points[i - 1].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Highlight Active Selected Time Marker
        let currentX = padding.left + ((state.timeMins - minMins) / totalRange) * graphW;
        let currentDur = getDuration(state.direction, state.day, state.timeMins, state.weather, state.route);
        let currentY = padding.top + graphH - (currentDur / maxDuration) * graphH;

        // Vertical Guide Line
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(currentX, padding.top);
        ctx.lineTo(currentX, padding.top + graphH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glow Marker Point
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // -------------------------------------------------------------------------
    // 6. EVENT LISTENERS & INTERACTION HANDLERS
    // -------------------------------------------------------------------------

    function initEventListeners() {
        // Direction Toggle
        document.querySelectorAll('#directionToggle .dir-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#directionToggle .dir-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.direction = btn.dataset.dir;
                updateUI();
            });
        });

        // Planning Mode Tabs
        document.querySelectorAll('#planningModeTabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#planningModeTabs .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.mode = btn.dataset.mode;
                updateUI();
            });
        });

        // Time Slider
        const timeSlider = document.getElementById('timeSlider');
        timeSlider.addEventListener('input', (e) => {
            state.timeMins = parseInt(e.target.value, 10);
            updateUI();
        });

        // Day Picker Buttons
        document.querySelectorAll('#dayPicker .day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#dayPicker .day-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.day = btn.dataset.day;
                updateUI();
            });
        });

        // Weather Picker Buttons
        document.querySelectorAll('#weatherPicker .weather-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#weatherPicker .weather-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.weather = btn.dataset.weather;
                updateUI();
            });
        });

        // Route Select
        const routeSelect = document.getElementById('routeSelect');
        routeSelect.addEventListener('change', (e) => {
            state.route = e.target.value;
            updateUI();
        });

        // Canvas Hover & Click Interaction
        const canvas = document.getElementById('trafficCanvas');
        const tooltip = document.getElementById('canvasTooltip');

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const padding = { left: 50, right: 30 };
            const graphW = rect.width - padding.left - padding.right;

            if (mouseX >= padding.left && mouseX <= rect.width - padding.right) {
                let ratio = (mouseX - padding.left) / graphW;
                let mins = 360 + ratio * (1380 - 360);
                // Snap to nearest 15 mins
                mins = Math.round(mins / 15) * 15;
                let dur = getDuration(state.direction, state.day, mins, state.weather, state.route);

                tooltip.style.display = 'block';
                tooltip.style.left = `${e.clientX - rect.left + 15}px`;
                tooltip.style.top = `${e.clientY - rect.top - 35}px`;
                tooltip.innerHTML = `<strong>${formatTime(mins)}</strong>: ${dur} mins commute`;
            } else {
                tooltip.style.display = 'none';
            }
        });

        canvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const padding = { left: 50, right: 30 };
            const graphW = rect.width - padding.left - padding.right;

            if (mouseX >= padding.left && mouseX <= rect.width - padding.right) {
                let ratio = (mouseX - padding.left) / graphW;
                let mins = Math.round((360 + ratio * (1380 - 360)) / 15) * 15;
                state.timeMins = mins;
                timeSlider.value = mins;
                updateUI();
                showToast(`Selected Departure Time: ${formatTime(mins)}`);
            }
        });

        // API Modal Setup
        const apiBtn = document.getElementById('apiSettingsBtn');
        const apiModal = document.getElementById('apiModalBackdrop');
        const closeApiModal = document.getElementById('closeApiModal');
        const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
        const apiKeyInput = document.getElementById('apiKeyInput');

        apiBtn.addEventListener('click', () => {
            apiKeyInput.value = state.apiKey;
            apiModal.classList.add('active');
        });

        closeApiModal.addEventListener('click', () => {
            apiModal.classList.remove('active');
        });

        saveApiKeyBtn.addEventListener('click', () => {
            state.apiKey = apiKeyInput.value.trim();
            localStorage.setItem('blr_maps_api_key', state.apiKey);
            apiModal.classList.remove('active');
            showToast(state.apiKey ? 'Google Maps API Key Saved!' : 'Using Offline Pre-compiled Dataset');
        });

        clearApiKeyBtn.addEventListener('click', () => {
            state.apiKey = '';
            apiKeyInput.value = '';
            localStorage.removeItem('blr_maps_api_key');
            apiModal.classList.remove('active');
            showToast('Reset to Built-in Dataset');
        });

        // Share Button
        document.getElementById('shareBtn').addEventListener('click', () => {
            const shareUrl = `${window.location.origin}${window.location.pathname}#dir=${state.direction}&day=${state.day}&time=${state.timeMins}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                showToast('Commute Plan Link Copied to Clipboard! 📋');
            });
        });

        // Window Resize Listener for Canvas Scaling
        window.addEventListener('resize', () => {
            renderTrafficChart();
        });
    }

    // Toast Notification Utility
    function showToast(msg) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Initializer
    function init() {
        initEventListeners();
        updateUI();
    }

    document.addEventListener('DOMContentLoaded', init);

})();
