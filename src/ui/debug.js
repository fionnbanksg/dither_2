// F3 debug overlay: text panel + frame-time graph + simple controls. No game logic.
const HISTORY = 160, GRAPH_W = 240, GRAPH_H = 44, GRAPH_MAX_MS = 40, TEXT_EVERY_MS = 150;

export class DebugOverlay {
  constructor(el, getStats) {
    this.el = el;
    this.getStats = getStats;
    this.on = false;
    this.times = new Float32Array(HISTORY);
    this.n = 0;
    this.sinceText = 1e9;
    this.text = document.createElement('pre');
    this.graph = document.createElement('canvas');
    this.graph.width = GRAPH_W; this.graph.height = GRAPH_H;
    this.ctx = this.graph.getContext('2d');
    this.controls = document.createElement('div');
    this.controls.className = 'controls';
    el.append(this.text, this.graph, this.controls);
  }

  // Adds a labelled range slider. onInput(value) fires continuously while dragging.
  addSlider({ label, min, max, step, value, format = (v) => v.toFixed(2), onInput }) {
    const row = document.createElement('label');
    row.className = 'row';
    const name = document.createElement('span'); name.textContent = label;
    const input = document.createElement('input');
    Object.assign(input, { type: 'range', min, max, step, value });
    const val = document.createElement('span'); val.className = 'val';
    const sync = () => { val.textContent = format(+input.value); };
    input.addEventListener('input', () => { sync(); onInput(+input.value); });
    sync();
    row.append(name, input, val);
    this.controls.append(row);
    return { set(v) { input.value = v; sync(); } };
  }

  toggle() { this.on = !this.on; this.el.classList.toggle('on', this.on); this.sinceText = 1e9; }

  frame(dtMs) {
    this.times[this.n++ % HISTORY] = dtMs;
    if (!this.on) return;
    this.sinceText += dtMs;
    if (this.sinceText >= TEXT_EVERY_MS) { this.sinceText = 0; this.text.textContent = this.getStats(); }
    this._drawGraph();
  }

  _drawGraph() {
    const c = this.ctx;
    c.clearRect(0, 0, GRAPH_W, GRAPH_H);
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, GRAPH_W, GRAPH_H);
    const bw = GRAPH_W / HISTORY;
    for (let i = 0; i < HISTORY; i++) {
      const t = this.times[(this.n + i) % HISTORY];
      const h = Math.min(t / GRAPH_MAX_MS, 1) * GRAPH_H;
      c.fillStyle = t > 33 ? '#f55' : t > 17 ? '#fd5' : '#5f8';
      c.fillRect(i * bw, GRAPH_H - h, bw, h);
    }
  }
}
