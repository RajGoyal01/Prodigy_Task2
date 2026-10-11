/**
 * ==============================================================================
 * CHRONO-PRO — Precision Chronograph & Stopwatch Controller
 * Task-02: Prodigy InfoTech Full Stack Development
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* --------------------------------------------------------------------------
     1. DOM ELEMENT REFERENCES
     -------------------------------------------------------------------------- */
  // Display Readout
  const displayHours = document.getElementById('display-hours');
  const displayMinutes = document.getElementById('display-minutes');
  const displaySeconds = document.getElementById('display-seconds');
  const displayMs = document.getElementById('display-ms');
  const currentLapPreview = document.getElementById('current-lap-preview');
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');
  const chronoBezel = document.querySelector('.chrono-bezel');

  // SVG Dial Elements
  const sweepNeedleGroup = document.getElementById('sweep-needle-group');
  const progressRing = document.getElementById('progress-ring');
  const subdialProgress = document.getElementById('subdial-progress');
  const subdialNeedleGroup = document.getElementById('subdial-needle-group');
  const subdialVal = document.getElementById('subdial-val');
  const dialTicksGroup = document.getElementById('dial-ticks-group');

  // Control Buttons
  const masterBtn = document.getElementById('master-btn');
  const masterIcon = document.getElementById('master-icon');
  const masterLabel = document.getElementById('master-label');
  const lapBtn = document.getElementById('lap-btn');
  const resetBtn = document.getElementById('reset-btn');

  // Lap Elements
  const lapSummaryStrip = document.getElementById('lap-summary-strip');
  const statTotalLaps = document.getElementById('stat-total-laps');
  const statFastestLap = document.getElementById('stat-fastest-lap');
  const statSlowestLap = document.getElementById('stat-slowest-lap');
  const statAvgLap = document.getElementById('stat-avg-lap');

  const lapsTable = document.getElementById('laps-table');
  const lapsListBody = document.getElementById('laps-list-body');
  const lapsEmptyState = document.getElementById('laps-empty-state');
  const lapsCounterBadge = document.getElementById('laps-counter-badge');
  const copyLapsBtn = document.getElementById('copy-laps-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const clearLapsBtn = document.getElementById('clear-laps-btn');

  // Header Utility Controls
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const fullscreenIcon = document.getElementById('fullscreen-icon');
  const shortcutsBtn = document.getElementById('shortcuts-btn');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDismissBtn = document.getElementById('modal-dismiss-btn');

  // Theme Dropdown Elements
  const themeBtn = document.getElementById('theme-btn');
  const themeMenu = document.getElementById('theme-menu');
  const themeOpts = document.querySelectorAll('.theme-opt');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  /* --------------------------------------------------------------------------
     2. CORE TIMEKEEPING STATE (Zero-Drift Timestamp Math)
     -------------------------------------------------------------------------- */
  let startTime = 0;
  let accumulatedTime = 0;
  let isRunning = false;
  let animationFrameId = null;

  // Lap State
  let laps = []; // [{ id, lapTime, splitTime, delta }]
  let lastLapSplitTime = 0;

  // Audio State
  let isSoundEnabled = true;
  let audioCtx = null;

  // Geometry Constants
  const DIAL_CIRCUMFERENCE = 2 * Math.PI * 195; // 1225.22
  const SUBDIAL_CIRCUMFERENCE = 2 * Math.PI * 42; // 263.89

  /* --------------------------------------------------------------------------
     3. RENDER SVG DIAL TICK MARKS (60 Radial Seconds Markers)
     -------------------------------------------------------------------------- */
  function renderDialTicks() {
    if (!dialTicksGroup) return;
    const cx = 220;
    const cy = 220;
    const radius = 195;

    let ticksSvg = '';

    for (let i = 0; i < 60; i++) {
      const angleDeg = i * 6;
      const angleRad = (angleDeg - 90) * (Math.PI / 180);
      const isMajor = i % 5 === 0;

      const tickLength = isMajor ? 12 : 6;
      const x1 = cx + (radius - 2) * Math.cos(angleRad);
      const y1 = cy + (radius - 2) * Math.sin(angleRad);
      const x2 = cx + (radius - 2 - tickLength) * Math.cos(angleRad);
      const y2 = cy + (radius - 2 - tickLength) * Math.sin(angleRad);

      ticksSvg += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" class="${isMajor ? 'tick-major' : 'tick-minor'}" />`;

      // Render Number label for major 5s increments
      if (isMajor) {
        const textRadius = radius - 24;
        const tx = cx + textRadius * Math.cos(angleRad);
        const ty = cy + textRadius * Math.sin(angleRad);
        const secLabel = i === 0 ? '60' : (i < 10 ? '0' + i : i);
        ticksSvg += `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" class="tick-text">${secLabel}</text>`;
      }
    }

    dialTicksGroup.innerHTML = ticksSvg;
  }

  renderDialTicks();

  /* --------------------------------------------------------------------------
     4. TIME FORMATTING HELPER
     -------------------------------------------------------------------------- */
  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor(ms % 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    const pad = (num, size = 2) => String(num).padStart(size, '0');

    return {
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
      ms: pad(milliseconds, 3),
      formatted: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`
    };
  }

  /* --------------------------------------------------------------------------
     5. SYNTHESIZED MECHANICAL AUDIO (Web Audio API)
     -------------------------------------------------------------------------- */
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
  }

  function playTone(type) {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'start') {
        // High crisp mechanical beep
        osc.frequency.setValueAtTime(840, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'pause') {
        // Lower tone
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.06);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'lap') {
        // Double blip
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.start(now);
        osc.stop(now + 0.035);
      } else if (type === 'reset') {
        // Descending mechanical click
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.linearRampToValueAtTime(260, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    } catch (e) {
      // Audio playback safety catch
    }
  }

  /* --------------------------------------------------------------------------
     6. DISPLAY UPDATE (High-Performance 60fps RequestAnimationFrame Loop)
     -------------------------------------------------------------------------- */
  function getCurrentTime() {
    if (!isRunning) return accumulatedTime;
    return accumulatedTime + (performance.now() - startTime);
  }

  function updateDisplay() {
    const currentMs = getCurrentTime();
    const t = formatTime(currentMs);

    // 1. Digital Display Update
    if (displayHours) displayHours.textContent = t.hours;
    if (displayMinutes) displayMinutes.textContent = t.minutes;
    if (displaySeconds) displaySeconds.textContent = t.seconds;
    if (displayMs) displayMs.textContent = t.ms;

    // 2. Current Lap Live Interval
    if (currentLapPreview) {
      const curLapMs = currentMs - lastLapSplitTime;
      currentLapPreview.textContent = formatTime(curLapMs).formatted;
    }

    // 3. Main Dial Sweep Hand (Continuous Smooth Rotation)
    // 1 rotation every 60 seconds (60,000 ms)
    const secondsFraction = (currentMs % 60000) / 60000;
    const needleAngle = secondsFraction * 360;

    if (sweepNeedleGroup) {
      sweepNeedleGroup.setAttribute('transform', `rotate(${needleAngle} 220 220)`);
    }

    // 4. Outer Progress Arc
    if (progressRing) {
      const offset = DIAL_CIRCUMFERENCE - (secondsFraction * DIAL_CIRCUMFERENCE);
      progressRing.style.strokeDashoffset = offset;
    }

    // 5. Minute Subdial Needle & Arc (1 rotation every 60 minutes)
    const minuteFraction = (currentMs % 3600000) / 3600000;
    const subdialAngle = minuteFraction * 360;
    const curMinutes = Math.floor((currentMs / 60000) % 60);

    if (subdialNeedleGroup) {
      subdialNeedleGroup.setAttribute('transform', `rotate(${subdialAngle} 220 120)`);
    }

    if (subdialProgress) {
      const subOffset = SUBDIAL_CIRCUMFERENCE - (minuteFraction * SUBDIAL_CIRCUMFERENCE);
      subdialProgress.style.strokeDashoffset = subOffset;
    }

    if (subdialVal) {
      subdialVal.textContent = String(curMinutes).padStart(2, '0');
    }

    // Keep loop active while running
    if (isRunning) {
      animationFrameId = requestAnimationFrame(updateDisplay);
    }
  }

  /* --------------------------------------------------------------------------
     7. TIMER ACTIONS: START, PAUSE, RESUME, RESET
     -------------------------------------------------------------------------- */
  function startStopwatch() {
    if (isRunning) return;
    isRunning = true;
    startTime = performance.now();

    // Button Visual States
    masterBtn.classList.remove('btn-start', 'is-paused');
    masterBtn.classList.add('btn-pause', 'is-running');
    masterIcon.className = 'fa-solid fa-pause';
    masterLabel.textContent = 'Pause';

    // Enable Lap & Reset buttons
    lapBtn.disabled = false;
    resetBtn.disabled = false;

    // Update Status Pill
    statusBadge.className = 'status-indicator running';
    statusText.textContent = 'RUNNING';
    if (chronoBezel) chronoBezel.classList.add('active-running');

    playTone('start');
    animationFrameId = requestAnimationFrame(updateDisplay);
  }

  function pauseStopwatch() {
    if (!isRunning) return;
    isRunning = false;
    accumulatedTime += (performance.now() - startTime);

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    // Update Button Visuals to "Resume"
    masterBtn.classList.remove('btn-pause', 'is-running');
    masterBtn.classList.add('btn-resume', 'is-paused');
    masterIcon.className = 'fa-solid fa-play';
    masterLabel.textContent = 'Resume';

    // Update Status Pill
    statusBadge.className = 'status-indicator paused';
    statusText.textContent = 'PAUSED';
    if (chronoBezel) chronoBezel.classList.remove('active-running');

    playTone('pause');
    updateDisplay(); // Final paint on pause
  }

  function toggleMaster() {
    if (isRunning) {
      pauseStopwatch();
    } else {
      startStopwatch();
    }
  }

  function resetStopwatch() {
    if (isRunning) {
      pauseStopwatch();
    }

    accumulatedTime = 0;
    startTime = 0;
    lastLapSplitTime = 0;

    // Reset Visual Elements
    if (displayHours) displayHours.textContent = '00';
    if (displayMinutes) displayMinutes.textContent = '00';
    if (displaySeconds) displaySeconds.textContent = '00';
    if (displayMs) displayMs.textContent = '000';
    if (currentLapPreview) currentLapPreview.textContent = '00:00:00.000';

    if (sweepNeedleGroup) sweepNeedleGroup.setAttribute('transform', 'rotate(0 220 220)');
    if (subdialNeedleGroup) subdialNeedleGroup.setAttribute('transform', 'rotate(0 220 120)');
    if (progressRing) progressRing.style.strokeDashoffset = DIAL_CIRCUMFERENCE;
    if (subdialProgress) subdialProgress.style.strokeDashoffset = SUBDIAL_CIRCUMFERENCE;
    if (subdialVal) subdialVal.textContent = '00';

    // Master Button Reset to Start
    masterBtn.classList.remove('btn-pause', 'btn-resume', 'is-running', 'is-paused');
    masterBtn.classList.add('btn-start');
    masterIcon.className = 'fa-solid fa-play';
    masterLabel.textContent = 'Start';

    // Disable Lap & Reset
    lapBtn.disabled = true;
    resetBtn.disabled = true;

    // Status Indicator
    statusBadge.className = 'status-indicator ready';
    statusText.textContent = 'READY';
    if (chronoBezel) chronoBezel.classList.remove('active-running');

    playTone('reset');
    showToast('Chronograph reset to zero', 'info');
  }

  /* --------------------------------------------------------------------------
     8. LAP RECORDING & STATISTICAL ANALYTICS
     -------------------------------------------------------------------------- */
  function recordLap() {
    if (!isRunning && accumulatedTime === 0) return;

    const currentTotal = getCurrentTime();
    const lapTimeMs = currentTotal - lastLapSplitTime;
    lastLapSplitTime = currentTotal;

    const lapNumber = laps.length + 1;
    let deltaMs = 0;

    if (laps.length > 0) {
      const prevLapTime = laps[laps.length - 1].lapTime;
      deltaMs = lapTimeMs - prevLapTime;
    }

    const lapObj = {
      id: lapNumber,
      lapTime: lapTimeMs,
      splitTime: currentTotal,
      delta: deltaMs
    };

    laps.push(lapObj);
    playTone('lap');

    updateLapsTable();
    updateLapSummary();
  }

  function updateLapSummary() {
    if (laps.length === 0) {
      if (lapSummaryStrip) lapSummaryStrip.style.display = 'none';
      return;
    }

    if (lapSummaryStrip) lapSummaryStrip.style.display = 'grid';

    // Calculate Fastest, Slowest, Average
    let minTime = Infinity;
    let maxTime = -Infinity;
    let sumTime = 0;

    laps.forEach((lap) => {
      if (lap.lapTime < minTime) minTime = lap.lapTime;
      if (lap.lapTime > maxTime) maxTime = lap.lapTime;
      sumTime += lap.lapTime;
    });

    const avgTime = Math.round(sumTime / laps.length);

    if (statTotalLaps) statTotalLaps.textContent = laps.length;
    if (statFastestLap) statFastestLap.textContent = formatTime(minTime).formatted;
    if (statSlowestLap) statSlowestLap.textContent = laps.length > 1 ? formatTime(maxTime).formatted : '--:--.--';
    if (statAvgLap) statAvgLap.textContent = formatTime(avgTime).formatted;

    if (lapsCounterBadge) lapsCounterBadge.textContent = `${laps.length} Lap${laps.length > 1 ? 's' : ''}`;

    // Enable Lap Action Buttons
    if (copyLapsBtn) copyLapsBtn.disabled = false;
    if (exportCsvBtn) exportCsvBtn.disabled = false;
    if (clearLapsBtn) clearLapsBtn.disabled = false;
  }

  function updateLapsTable() {
    if (laps.length === 0) {
      if (lapsTable) lapsTable.style.display = 'none';
      if (lapsEmptyState) lapsEmptyState.style.display = 'flex';
      return;
    }

    if (lapsTable) lapsTable.style.display = 'table';
    if (lapsEmptyState) lapsEmptyState.style.display = 'none';

    // Find fastest and slowest times for comparison
    let fastestLapId = null;
    let slowestLapId = null;

    if (laps.length > 1) {
      let minTime = Infinity;
      let maxTime = -Infinity;

      laps.forEach((lap) => {
        if (lap.lapTime < minTime) {
          minTime = lap.lapTime;
          fastestLapId = lap.id;
        }
        if (lap.lapTime > maxTime) {
          maxTime = lap.lapTime;
          slowestLapId = lap.id;
        }
      });
    }

    // Render table rows (newest first)
    const reversed = [...laps].reverse();
    let rowsHtml = '';

    reversed.forEach((lap) => {
      const isFastest = lap.id === fastestLapId;
      const isSlowest = lap.id === slowestLapId;

      let rowClass = 'lap-row';
      if (isFastest) rowClass += ' is-fastest';
      if (isSlowest) rowClass += ' is-slowest';

      // Delta formatting
      let deltaHtml = '<span class="lap-delta delta-neutral">—</span>';
      if (lap.id > 1) {
        const sign = lap.delta > 0 ? '+' : '';
        const deltaClass = lap.delta > 0 ? 'delta-plus' : 'delta-minus';
        deltaHtml = `<span class="lap-delta ${deltaClass}">${sign}${(lap.delta / 1000).toFixed(2)}s</span>`;
      }

      // Analysis Badge
      let badgeHtml = '<span class="text-faint">—</span>';
      if (isFastest) {
        badgeHtml = '<span class="lap-badge badge-fastest"><i class="fa-solid fa-bolt"></i> Fastest</span>';
      } else if (isSlowest) {
        badgeHtml = '<span class="lap-badge badge-slowest"><i class="fa-solid fa-turtle"></i> Slowest</span>';
      }

      rowsHtml += `
        <tr class="${rowClass}">
          <td>#${String(lap.id).padStart(2, '0')}</td>
          <td>${formatTime(lap.lapTime).formatted}</td>
          <td>${formatTime(lap.splitTime).formatted}</td>
          <td>${deltaHtml}</td>
          <td>${badgeHtml}</td>
        </tr>
      `;
    });

    if (lapsListBody) {
      lapsListBody.innerHTML = rowsHtml;
    }
  }

  function clearLaps() {
    laps = [];
    lastLapSplitTime = getCurrentTime();

    updateLapsTable();
    updateLapSummary();

    if (copyLapsBtn) copyLapsBtn.disabled = true;
    if (exportCsvBtn) exportCsvBtn.disabled = true;
    if (clearLapsBtn) clearLapsBtn.disabled = true;
    if (lapsCounterBadge) lapsCounterBadge.textContent = '0 Laps';

    showToast('Lap history cleared', 'info');
  }

  /* --------------------------------------------------------------------------
     9. EXPORT & COPY FUNCTIONALITY
     -------------------------------------------------------------------------- */
  function exportCSV() {
    if (laps.length === 0) return;

    let csv = 'Lap Number,Lap Time,Split (Total) Time,Delta (Seconds)\n';

    laps.forEach((lap) => {
      const lapTimeFormatted = formatTime(lap.lapTime).formatted;
      const splitTimeFormatted = formatTime(lap.splitTime).formatted;
      const deltaSec = (lap.delta / 1000).toFixed(3);
      csv += `${lap.id},${lapTimeFormatted},${splitTimeFormatted},${deltaSec}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChronoPro_Laps_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Laps exported to CSV successfully!', 'success');
  }

  function copyLapsToClipboard() {
    if (laps.length === 0) return;

    let text = 'CHRONO-PRO — Recorded Lap Times\n';
    text += '=====================================\n';
    text += 'Lap | Lap Time        | Split Time\n';
    text += '----+-----------------+--------------\n';

    laps.forEach((lap) => {
      const padNum = String(lap.id).padStart(3, ' ');
      text += `#${padNum} | ${formatTime(lap.lapTime).formatted} | ${formatTime(lap.splitTime).formatted}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      showToast('Lap times copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'info');
    });
  }

  /* --------------------------------------------------------------------------
     10. THEME SWITCHER CONTROLLER
     -------------------------------------------------------------------------- */
  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('chrono-theme', theme);
    } catch (e) {}

    themeOpts.forEach((opt) => {
      if (opt.getAttribute('data-color') === theme) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    showToast(`Activated ${theme.charAt(0).toUpperCase() + theme.slice(1)} Aura`, 'info');
  }

  try {
    const savedTheme = localStorage.getItem('chrono-theme') || 'violet';
    setTheme(savedTheme);
  } catch (e) {
    setTheme('violet');
  }

  if (themeBtn && themeMenu) {
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!themeMenu.contains(e.target) && !themeBtn.contains(e.target)) {
        themeMenu.classList.remove('active');
      }
    });
  }

  themeOpts.forEach((opt) => {
    opt.addEventListener('click', () => {
      const color = opt.getAttribute('data-color');
      setTheme(color);
      if (themeMenu) themeMenu.classList.remove('active');
    });
  });

  /* --------------------------------------------------------------------------
     11. AUDIO & FULLSCREEN CONTROLS
     -------------------------------------------------------------------------- */
  function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    try {
      localStorage.setItem('chrono-sound', isSoundEnabled ? '1' : '0');
    } catch (e) {}

    if (soundIcon) {
      soundIcon.className = isSoundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    }
    if (soundToggleBtn) {
      const tooltip = soundToggleBtn.querySelector('.btn-tooltip');
      if (tooltip) tooltip.textContent = `Sound: ${isSoundEnabled ? 'ON' : 'OFF'}`;
      if (isSoundEnabled) {
        soundToggleBtn.classList.remove('active');
      } else {
        soundToggleBtn.classList.add('active');
      }
    }

    showToast(`Mechanical Audio: ${isSoundEnabled ? 'ENABLED' : 'MUTED'}`, 'info');
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', toggleSound);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-compress';
        showToast('Entered Fullscreen Mode', 'info');
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          if (fullscreenIcon) fullscreenIcon.className = 'fa-solid fa-expand';
          showToast('Exited Fullscreen', 'info');
        }).catch(() => {});
      }
    }
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  /* --------------------------------------------------------------------------
     12. KEYBOARD SHORTCUTS CONTROLLER
     -------------------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    // Avoid triggering when focused inside inputs or textareas
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const key = e.key.toLowerCase();

    if (e.code === 'Space') {
      e.preventDefault();
      toggleMaster();
    } else if (key === 'l') {
      e.preventDefault();
      if (!lapBtn.disabled) recordLap();
    } else if (key === 'r') {
      e.preventDefault();
      if (!resetBtn.disabled) resetStopwatch();
    } else if (key === 'm') {
      e.preventDefault();
      toggleSound();
    } else if (key === 'f') {
      e.preventDefault();
      toggleFullscreen();
    } else if (key === 't') {
      e.preventDefault();
      // Cycle through available themes
      const themes = ['violet', 'cyan', 'emerald', 'red', 'gold'];
      const cur = document.body.getAttribute('data-theme') || 'violet';
      const next = themes[(themes.indexOf(cur) + 1) % themes.length];
      setTheme(next);
    } else if (key === 'escape') {
      if (shortcutsModal) shortcutsModal.classList.remove('open');
      if (themeMenu) themeMenu.classList.remove('active');
    }
  });

  // Modal Triggers
  if (shortcutsBtn && shortcutsModal) {
    shortcutsBtn.addEventListener('click', () => {
      shortcutsModal.classList.add('open');
    });
  }

  if (modalCloseBtn && shortcutsModal) {
    modalCloseBtn.addEventListener('click', () => {
      shortcutsModal.classList.remove('open');
    });
  }

  if (modalDismissBtn && shortcutsModal) {
    modalDismissBtn.addEventListener('click', () => {
      shortcutsModal.classList.remove('open');
    });
  }

  if (shortcutsModal) {
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) {
        shortcutsModal.classList.remove('open');
      }
    });
  }

  /* --------------------------------------------------------------------------
     13. BUTTON EVENT LISTENERS
     -------------------------------------------------------------------------- */
  if (masterBtn) masterBtn.addEventListener('click', toggleMaster);
  if (lapBtn) lapBtn.addEventListener('click', recordLap);
  if (resetBtn) resetBtn.addEventListener('click', resetStopwatch);

  if (copyLapsBtn) copyLapsBtn.addEventListener('click', copyLapsToClipboard);
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCSV);
  if (clearLapsBtn) clearLapsBtn.addEventListener('click', clearLaps);

  /* --------------------------------------------------------------------------
     14. TOAST NOTIFICATION UTILITY
     -------------------------------------------------------------------------- */
  function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconClass = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-info';

    toast.innerHTML = `
      <i class="${iconClass}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, 3200);
  }

  /* --------------------------------------------------------------------------
     15. AMBIENT BACKGROUND PARTICLE CANVAS
     -------------------------------------------------------------------------- */
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let particles = [];

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.35;
        this.speedY = (Math.random() - 0.5) * 0.35;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 22000), 50);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (let p of particles) {
        p.update();
        p.draw();
      }
      requestAnimationFrame(animate);
    }

    initParticles();
    animate();
  }

  // Initial Welcome Toast
  setTimeout(() => {
    showToast('CHRONO-PRO Ready • Press Space to Start', 'info');
  }, 600);
});
