"use client";

// Ambient city hum synthesized with Web Audio: a low detuned pad plus filtered brown noise.
// No audio files to download. To use a recorded loop later, swap start() for an <audio> element.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function build(ac: AudioContext) {
  const out = ac.createGain();
  out.gain.value = 0;
  out.connect(ac.destination);

  const padFilter = ac.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 420;
  padFilter.Q.value = 0.7;
  padFilter.connect(out);

  for (const [freq, detune, level] of [
    [55, -6, 0.16],
    [82.41, 5, 0.1],
    [110, 9, 0.05],
  ] as const) {
    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = ac.createGain();
    g.gain.value = level;
    osc.connect(g).connect(padFilter);
    osc.start();
  }

  // Slow breathing on the filter.
  const lfo = ac.createOscillator();
  lfo.frequency.value = 0.05;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 160;
  lfo.connect(lfoGain).connect(padFilter.frequency);
  lfo.start();

  // Distant traffic: brown noise through a bandpass.
  const len = ac.sampleRate * 4;
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 300;
  band.Q.value = 0.5;
  const noiseGain = ac.createGain();
  noiseGain.gain.value = 0.35;
  noise.connect(band).connect(noiseGain).connect(out);
  noise.start();

  return out;
}

export async function setAmbient(on: boolean) {
  if (on) {
    if (!ctx) {
      ctx = new AudioContext();
      master = build(ctx);
    }
    await ctx.resume();
    master!.gain.cancelScheduledValues(ctx.currentTime);
    master!.gain.setTargetAtTime(0.22, ctx.currentTime, 0.8);
  } else if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  }
}
