---
theme: default
title: hackaboard
info: |
  hackaboard — pitch deck.
  The hackathon, reborn as a race.
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
fonts:
  sans: 'Geist'
  mono: 'Geist Mono'
  weights: '400,500,700,900'
canvasWidth: 1280
colorSchema: dark
download: true
---

<div class="hero-cover">
  <div class="cover-label">presenting</div>
  <Wordmark size="hero" />
  <div class="cover-question">
    What if your hackathon felt like<br/>a <em>hackathon</em>?
  </div>
</div>

<style>
.hero-cover {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3rem;
}
.cover-label {
  font-family: 'Geist Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(125 128 138);
}
.cover-question {
  font-size: 2rem;
  line-height: 1.4;
  font-weight: 500;
  max-width: 32ch;
  color: rgb(232 234 239);
}
.cover-question em {
  color: oklch(0.78 0.15 195);
  font-style: italic;
  font-weight: 700;
}
</style>

---
layout: center
---

<div class="question-slide">
  <div class="q-mark">?</div>
  <h2>When was the last time you ran a hackathon</h2>
  <h2 class="emphasis">without losing hours to spreadsheets?</h2>
</div>

<style>
.question-slide {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.q-mark {
  font-family: 'Geist', sans-serif;
  font-weight: 900;
  font-size: 6rem;
  line-height: 1;
  color: oklch(0.78 0.15 195);
  margin-bottom: 1rem;
}
.question-slide h2 {
  font-size: 2.25rem;
  font-weight: 500;
  line-height: 1.3;
  max-width: 28ch;
  color: rgb(232 234 239);
}
.question-slide .emphasis {
  font-style: italic;
  color: oklch(0.78 0.15 195);
  font-weight: 700;
}
</style>

---
layout: default
---

<div class="reality">
  <div class="section-label">The reality today</div>
  <ul class="reality-list">
    <li><span class="bullet">↓</span> Registrations live in Google Forms, then someone copies them into a sheet</li>
    <li><span class="bullet">↓</span> Judges score on paper, on clipboards, on shared docs</li>
    <li><span class="bullet">↓</span> Results come out two to four hours after the deadline</li>
    <li><span class="bullet">↓</span> No one in the room knows who's winning</li>
    <li><span class="bullet">↓</span> The event ends quietly, not with a roar</li>
  </ul>
  <div class="reality-tag">Sound familiar?</div>
</div>

<style>
.reality {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 4rem;
  gap: 2rem;
}
.section-label {
  font-family: 'Geist Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(125 128 138);
}
.reality-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.reality-list li {
  font-size: 1.5rem;
  font-weight: 500;
  color: rgb(232 234 239);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  line-height: 1.4;
}
.bullet {
  font-family: 'Geist Mono', monospace;
  color: oklch(0.62 0.22 25);
  font-weight: 700;
  flex-shrink: 0;
}
.reality-tag {
  font-style: italic;
  font-size: 1.5rem;
  color: oklch(0.78 0.15 195);
  margin-top: 2rem;
  font-weight: 500;
}
</style>

---
layout: center
---

<div class="built">
  <div class="section-label">So we built</div>
  <Wordmark size="large" />
  <div class="built-tag">One platform. End-to-end.</div>
  <div class="journey">
    <div class="step">Register</div>
    <div class="arrow">→</div>
    <div class="step">Check-in</div>
    <div class="arrow">→</div>
    <div class="step">Judge</div>
    <div class="arrow">→</div>
    <div class="step active">Leaderboard</div>
    <div class="arrow">→</div>
    <div class="step">Ceremony</div>
  </div>
</div>

<style>
.built {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
.section-label {
  font-family: 'Geist Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(125 128 138);
}
.built-tag {
  font-size: 1.5rem;
  font-weight: 500;
  color: rgb(232 234 239);
  font-style: italic;
}
.journey {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
}
.step {
  font-family: 'Geist Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.75rem 1.25rem;
  border: 2px solid rgb(54 58 68);
  border-bottom: 4px solid rgb(54 58 68);
  border-radius: 0.5rem;
  color: rgb(232 234 239);
  background: oklch(0.13 0.012 260);
}
.step.active {
  border-color: oklch(0.78 0.15 195);
  border-bottom-color: oklch(0.78 0.15 195);
  color: oklch(0.78 0.15 195);
  background: oklch(0.13 0.012 260);
}
.arrow {
  font-size: 1.25rem;
  color: rgb(125 128 138);
}
</style>

---
layout: default
---

<div class="actor">
  <div class="actor-meta">
    <div class="section-label">If you organize</div>
    <h2>Create the event. Press start.</h2>
    <h2 class="emphasis">Watch it run itself.</h2>
    <ul class="actor-points">
      <li>Set up rounds, criteria, and judges in minutes</li>
      <li>Manage check-ins with a scan</li>
      <li>Open the display screen — that's it</li>
    </ul>
  </div>
  <div class="actor-visual">
    <img src="/screenshots/organizer.png" class="actor-screenshot" alt="Organizer dashboard" />
  </div>
</div>

<style>
.actor {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  padding: 0 3rem;
}
.actor-meta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.section-label {
  font-family: 'Geist Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(125 128 138);
}
.actor h2 {
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 700;
  color: rgb(232 234 239);
}
.actor h2.emphasis {
  font-style: italic;
  color: oklch(0.78 0.15 195);
}
.actor-points {
  list-style: none;
  padding: 0;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.actor-points li {
  font-size: 1rem;
  color: rgb(180 184 195);
  padding-left: 1.5rem;
  position: relative;
}
.actor-points li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: oklch(0.78 0.15 195);
  font-family: 'Geist Mono', monospace;
}
.actor-screenshot {
  width: 100%;
  border: 2px solid rgb(54 58 68);
  border-bottom: 6px solid rgb(54 58 68);
  border-radius: 0.75rem;
  display: block;
}
</style>

---
layout: default
---

<div class="actor">
  <div class="actor-visual">
    <img src="/screenshots/participant.png" class="actor-screenshot" alt="Participant dashboard" />
  </div>
  <div class="actor-meta">
    <div class="section-label">If you participate</div>
    <h2>Sign up. Form a team.</h2>
    <h2 class="emphasis">Watch your rank climb.</h2>
    <ul class="actor-points">
      <li>Register from a phone — solo or with a team</li>
      <li>See judging progress in real time</li>
      <li>Watch the board the moment scores come in</li>
    </ul>
  </div>
</div>

---
layout: default
---

<div class="actor">
  <div class="actor-meta">
    <div class="section-label">If you judge</div>
    <h2>What tools do you give your<br/>judges today?</h2>
    <div class="judge-flow">
      <div class="jf-step">
        <div class="jf-num">1</div>
        <div class="jf-text">Scan the team's QR</div>
      </div>
      <div class="jf-step">
        <div class="jf-num">2</div>
        <div class="jf-text">Tap 1–5 across criteria</div>
      </div>
      <div class="jf-step">
        <div class="jf-num">3</div>
        <div class="jf-text">Submit. Done.</div>
      </div>
    </div>
    <div class="judge-tag">Thirty seconds per team. From a phone.</div>
  </div>
  <div class="actor-visual">
    <img src="/screenshots/judge.png" class="judge-screenshot" alt="Judge phone view" />
  </div>
</div>

<style>
.judge-flow {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.jf-step {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.jf-num {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: oklch(0.82 0.16 80);
  color: oklch(0.12 0 0);
  font-family: 'Geist', sans-serif;
  font-weight: 900;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.jf-text {
  font-size: 1.125rem;
  font-weight: 500;
  color: rgb(232 234 239);
}
.judge-tag {
  margin-top: 1.5rem;
  font-style: italic;
  color: oklch(0.78 0.15 195);
  font-size: 1rem;
}
.judge-screenshot {
  max-width: 240px;
  display: block;
  margin: 0 auto;
  border: 2px solid rgb(54 58 68);
  border-bottom: 6px solid rgb(54 58 68);
  border-radius: 1.5rem;
}
</style>

---
layout: default
---

<div class="board-slide">
  <div class="board-label">The <Wordmark size="inline" /></div>
  <img src="/screenshots/display.png" class="board-screenshot" alt="HackaBoard live leaderboard" />
  <div class="board-caption">This is the room watching.</div>
</div>

<style>
.board-slide {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
}
.board-label {
  font-family: 'Geist Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(125 128 138);
}
.board-screenshot {
  width: 88%;
  border: 2px solid oklch(0.78 0.15 195);
  border-bottom: 6px solid oklch(0.78 0.15 195);
  border-radius: 0.75rem;
  display: block;
}
.board-caption {
  font-family: 'Geist', sans-serif;
  font-size: 1.75rem;
  font-style: italic;
  font-weight: 500;
  color: rgb(232 234 239);
}
</style>

---
layout: center
---

<div class="trust">
  <div class="section-label">On your data</div>
  <h2 class="trust-line">Each event is its own world.</h2>
  <h2 class="trust-line emphasis">You decide what stays. You decide what goes.</h2>
  <div class="trust-points">
    <div class="tp">Sign in with Google — no passwords on our side</div>
    <div class="tp">Your participants' details only travel with your event</div>
    <div class="tp">Nothing is ever shared with another organizer</div>
  </div>
</div>

<style>
.trust {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 0 4rem;
}
.section-label {
  font-family: 'Geist Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(125 128 138);
}
.trust-line {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(232 234 239);
  line-height: 1.3;
  max-width: 30ch;
}
.trust-line.emphasis {
  color: oklch(0.78 0.15 195);
  font-style: italic;
}
.trust-points {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  align-items: center;
}
.tp {
  font-size: 1rem;
  color: rgb(180 184 195);
  max-width: 50ch;
}
</style>

---
layout: default
---

<div class="real-world">
  <div class="section-label">Built for the real room</div>
  <div class="rw-stack">
    <div class="rw-item">
      <div class="rw-q">Bad WiFi?</div>
      <div class="rw-a">It still works.</div>
    </div>
    <div class="rw-item">
      <div class="rw-q">Power blink?</div>
      <div class="rw-a">Scores are saved.</div>
    </div>
    <div class="rw-item">
      <div class="rw-q">Phones from 2018?</div>
      <div class="rw-a">Still works.</div>
    </div>
  </div>
  <div class="rw-tag">It works when nothing else does.</div>
</div>

<style>
.real-world {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 4rem;
  gap: 2rem;
}
.rw-stack {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 1rem;
}
.rw-item {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
}
.rw-q {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(125 128 138);
  min-width: 16rem;
}
.rw-a {
  font-size: 2rem;
  font-weight: 900;
  color: oklch(0.78 0.15 195);
  font-style: italic;
}
.rw-tag {
  margin-top: 2rem;
  font-size: 1.25rem;
  font-style: italic;
  color: rgb(232 234 239);
  font-weight: 500;
}
</style>

---
layout: center
---

<div class="close">
  <Wordmark size="large" />
  <div class="close-headline">
    Want <Wordmark size="inline" /> set up for<br/>your <em>next hackathon</em>?
  </div>
  <div class="close-sub">You don't have to pay anything.</div>
  <div class="close-cta">Just DM.</div>
  <div class="close-contact">
    <span class="cc-label">Contact</span>
    <span class="cc-value">{{ contact }}</span>
  </div>
</div>

<script setup>
const contact = '— [your name + handle] —'
</script>

<style>
.close {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
.close-headline {
  font-size: 2.25rem;
  line-height: 1.3;
  font-weight: 500;
  color: rgb(232 234 239);
  max-width: 28ch;
  margin-top: 1rem;
}
.close-headline em {
  font-style: italic;
  font-weight: 700;
  color: oklch(0.78 0.15 195);
}
.close-sub {
  font-size: 1.25rem;
  color: rgb(180 184 195);
}
.close-cta {
  font-size: 3rem;
  font-weight: 900;
  color: oklch(0.78 0.15 195);
  font-style: italic;
  letter-spacing: -0.02em;
  margin-top: 0.5rem;
}
.close-contact {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.cc-label {
  font-family: 'Geist Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgb(125 128 138);
}
.cc-value {
  font-family: 'Geist Mono', monospace;
  font-size: 1rem;
  color: rgb(232 234 239);
}
</style>
