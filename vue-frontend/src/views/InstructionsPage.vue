<template>
  <div class="instructions-page">
    <div class="instructions-container">
      <!-- Header -->
      <div class="instructions-header">
        <button @click="goBack" class="back-btn">
          ← Back
        </button>
        <div class="header-content">
          <div class="station-badge">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <rect x="6" y="2" width="4" height="4" fill="#1c1c1c" />
              <rect x="2" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="10" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="6" y="10" width="4" height="4" fill="#1c1c1c" />
            </svg>
            DOCUMENTATION
          </div>
          <h1>WORKING LAB USER GUIDE</h1>
          <p>Interview Experience Analysis Platform</p>
        </div>
      </div>

      <!-- Content -->
      <div class="instructions-content">
        <!-- Introduction -->
        <section class="section">
          <h2 class="section-title">INTRODUCTION</h2>
          <p class="section-text">
            Working Lab analyzes real interview experiences from tech communities to help you understand what companies
            actually ask. By processing posts from Reddit, Blind, and Glassdoor, we extract trending questions, identify
            patterns, and generate actionable insights for your interview preparation.
          </p>
        </section>

        <!-- What We Do -->
        <section class="section">
          <h2 class="section-title">WHAT WE ANALYZE</h2>

          <div class="node-type">
            <div class="node-type-header">
              <span class="node-icon">💬</span>
              <h3 class="node-type-title">INTERVIEW EXPERIENCES</h3>
            </div>
            <p class="node-type-text">
              Real stories from candidates who interviewed at top tech companies. Extract questions, formats, difficulty,
              and outcomes from community posts.
            </p>
          </div>

          <div class="node-type">
            <div class="node-type-header">
              <span class="node-icon">🏢</span>
              <h3 class="node-type-title">COMPANY TRENDS</h3>
            </div>
            <p class="node-type-text">
              Track how interview styles evolve. Compare Google's questions Q1 vs Q4, identify shifts in technical focus.
            </p>
          </div>

          <div class="node-type">
            <div class="node-type-header">
              <span class="node-icon">📊</span>
              <h3 class="node-type-title">QUESTION PATTERNS</h3>
            </div>
            <p class="node-type-text">
              Discover frequently asked questions by role and company. Frontend vs Backend vs ML Engineer question types.
            </p>
          </div>
        </section>

        <!-- Getting Started -->
        <section class="section">
          <h2 class="section-title">GETTING STARTED</h2>

          <div class="step">
            <div class="step-number">01</div>
            <div class="step-content">
              <h3 class="step-title">Create Account</h3>
              <p class="step-text">
                Sign in with Google or email. Your workflows and insights sync automatically.
              </p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">02</div>
            <div class="step-content">
              <h3 class="step-title">Build Workflow</h3>
              <p class="step-text">
                Create a data pipeline using visual nodes. Connect scraper → processor → analyzer → output.
              </p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">03</div>
            <div class="step-content">
              <h3 class="step-title">Run Analysis</h3>
              <p class="step-text">
                Execute workflow to extract and analyze interview questions from your target companies.
              </p>
            </div>
          </div>

          <div class="step">
            <div class="step-number">04</div>
            <div class="step-content">
              <h3 class="step-title">Export Insights</h3>
              <p class="step-text">
                View learning maps, question banks, and trend reports. Export to CSV or your study tools.
              </p>
            </div>
          </div>
        </section>

        <!-- Use Cases -->
        <section class="section">
          <h2 class="section-title">COMMON USE CASES</h2>

          <ul class="practices-list">
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Preparing for Google L4 — analyze last 100 Google SWE posts to find top 20 most asked questions</span>
            </li>
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Tracking trends — compare frontend questions 2023 vs 2024, spot shift toward performance optimization</span>
            </li>
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Building question bank — scrape Meta interviews, extract system design, export to Notion</span>
            </li>
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Success analysis — compare "got offer" vs "rejected" posts to identify winning patterns</span>
            </li>
          </ul>
        </section>

        <!-- Best Practices -->
        <section class="section">
          <h2 class="section-title">BEST PRACTICES</h2>

          <ul class="practices-list">
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Start with 10-20 posts to test workflow before processing thousands</span>
            </li>
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Use specific keywords: "final round", "onsite", "offer" for better signal</span>
            </li>
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Respect API limits: Reddit allows 60 requests/minute</span>
            </li>
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Save workflows incrementally to prevent losing complex pipelines</span>
            </li>
            <li class="practice-item">
              <span class="practice-bullet">■</span>
              <span class="practice-text">Combine sources (Reddit + Blind + Glassdoor) for comprehensive coverage</span>
            </li>
          </ul>
        </section>

        <!-- Keyboard Shortcuts -->
        <section class="section">
          <h2 class="section-title">KEYBOARD SHORTCUTS</h2>

          <div class="shortcuts-grid">
            <div class="shortcut">
              <span class="shortcut-key">CTRL + S</span>
              <span class="shortcut-desc">Save workflow</span>
            </div>
            <div class="shortcut">
              <span class="shortcut-key">CTRL + R</span>
              <span class="shortcut-desc">Run workflow</span>
            </div>
            <div class="shortcut">
              <span class="shortcut-key">CTRL + Z</span>
              <span class="shortcut-desc">Undo</span>
            </div>
            <div class="shortcut">
              <span class="shortcut-key">DELETE</span>
              <span class="shortcut-desc">Delete node</span>
            </div>
          </div>
        </section>

        <!-- Support -->
        <section class="section">
          <h2 class="section-title">SUPPORT</h2>
          <p class="section-text">
            Questions? Email support@workinglab.io or join our Discord to share workflows and discuss trends.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.back()
}
</script>

<style scoped>
.instructions-page {
  min-height: 100vh;
  background: var(--industrial-bg-page);
  padding: var(--space-xl);
}

.instructions-container {
  max-width: 900px;
  margin: 0 auto;
}

.instructions-header {
  margin-bottom: var(--space-xl);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-sm);
  color: var(--industrial-text-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: var(--space-lg);
}

.back-btn:hover {
  background: var(--industrial-accent);
  border-color: var(--industrial-border-strong);
}

.header-content {
  text-align: center;
  padding: var(--space-xl);
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
}

.station-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--industrial-text-primary);
  background: var(--industrial-bg-module);
  color: var(--industrial-text-primary);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-md);
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  margin: 0 0 var(--space-sm);
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.header-content p {
  color: var(--industrial-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

.instructions-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.section {
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--industrial-text-primary);
  margin: 0 0 var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--industrial-divider);
}

.section-text {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
  margin: 0;
}

.step {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.step:last-child {
  margin-bottom: 0;
}

.step-number {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--industrial-text-primary);
  color: var(--industrial-bg-module);
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--industrial-text-primary);
  margin: 0 0 var(--space-xs);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.step-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
  margin: 0;
}

.node-type {
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-sm);
}

.node-type:last-child {
  margin-bottom: 0;
}

.node-type-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.node-icon {
  font-size: 1.25rem;
}

.node-type-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--industrial-text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.node-type-text {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
  margin: 0;
}

.practices-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.practice-item {
  display: flex;
  gap: var(--space-sm);
}

.practice-bullet {
  flex-shrink: 0;
  color: var(--industrial-text-primary);
  font-size: 0.5rem;
  line-height: 1.6;
  margin-top: 6px;
}

.practice-text {
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.shortcut {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-sm);
}

.shortcut-key {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.shortcut-desc {
  font-size: 0.8125rem;
  color: var(--industrial-text-secondary);
}

@media (max-width: 768px) {
  .instructions-page {
    padding: var(--space-md);
  }

  .step {
    flex-direction: column;
    gap: var(--space-md);
  }

  .shortcuts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
