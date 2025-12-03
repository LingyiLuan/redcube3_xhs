<template>
  <div class="learning-map-viewer">
    <!-- Back Button -->
    <div class="viewer-header">
      <button @click="handleBack" class="back-btn">
        <ArrowLeft :size="20" />
        <span>Back to Learning Maps</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading learning map...</p>
    </div>

    <!-- Map Content -->
    <div v-else-if="map" class="map-content">
      <!-- Map Info Section (Clean Minimal Header) -->
      <div class="map-info-clean">
        <div class="map-header-clean">
          <h2 class="map-title-clean">{{ map.title || 'Untitled Learning Map' }}</h2>
          <p class="map-summary-clean">{{ map.summary || 'No summary available' }}</p>
        </div>
        <div class="map-meta-clean">
          <span v-if="map.timeline_weeks" class="meta-badge-clean">
            {{ map.timeline_weeks }} WEEKS
          </span>
          <span v-if="map.difficulty" class="meta-badge-clean difficulty">
            {{ map.difficulty.toUpperCase() }}
          </span>
        </div>
      </div>

      <!-- Week-by-Week Collapsible Timeline (Professional McKinsey Style) -->
      <div v-if="map.timeline && map.timeline.weeks && map.timeline.weeks.length > 0" class="professional-timeline-section">
        <div class="timeline-header">
          <h3 class="timeline-title">Learning Plan: {{ map.title || 'Interview Preparation' }}</h3>
          <div class="timeline-meta">
            <span class="meta-item">{{ map.timeline_weeks || map.timeline.weeks.length }} weeks</span>
            <span class="meta-separator">•</span>
            <span class="meta-item">{{ calculateTotalHours(map.timeline.weeks) }}h total</span>
            <span class="meta-separator">•</span>
            <span class="meta-item">{{ calculateCompletionPercentage(map.timeline.weeks) }}% complete</span>
          </div>
        </div>

        <div class="accordion-container">
          <div
            v-for="(week, idx) in map.timeline.weeks"
            :key="idx"
            class="accordion-item"
            :class="{ 'is-expanded': expandedWeeks.includes(idx) }"
          >
            <!-- Collapsed Header -->
            <div
              class="accordion-header"
              @click="toggleWeek(idx)"
            >
              <div class="header-left">
                <span class="chevron">{{ expandedWeeks.includes(idx) ? '▼' : '▶' }}</span>
                <span class="week-label">WEEK {{ week.week }}</span>
                <h4 class="week-title-text">{{ week.title }}</h4>
              </div>
              <div class="header-right">
                <span class="week-hours">{{ calculateWeekHours(week) }}h</span>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: getWeekProgress(week) + '%' }"
                  ></div>
                </div>
                <span class="progress-text">{{ getWeekProgress(week) }}%</span>
              </div>
            </div>

            <!-- Expanded Content -->
            <transition name="accordion">
              <div v-if="expandedWeeks.includes(idx)" class="accordion-content">
                <p v-if="week.narrative" class="week-description">{{ week.narrative }}</p>

                <!-- Topics Section -->
                <div v-if="getWeekTopics(week).length > 0" class="content-section">
                  <h5 class="section-label">TOPICS</h5>
                  <div class="topics-grid">
                    <div
                      v-for="(topic, topicIdx) in getWeekTopics(week)"
                      :key="topicIdx"
                      class="topic-item"
                    >
                      <input
                        type="checkbox"
                        :id="`topic-${idx}-${topicIdx}`"
                        class="topic-checkbox"
                      />
                      <label :for="`topic-${idx}-${topicIdx}`" class="topic-label">
                        {{ topic }}
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Practice Problems Section (Quick Overview) -->
                <div v-if="getWeekProblems(week).length > 0" class="content-section">
                  <h5 class="section-label">ALL PRACTICE PROBLEMS</h5>
                  <div class="problems-list">
                    <div
                      v-for="(problem, probIdx) in getWeekProblems(week)"
                      :key="probIdx"
                      class="problem-item"
                    >
                      <input
                        type="checkbox"
                        :id="`problem-${idx}-${probIdx}`"
                        class="problem-checkbox"
                      />
                      <label :for="`problem-${idx}-${probIdx}`" class="problem-label">
                        <!-- LeetCode Number Badge -->
                        <span v-if="problem.leetcode_number" class="leetcode-badge">
                          LC #{{ problem.leetcode_number }}
                        </span>

                        <!-- Problem Name (with link if URL available) -->
                        <a
                          v-if="problem.url"
                          :href="problem.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="problem-name-link"
                        >
                          {{ problem.title || problem.name || problem }}
                        </a>
                        <span v-else class="problem-name">
                          {{ problem.title || problem.name || problem }}
                        </span>

                        <!-- Difficulty Badge -->
                        <span
                          v-if="problem.difficulty"
                          class="problem-difficulty"
                          :class="`difficulty-${(problem.difficulty || '').toLowerCase()}`"
                        >
                          {{ problem.difficulty }}
                        </span>

                        <!-- Estimated Time -->
                        <span v-if="problem.estimated_time || problem.estimated_time_minutes" class="problem-time">
                          ~{{ problem.estimated_time || problem.estimated_time_minutes }}min
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- NEW: Detailed Time-Slotted Daily Schedule -->
                <div v-if="week.detailed_daily_schedules && week.detailed_daily_schedules.length > 0" class="content-section">
                  <div class="section-header-with-meta">
                    <h5 class="section-label">DETAILED DAILY SCHEDULE</h5>
                    <div v-if="week.week_summary" class="week-summary-badges">
                      <span class="summary-badge problems">{{ week.week_summary.totalProblems }} problems</span>
                      <span class="summary-badge hours">{{ week.week_summary.totalHours }}h total</span>
                    </div>
                  </div>
                  <div class="detailed-schedules-list">
                    <DetailedDailySchedule
                      v-for="(daySchedule, dayIdx) in week.detailed_daily_schedules"
                      :key="dayIdx"
                      :schedule="daySchedule"
                      :compact="false"
                    />
                  </div>
                </div>

                <!-- LEGACY: Old Daily Breakdown Section (fallback for old data) -->
                <div v-else-if="week.daily_plan && week.daily_plan.length > 0" class="content-section">
                  <h5 class="section-label">DAILY SCHEDULE</h5>
                  <div class="daily-schedule-grid">
                    <div
                      v-for="(day, dayIdx) in week.daily_plan"
                      :key="dayIdx"
                      class="day-card"
                    >
                      <div class="day-header">
                        <span class="day-name">{{ day.day }}</span>
                        <span class="day-focus">{{ day.focus }}</span>
                      </div>

                      <!-- Morning Session (McKinsey Clean Style) -->
                      <div v-if="day.morning_session" class="session-block-clean">
                        <div class="session-header-clean">
                          <span class="session-title-clean">MORNING</span>
                          <span class="session-duration-clean">({{ day.morning_session.duration_minutes }}min)</span>
                        </div>
                        <div class="session-divider-clean"></div>
                        <p class="session-activity-clean">{{ day.morning_session.activity }}</p>

                        <!-- Topics -->
                        <div v-if="day.morning_session.topics && day.morning_session.topics.length > 0" class="session-topics-clean">
                          <span v-for="(topic, topicIdx) in day.morning_session.topics" :key="topicIdx" class="topic-bullet-clean">
                            • {{ topic }}
                          </span>
                        </div>

                        <!-- Learning Resources -->
                        <div v-if="day.morning_session.resources && day.morning_session.resources.length > 0" class="session-resources-clean">
                          <span class="resources-label-clean">Resources:</span>
                          <span v-for="(resource, resIdx) in day.morning_session.resources" :key="resIdx" class="resource-item-clean">
                            <a
                              v-if="resource.url"
                              :href="resource.url"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="resource-link-clean"
                            >
                              {{ resource.name }}
                            </a>
                            <span v-else>{{ resource.name }}</span>
                            <span v-if="resIdx < day.morning_session.resources.length - 1">, </span>
                          </span>
                        </div>
                      </div>

                      <!-- Afternoon Session (McKinsey Clean Style) -->
                      <div v-if="day.afternoon_session" class="session-block-clean">
                        <div class="session-header-clean">
                          <span class="session-title-clean">AFTERNOON</span>
                          <span class="session-duration-clean">({{ day.afternoon_session.duration_minutes }}min)</span>
                        </div>
                        <div class="session-divider-clean"></div>
                        <p class="session-activity-clean">{{ day.afternoon_session.activity }}</p>

                        <!-- Problems List -->
                        <div v-if="day.afternoon_session.problems && day.afternoon_session.problems.length > 0" class="session-problems-clean">
                          <div
                            v-for="(problem, probIdx) in day.afternoon_session.problems"
                            :key="probIdx"
                            class="problem-row-clean"
                          >
                            <span class="problem-checkbox-clean">☐</span>
                            <span v-if="problem.leetcode_number" class="problem-number-clean">
                              LC #{{ problem.leetcode_number }}
                            </span>
                            <a
                              v-if="problem.url"
                              :href="problem.url"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="problem-name-clean"
                            >
                              {{ problem.name || problem.title }}
                            </a>
                            <span v-else class="problem-name-clean">
                              {{ problem.name || problem.title }}
                            </span>
                            <span v-if="problem.difficulty" class="problem-difficulty-clean">
                              ({{ problem.difficulty }})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button class="mark-complete-btn">Mark Week Complete</button>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Milestones Timeline (Fallback: old format) -->
      <div v-else-if="map.milestones && map.milestones.length > 0" class="milestones-section">
        <h3 class="section-title">🎯 Learning Timeline</h3>

        <div class="timeline-container">
          <!-- Vertical Timeline Line -->
          <div class="timeline-line"></div>

          <!-- Milestone Cards -->
          <div class="milestones-list">
            <MilestoneCard
              v-for="(milestone, idx) in map.milestones"
              :key="idx"
              :milestone="milestone"
              :sourcePostIds="getSourcePostIdsForMilestone(milestone)"
              @view-sources="handleViewSources"
              class="milestone-wrapper"
            />
          </div>
        </div>
      </div>

      <!-- Expected Outcomes -->
      <div v-if="map.outcomes && map.outcomes.length > 0" class="outcomes-section">
        <h3 class="section-title">🎉 Expected Outcomes</h3>
        <ul class="outcomes-list">
          <li v-for="(outcome, idx) in map.outcomes" :key="idx" class="outcome-item">
            {{ outcome }}
          </li>
        </ul>
      </div>

      <!-- Next Steps -->
      <div v-if="map.next_steps && map.next_steps.length > 0" class="next-steps-section">
        <h3 class="section-title">👉 Next Steps</h3>
        <ol class="next-steps-list">
          <li v-for="(step, idx) in map.next_steps" :key="idx" class="next-step-item">
            {{ step }}
          </li>
        </ol>
      </div>

      <!-- Company-Specific Insights -->
      <div v-if="map.company_specific_insights && map.company_specific_insights.length > 0" class="insights-section">
        <h3 class="section-title">🏢 Company-Specific Insights</h3>
        <div class="insights-grid">
          <div
            v-for="(insight, idx) in map.company_specific_insights"
            :key="idx"
            class="insight-card"
          >
            <h4 class="insight-company">{{ insight.company }}</h4>
            <div v-if="insight.focus_areas" class="insight-section">
              <p class="insight-label">Focus Areas:</p>
              <ul class="insight-list">
                <li v-for="(area, i) in insight.focus_areas" :key="i">{{ area }}</li>
              </ul>
            </div>
            <div v-if="insight.common_questions" class="insight-section">
              <p class="insight-label">Common Questions:</p>
              <ul class="insight-list">
                <li v-for="(q, i) in insight.common_questions" :key="i">{{ q }}</li>
              </ul>
            </div>
            <div v-if="insight.tips_from_candidates" class="insight-section">
              <p class="insight-label">Candidate Tips:</p>
              <ul class="insight-list">
                <li v-for="(tip, i) in insight.tips_from_candidates" :key="i">{{ tip }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Pitfalls Narrative (NEW: LLM-synthesized insights) -->
      <div v-if="map.pitfalls_narrative && map.pitfalls_narrative.summary" class="professional-insight-section">
        <div class="insight-header">
          <h3 class="insight-title">Common Pitfalls</h3>
          <p class="insight-subtitle">Insights from {{ map.foundation_posts || map.analysis_count }} analyzed interview experiences</p>
        </div>

        <p class="insight-summary">{{ map.pitfalls_narrative.summary }}</p>

        <div v-if="map.pitfalls_narrative.top_pitfalls && map.pitfalls_narrative.top_pitfalls.length > 0" class="insights-list">
          <div
            v-for="(pitfall, idx) in map.pitfalls_narrative.top_pitfalls"
            :key="idx"
            class="insight-item"
          >
            <div class="insight-item-header">
              <span class="insight-number">{{ idx + 1 }}.</span>
              <h4 class="insight-item-title">{{ (pitfall.title || 'Common Pitfall').toUpperCase() }}</h4>
              <span v-if="pitfall.affected_percentage" class="mention-stat">{{ pitfall.affected_percentage }}</span>
            </div>

            <div class="insight-item-content">
              <p class="insight-explanation">{{ pitfall.explanation }}</p>

              <div v-if="pitfall.how_to_avoid && pitfall.how_to_avoid.length > 0" class="improvement-section">
                <h5 class="improvement-label">HOW TO IMPROVE:</h5>
                <ul class="improvement-list">
                  <li v-for="(action, i) in pitfall.how_to_avoid" :key="i" class="improvement-item">
                    {{ action }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="data-note">
          Data based on {{ map.pitfalls_narrative.data_confidence || 'high' }}-confidence analysis
        </div>
      </div>

      <!-- Common Pitfalls (Raw data - HIDDEN: we now show narrative version above) -->
      <div v-if="false && map.common_pitfalls && map.common_pitfalls.pitfalls && map.common_pitfalls.pitfalls.length > 0" class="pitfalls-section">
        <h3 class="section-title">⚠️ Common Pitfalls to Avoid</h3>
        <p class="section-description">
          Mistakes and rejection reasons identified from {{ map.common_pitfalls.evidence_quality?.posts_analyzed || 0 }} interview experiences. Learn from others' failures to avoid common traps.
        </p>

        <div class="pitfalls-grid">
          <div
            v-for="(pitfall, idx) in map.common_pitfalls.pitfalls"
            :key="idx"
            class="pitfall-card"
            :class="`severity-${pitfall.severity?.toLowerCase() || 'medium'}`"
          >
            <div class="pitfall-header">
              <span class="pitfall-icon">
                {{ pitfall.severity === 'High' ? '🔴' : pitfall.severity === 'Medium' ? '🟡' : '🟢' }}
              </span>
              <span class="pitfall-category">{{ pitfall.category || 'General' }}</span>
              <span class="pitfall-mentions">{{ pitfall.mention_count }} mentions</span>
            </div>
            <p class="pitfall-text">{{ pitfall.pitfall }}</p>
            <button
              v-if="pitfall.source_post_ids && pitfall.source_post_ids.length > 0"
              @click="handleViewSources(pitfall.source_post_ids)"
              class="pitfall-sources-btn"
            >
              View {{ pitfall.source_post_ids.length }} sources
            </button>
          </div>
        </div>

        <div v-if="map.common_pitfalls.evidence_quality" class="evidence-badge">
          <span class="evidence-label">Data Quality:</span>
          <span class="evidence-value">{{ map.common_pitfalls.evidence_quality.confidence || 'low' }}</span>
          <span class="evidence-posts">{{ map.common_pitfalls.evidence_quality.posts_analyzed }}/{{ map.common_pitfalls.evidence_quality.total_posts }} posts</span>
        </div>
      </div>

      <!-- Readiness Checklist (Raw data - HIDDEN: we now show narrative version above) -->
      <div v-if="false && map.readiness_checklist && map.readiness_checklist.checklist_items && map.readiness_checklist.checklist_items.length > 0" class="checklist-section">
        <h3 class="section-title">✅ Interview Readiness Checklist</h3>
        <p class="section-description">
          Key strengths and areas for improvement identified from {{ map.readiness_checklist.evidence_quality?.posts_analyzed || 0 }} successful and failed interview experiences.
        </p>

        <div class="checklist-categories">
          <!-- Strengths (must_have) -->
          <div class="checklist-category">
            <h4 class="category-header strength-header">
              <span class="category-icon">💪</span>
              Must Have Strengths
            </h4>
            <div class="checklist-items">
              <div
                v-for="(item, idx) in map.readiness_checklist.checklist_items.filter(i => i.status === 'must_have')"
                :key="`strength-${idx}`"
                class="checklist-item strength-item"
                :class="`priority-${item.priority?.toLowerCase() || 'important'}`"
              >
                <div class="item-header">
                  <span class="item-checkbox">✓</span>
                  <span class="item-text">{{ item.item }}</span>
                  <span class="item-priority">{{ item.priority || 'Important' }}</span>
                </div>
                <div class="item-footer">
                  <span class="item-category">{{ item.category || 'Technical' }}</span>
                  <span class="item-mentions">{{ item.mention_count }} mentions</span>
                  <button
                    v-if="item.source_post_ids && item.source_post_ids.length > 0"
                    @click="handleViewSources(item.source_post_ids)"
                    class="item-sources-btn"
                  >
                    {{ item.source_post_ids.length }} sources
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Areas to Improve (need_work) -->
          <div class="checklist-category">
            <h4 class="category-header improvement-header">
              <span class="category-icon">📈</span>
              Need to Improve
            </h4>
            <div class="checklist-items">
              <div
                v-for="(item, idx) in map.readiness_checklist.checklist_items.filter(i => i.status === 'need_work')"
                :key="`improvement-${idx}`"
                class="checklist-item improvement-item"
              >
                <div class="item-header">
                  <span class="item-checkbox">○</span>
                  <span class="item-text">{{ item.item }}</span>
                  <span class="item-priority">{{ item.priority || 'Important' }}</span>
                </div>
                <div class="item-footer">
                  <span class="item-category">{{ item.category || 'Technical' }}</span>
                  <span class="item-mentions">{{ item.mention_count }} mentions</span>
                  <button
                    v-if="item.source_post_ids && item.source_post_ids.length > 0"
                    @click="handleViewSources(item.source_post_ids)"
                    class="item-sources-btn"
                  >
                    {{ item.source_post_ids.length }} sources
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="map.readiness_checklist.evidence_quality" class="evidence-badge">
          <span class="evidence-label">Data Quality:</span>
          <span class="evidence-value">{{ map.readiness_checklist.evidence_quality.confidence || 'low' }}</span>
          <span class="evidence-posts">{{ map.readiness_checklist.evidence_quality.posts_analyzed }}/{{ map.readiness_checklist.evidence_quality.total_posts }} posts</span>
        </div>
      </div>

      <!-- Improvement Areas Narrative (McKinsey Clean Design) -->
      <div v-if="map.improvement_areas && map.improvement_areas.summary" class="mckinsey-section">
        <div class="mckinsey-header">
          <h3 class="mckinsey-title">STRATEGIC IMPROVEMENT RECOMMENDATIONS</h3>
          <p class="mckinsey-subtitle">Based on {{ map.foundation_posts || map.analysis_count }} interview experiences</p>
        </div>

        <div class="mckinsey-divider"></div>

        <p class="mckinsey-summary">{{ map.improvement_areas.summary }}</p>

        <div v-if="map.improvement_areas.priority_skills && map.improvement_areas.priority_skills.length > 0" class="mckinsey-items">
          <div v-for="(skill, idx) in map.improvement_areas.priority_skills" :key="idx" class="mckinsey-item">
            <div class="mckinsey-item-header">
              <h4 class="mckinsey-item-title">{{ idx + 1 }}. {{ (skill.skill_area || skill.skill || 'Unknown Skill').toUpperCase() }}</h4>
              <span v-if="skill.priority" class="mckinsey-priority">{{ skill.priority }}</span>
            </div>

            <div class="mckinsey-divider-thin"></div>

            <div v-if="skill.action_plan && skill.action_plan.length > 0" class="mckinsey-action-items">
              <div v-for="(action, i) in skill.action_plan" :key="i" class="mckinsey-action">
                <template v-if="typeof action === 'object' && action !== null && action.step">
                  <p class="mckinsey-action-title">{{ action.step }}</p>

                  <div v-if="action.resources && action.resources.length > 0" class="mckinsey-details">
                    <div v-for="(resource, j) in action.resources" :key="j" class="mckinsey-detail-line">
                      <span class="mckinsey-label">• Resource:</span>
                      <a
                        v-if="resource.url"
                        :href="resource.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mckinsey-link"
                      >
                        {{ resource.name }}
                      </a>
                      <span v-else>{{ resource.name }}</span>
                    </div>
                    <div v-for="(resource, j) in action.resources" :key="'desc-' + j" class="mckinsey-detail-line">
                      <span class="mckinsey-label">• Action:</span>
                      <span>{{ resource.description }}</span>
                    </div>
                  </div>

                  <div v-if="action.timeline" class="mckinsey-detail-line">
                    <span class="mckinsey-label">• Timeline:</span>
                    <span>{{ action.timeline }}</span>
                  </div>

                  <div v-if="action.success_pattern" class="mckinsey-detail-line">
                    <span class="mckinsey-label">• Evidence:</span>
                    <span>{{ action.success_pattern }}</span>
                  </div>
                </template>

                <template v-else>
                  <p class="mckinsey-action-simple">• {{ typeof action === 'string' ? action : (action.step || JSON.stringify(action)) }}</p>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="mckinsey-divider"></div>
      </div>

      <!-- Resource Recommendations Narrative (McKinsey Clean Design) -->
      <div v-if="map.resource_recommendations && map.resource_recommendations.summary" class="mckinsey-section">
        <div class="mckinsey-header">
          <h3 class="mckinsey-title">HOW TO USE LEARNING RESOURCES EFFECTIVELY</h3>
          <p class="mckinsey-subtitle">Based on {{ map.foundation_posts || map.analysis_count }} interview experiences</p>
        </div>

        <div class="mckinsey-divider"></div>

        <p class="mckinsey-summary">{{ map.resource_recommendations.summary }}</p>

        <div v-if="map.resource_recommendations.ranked_resources && map.resource_recommendations.ranked_resources.length > 0" class="mckinsey-items">
          <div v-for="(resource, idx) in map.resource_recommendations.ranked_resources" :key="idx" class="mckinsey-item">
            <div class="mckinsey-item-header">
              <h4 class="mckinsey-item-title">
                {{ idx + 1 }}.
                <a
                  v-if="resource.url"
                  :href="resource.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mckinsey-link"
                >
                  {{ (resource.resource_name || resource.name || 'Learning Resource').toUpperCase() }}
                </a>
                <span v-else>{{ (resource.resource_name || resource.name || 'Learning Resource').toUpperCase() }}</span>
              </h4>
            </div>

            <div class="mckinsey-divider-thin"></div>

            <div v-if="resource.action_plan && resource.action_plan.length > 0" class="mckinsey-action-items">
              <div v-for="(action, i) in resource.action_plan" :key="i" class="mckinsey-action">
                <p class="mckinsey-action-title">{{ action.step }}</p>

                <div v-if="action.resources && action.resources.length > 0" class="mckinsey-details">
                  <div v-for="(res, j) in action.resources" :key="j" class="mckinsey-detail-line">
                    <span class="mckinsey-label">• Resource:</span>
                    <a
                      v-if="res.url"
                      :href="res.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mckinsey-link"
                    >
                      {{ res.name }}
                    </a>
                    <span v-else>{{ res.name }}</span>
                  </div>
                  <div v-for="(res, j) in action.resources" :key="'desc-' + j" class="mckinsey-detail-line">
                    <span class="mckinsey-label">• Action:</span>
                    <span>{{ res.description }}</span>
                  </div>
                </div>

                <div v-if="action.timeline" class="mckinsey-detail-line">
                  <span class="mckinsey-label">• Timeline:</span>
                  <span>{{ action.timeline }}</span>
                </div>

                <div v-if="action.success_pattern" class="mckinsey-detail-line">
                  <span class="mckinsey-label">• Evidence:</span>
                  <span>{{ action.success_pattern }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mckinsey-divider"></div>
      </div>

      <!-- Preparation Expectations Narrative (NEW: LLM-synthesized timeline expectations) -->
      <div v-if="map.preparation_expectations && map.preparation_expectations.summary" class="professional-insight-section">
        <div class="insight-header">
          <h3 class="insight-title">Realistic Preparation Timeline</h3>
          <p class="insight-subtitle">Insights from {{ map.foundation_posts || map.analysis_count }} analyzed interview experiences</p>
        </div>

        <p class="insight-summary">{{ map.preparation_expectations.summary }}</p>

        <div class="insights-list">
          <div v-if="map.preparation_expectations.realistic_timeline" class="insight-item">
            <div class="insight-item-header">
              <h4 class="insight-item-title">REALISTIC TIMELINE</h4>
            </div>
            <div class="insight-item-content">
              <p class="insight-explanation">{{ map.preparation_expectations.realistic_timeline }}</p>
            </div>
          </div>

          <div v-if="map.preparation_expectations.success_indicators && map.preparation_expectations.success_indicators.length > 0" class="insight-item">
            <div class="insight-item-header">
              <h4 class="insight-item-title">SUCCESS INDICATORS</h4>
            </div>
            <div class="insight-item-content">
              <ul class="improvement-list">
                <li v-for="(indicator, i) in map.preparation_expectations.success_indicators" :key="i" class="improvement-item">
                  {{ indicator }}
                </li>
              </ul>
            </div>
          </div>

          <div v-if="map.preparation_expectations.common_mistakes && map.preparation_expectations.common_mistakes.length > 0" class="insight-item">
            <div class="insight-item-header">
              <h4 class="insight-item-title">COMMON MISTAKES TO AVOID</h4>
            </div>
            <div class="insight-item-content">
              <ul class="improvement-list">
                <li v-for="(mistake, i) in map.preparation_expectations.common_mistakes" :key="i" class="improvement-item">
                  {{ mistake }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="map.preparation_expectations.data_confidence" class="data-note">
          Data based on {{ map.preparation_expectations.data_confidence }}-confidence analysis
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>No learning map selected</p>
    </div>

    <!-- Source Posts Modal -->
    <SourcePostsModal
      :isOpen="isSourceModalOpen"
      :posts="selectedSourcePosts"
      @close="closeSourceModal"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch, onMounted } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useLearningMapStore } from '@/stores/learningMapStore'
import { useUIStore } from '@/stores/uiStore'
import LearningMapHeader from '@/components/LearningMap/LearningMapHeader.vue'
import MilestoneCard from '@/components/LearningMap/MilestoneCard.vue'
import SourcePostsModal from '@/components/LearningMap/SourcePostsModal.vue'
import DetailedDailySchedule from '@/components/LearningMap/DetailedDailySchedule.vue'

interface Props {
  mapId: string
}

const props = defineProps<Props>()

const uiStore = useUIStore()

const learningMapStore = useLearningMapStore()
const loading = ref(true)
const expandedWeeks = ref<number[]>([]) // Track which weeks are expanded

// Get map from store
const map = computed(() => {
  console.log('[LearningMapViewer] Looking for map with ID:', props.mapId, 'type:', typeof props.mapId)
  console.log('[LearningMapViewer] Available maps:', learningMapStore.maps.map(m => ({ id: m.id, type: typeof m.id })))
  const foundMap = learningMapStore.maps.find(m => m.id === props.mapId)
  console.log('[LearningMapViewer] Found map:', foundMap ? 'YES' : 'NO')
  if (foundMap) {
    console.log('[LearningMapViewer] Map data check:', {
      hasMilestones: !!foundMap.milestones,
      milestonesCount: foundMap.milestones?.length,
      hasAnalytics: !!foundMap.analytics,
      hasCompanyTracks: !!foundMap.company_tracks
    })
  }
  return foundMap
})

// Accordion functions
function toggleWeek(index: number) {
  const position = expandedWeeks.value.indexOf(index)
  if (position > -1) {
    expandedWeeks.value.splice(position, 1)
  } else {
    expandedWeeks.value.push(index)
  }
}

function calculateTotalHours(weeks: any[]) {
  return weeks.reduce((total, week) => total + calculateWeekHours(week), 0)
}

function calculateWeekHours(week: any) {
  if (!week.daily_plan || !Array.isArray(week.daily_plan)) return 0
  return week.daily_plan.reduce((total: number, day: any) => {
    return total + (day.total_study_hours || 0)
  }, 0)
}

function calculateCompletionPercentage(weeks: any[]) {
  // Mock data - in real app, track completed topics/problems
  return 0
}

function getWeekProgress(week: any) {
  // Mock data - in real app, calculate based on completed items
  return 0
}

function getWeekTopics(week: any) {
  if (!week.daily_plan || !Array.isArray(week.daily_plan)) return []

  const topics = new Set<string>()
  week.daily_plan.forEach((day: any) => {
    if (day.morning_session?.topics) {
      day.morning_session.topics.forEach((t: string) => topics.add(t))
    }
    if (day.afternoon_session?.topics) {
      day.afternoon_session.topics.forEach((t: string) => topics.add(t))
    }
  })

  return Array.from(topics)
}

function getWeekProblems(week: any) {
  if (!week.daily_plan || !Array.isArray(week.daily_plan)) return []

  const problems: any[] = []
  week.daily_plan.forEach((day: any) => {
    if (day.afternoon_session?.problems) {
      problems.push(...day.afternoon_session.problems)
    }
  })

  // Deduplicate by title
  const seen = new Set()
  return problems.filter(p => {
    const title = p.title || p.name || p
    if (seen.has(title)) return false
    seen.add(title)
    return true
  })
}

// Set active map when component mounts
onMounted(() => {
  console.log('[LearningMapViewer] Component mounted with mapId:', props.mapId)
  learningMapStore.setActiveMap(props.mapId)
  loading.value = false
})

// Update active map when mapId changes
watch(() => props.mapId, (newId) => {
  if (newId) {
    learningMapStore.setActiveMap(newId)
  }
})

const isSourceModalOpen = ref(false)
const selectedSourcePosts = ref<any[]>([])

function getSourcePostIdsForMilestone(milestone: any): string[] {
  // Check if map has milestone-specific mappings from backend
  if (map.value?.milestone_source_mapping) {
    const weekKey = `week_${milestone.week}`
    const postIds = map.value.milestone_source_mapping[weekKey]
    if (postIds && postIds.length > 0) {
      return postIds
    }
  }

  // Fallback: if milestone has embedded sourcePostIds
  if (milestone.sourcePostIds && milestone.sourcePostIds.length > 0) {
    return milestone.sourcePostIds
  }

  // Last resort: return empty array (don't show all posts)
  return []
}

async function handleViewSources(postIds: string[]) {
  if (!postIds || postIds.length === 0) {
    console.warn('[LearningMapViewer] No post IDs provided')
    return
  }

  console.log('[LearningMapViewer] Fetching', postIds.length, 'posts from API')

  const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'

  try {
    // Fetch posts from backend API
    const response = await fetch(`${apiGatewayUrl}/api/content/posts/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ postIds })
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success && data.posts) {
      selectedSourcePosts.value = data.posts
      console.log('[LearningMapViewer] Loaded', data.posts.length, 'source posts')
      isSourceModalOpen.value = true
    } else {
      console.error('[LearningMapViewer] Failed to load posts:', data)
    }
  } catch (error) {
    console.error('[LearningMapViewer] Error fetching source posts:', error)
  }
}

function closeSourceModal() {
  isSourceModalOpen.value = false
  selectedSourcePosts.value = []
}

function handleBack() {
  uiStore.showLearningMapsList()
}

function downloadPDF() {
  // TODO: Implement PDF download using jsPDF
  console.log('Download PDF:', map.value)
  alert('PDF download will be implemented in the next phase')
}

function downloadICS() {
  // TODO: Implement ICS calendar download
  console.log('Download ICS:', map.value)
  alert('Calendar download will be implemented in the next phase')
}
</script>

<style scoped>
/* === PROFESSIONAL MCKINSEY-STYLE THEME === */

.learning-map-viewer {
  @apply h-full overflow-y-auto;
  background: #F9FAFB;
  background-attachment: fixed;
}

/* Remove paper texture - clean professional look */
.learning-map-viewer::before {
  display: none;
}

/* Viewer Header with Back Button */
.viewer-header {
  padding: 20px 32px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  cursor: pointer;
}

.back-btn:hover {
  background: #F9FAFB;
  border-color: #1E3A5F;
  color: #1E3A5F;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6B7280;
}

.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid #E5E7EB;
  border-top-color: #1E3A5F;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Map Content */
.map-content {
  @apply space-y-6 relative;
}

/* Map Info */
.map-info {
  padding: 32px;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 32px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
}

.map-info-left {
  flex: 1;
}

.map-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
  line-height: 1.3;
}

.map-summary {
  font-size: 15px;
  color: #4B5563;
  line-height: 1.7;
}

.map-info-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.map-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  font-family: 'Inter', -apple-system, sans-serif;
}

.timeline-badge {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #93C5FD;
}

.difficulty-badge {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #BFDBFE;
}

.crazy-badge {
  background: #FEE2E2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  background: #1E3A5F;
  color: #FFFFFF;
  border: none;
  box-shadow: 0 2px 4px rgba(30, 58, 95, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
  font-family: 'Inter', -apple-system, sans-serif;
}

.action-btn:hover {
  background: #2C5282;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 58, 95, 0.25);
}

/* Clean Minimal Header (New Design) */
.map-info-clean {
  padding: 32px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.map-header-clean {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-title-clean {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.map-summary-clean {
  font-size: 16px;
  color: #4B5563;
  line-height: 1.7;
  max-width: 900px;
}

.map-meta-clean {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-badge-clean {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  border-radius: 4px;
  font-family: 'Inter', -apple-system, sans-serif;
  background: #F3F4F6;
  color: #6B7280;
  border: 1px solid #E5E7EB;
}

.meta-badge-clean.difficulty {
  background: #F9FAFB;
  color: #374151;
}

/* Milestones Section */
.milestones-section {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E5E7EB;
}

.timeline-container {
  position: relative;
}

.timeline-line {
  position: absolute;
  left: 24px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #E5E7EB;
}

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-left: 64px;
}

.milestone-wrapper {
  position: relative;
}

.milestone-wrapper::before {
  content: '';
  position: absolute;
  left: -40px;
  top: 24px;
  width: 12px;
  height: 12px;
  background: #1E3A5F;
  border-radius: 50%;
  border: 3px solid #F9FAFB;
  box-shadow: 0 0 0 2px #E5E7EB;
}

/* Outcomes Section */
.outcomes-section {
  padding: 32px;
  background: #FFFFFF;
  border-top: 1px solid #E5E7EB;
}

.outcomes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: disc;
  padding-left: 24px;
}

.outcome-item {
  font-size: 15px;
  color: #374151;
  line-height: 1.7;
}

/* Next Steps Section */
.next-steps-section {
  padding: 32px;
  background: #F9FAFB;
  border-top: 1px solid #E5E7EB;
}

.next-steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: decimal;
  padding-left: 24px;
}

.next-step-item {
  font-size: 15px;
  color: #374151;
  line-height: 1.7;
}

/* Company-Specific Insights */
.insights-section {
  padding: 32px;
  background: #FFFFFF;
  border-top: 1px solid #E5E7EB;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.insight-card {
  padding: 24px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
}

.insight-company {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.insight-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.insight-label {
  font-size: 11px;
  font-weight: 700;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.insight-list {
  font-size: 14px;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: disc;
  padding-left: 20px;
  line-height: 1.6;
}

/* === MCKINSEY CLEAN DESIGN (New Simplified Style) === */
.mckinsey-section {
  padding: 48px 40px;
  background: #FFFFFF;
  border-top: 1px solid #E5E7EB;
}

.mckinsey-header {
  margin-bottom: 16px;
}

.mckinsey-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1E3A8A;
  letter-spacing: 0.05em;
  margin: 0;
}

.mckinsey-subtitle {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 13px;
  color: #6B7280;
  margin: 6px 0 0 0;
}

.mckinsey-divider {
  height: 2px;
  background: #E5E7EB;
  margin: 24px 0;
}

.mckinsey-divider-thin {
  height: 1px;
  background: #E5E7EB;
  margin: 16px 0;
}

.mckinsey-summary {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  margin: 0 0 32px 0;
}

.mckinsey-items {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.mckinsey-item {
  display: flex;
  flex-direction: column;
}

.mckinsey-item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.mckinsey-item-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: 0.02em;
}

.mckinsey-priority {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 13px;
  color: #6B7280;
  font-weight: 400;
  text-transform: capitalize;
}

.mckinsey-action-items {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.mckinsey-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mckinsey-action-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 8px 0;
}

.mckinsey-action-simple {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.mckinsey-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 8px;
}

.mckinsey-detail-line {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.mckinsey-label {
  font-weight: 500;
  color: #6B7280;
  margin-right: 6px;
}

.mckinsey-link {
  color: #3B82F6;
  text-decoration: underline;
  text-decoration-style: solid;
  text-underline-offset: 2px;
  transition: color 0.15s ease;
}

.mckinsey-link:hover {
  color: #2563EB;
}

/* === PROFESSIONAL INSIGHT SECTIONS (McKinsey Style) === */
.professional-insight-section {
  padding: 40px 32px;
  background: #FFFFFF;
  border-top: 1px solid #E5E7EB;
}

.insight-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #1E3A5F;
}

.insight-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1E3A5F;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.insight-subtitle {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.insight-summary {
  font-size: 15px;
  color: #374151;
  line-height: 1.7;
  margin-bottom: 28px;
  padding: 16px;
  background: #F9FAFB;
  border-left: 3px solid #1E3A5F;
  border-radius: 4px;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.insight-item {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  transition: all 0.2s ease;
}

.insight-item:hover {
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.08);
  border-color: #1E3A5F;
}

.insight-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.insight-number {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1E3A5F;
  min-width: 32px;
}

.insight-item-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  flex: 1;
  letter-spacing: 0.02em;
}

.mention-stat {
  font-size: 12px;
  color: #6B7280;
  padding: 4px 10px;
  background: #F3F4F6;
  border-radius: 12px;
  font-weight: 600;
}

.insight-item-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insight-explanation {
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
}

.improvement-section {
  margin-top: 12px;
}

.improvement-label {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.improvement-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 0;
  list-style: none;
}

.improvement-item {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  padding-left: 20px;
  position: relative;
}

.improvement-item::before {
  content: '•';
  position: absolute;
  left: 8px;
  color: #1E3A5F;
  font-weight: 700;
}

/* New: Nested action plan with resources */
.action-step-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-step-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  font-weight: 500;
}

.action-resources {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 12px;
  border-left: 2px solid #DBEAFE;
  margin-left: 4px;
}

.resource-label {
  font-size: 12px;
  font-weight: 600;
  color: #1E3A5F;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.resource-list-inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  padding-left: 0;
}

.resource-item-inline {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.resource-link-inline {
  color: #1E40AF;
  text-decoration: underline;
  text-decoration-style: solid;
  text-underline-offset: 2px;
  transition: color 0.15s ease;
  font-weight: 500;
}

.resource-link-inline:hover {
  color: #2563EB;
}

.resource-name-inline {
  font-weight: 500;
  color: #1E3A5F;
}

.resource-description {
  color: #6B7280;
  font-size: 12px;
  margin-left: 4px;
}

.action-timeline {
  font-size: 12px;
  color: #6B7280;
  padding-left: 12px;
  margin: 0;
}

.timeline-label-inline {
  font-weight: 600;
  color: #1E3A5F;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.action-success-pattern {
  font-size: 12px;
  color: #059669;
  padding: 6px 10px;
  background: #D1FAE5;
  border-left: 2px solid #10B981;
  border-radius: 4px;
  margin: 4px 0 0 0;
}

.success-label-inline {
  font-weight: 600;
  color: #047857;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.timeline-note {
  font-size: 13px;
  color: #6B7280;
  font-style: italic;
  padding: 10px 14px;
  background: #F9FAFB;
  border-left: 2px solid #D1D5DB;
  border-radius: 4px;
}

.data-note {
  margin-top: 24px;
  padding: 12px 16px;
  background: #F3F4F6;
  border-radius: 6px;
  font-size: 12px;
  color: #6B7280;
  text-align: center;
  font-weight: 500;
}

/* Common Pitfalls (NEW: Rich cards) */
.pitfalls-section {
  padding: 40px 32px;
  background: #FEF2F2;
  border-top: 1px solid #E5E7EB;
}

.pitfalls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.pitfall-card {
  background: white;
  border: 2px solid #FCA5A5;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.pitfall-card:hover {
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.15);
  transform: translateY(-2px);
}

.pitfall-card.severity-high {
  border-color: #EF4444;
  background: linear-gradient(135deg, #FEF2F2 0%, white 100%);
}

.pitfall-card.severity-medium {
  border-color: #F59E0B;
  background: linear-gradient(135deg, #FFFBEB 0%, white 100%);
}

.pitfall-card.severity-low {
  border-color: #10B981;
  background: linear-gradient(135deg, #ECFDF5 0%, white 100%);
}

.pitfall-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.pitfall-icon {
  font-size: 18px;
}

.pitfall-category {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
}

.pitfall-mentions {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 4px 10px;
  border-radius: 12px;
}

.pitfall-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  margin: 0 0 14px 0;
}

.pitfall-sources-btn {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #3B82F6;
  background: transparent;
  border: 1px solid #3B82F6;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pitfall-sources-btn:hover {
  background: #3B82F6;
  color: white;
}

/* Readiness Checklist (NEW) */
.checklist-section {
  padding: 40px 32px;
  background: #F0FDF4;
  border-top: 1px solid #E5E7EB;
}

.checklist-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 32px;
  margin-top: 28px;
}

.checklist-category {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 2px solid #E5E7EB;
}

.category-header {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E5E7EB;
}

.strength-header {
  color: #059669;
}

.improvement-header {
  color: #DC2626;
}

.category-icon {
  font-size: 22px;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.checklist-item {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.checklist-item:hover {
  border-color: #3B82F6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.strength-item {
  border-left: 4px solid #10B981;
  background: linear-gradient(90deg, #ECFDF5 0%, #F9FAFB 100%);
}

.strength-item.priority-critical {
  border-left-color: #059669;
  border-left-width: 6px;
}

.improvement-item {
  border-left: 4px solid #F59E0B;
  background: linear-gradient(90deg, #FFFBEB 0%, #F9FAFB 100%);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.item-checkbox {
  font-size: 18px;
  font-weight: 700;
  color: #10B981;
}

.improvement-item .item-checkbox {
  color: #F59E0B;
}

.item-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  flex: 1;
  line-height: 1.5;
}

.item-priority {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: white;
  background: #6B7280;
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-critical .item-priority {
  background: #DC2626;
}

.priority-important .item-priority {
  background: #F59E0B;
}

.priority-recommended .item-priority {
  background: #3B82F6;
}

.item-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.item-category {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  background: #F3F4F6;
  padding: 4px 10px;
  border-radius: 8px;
}

.item-mentions {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #9CA3AF;
}

.item-sources-btn {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #3B82F6;
  background: transparent;
  border: 1px solid #3B82F6;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
}

.item-sources-btn:hover {
  background: #3B82F6;
  color: white;
}

/* Evidence Badge (shared by both sections) */
.evidence-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding: 12px 20px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}

.evidence-label {
  font-weight: 600;
  color: #6B7280;
}

.evidence-value {
  font-weight: 700;
  color: #059669;
  text-transform: capitalize;
  background: #ECFDF5;
  padding: 4px 12px;
  border-radius: 12px;
}

.evidence-posts {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: #9CA3AF;
  margin-left: auto;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6B7280;
}

/* === NEW: NARRATIVE SECTIONS STYLES === */

/* Shared Narrative Section Styles */
.narrative-section {
  padding: 40px 32px;
  background: #FFFFFF;
  border-top: 1px solid #E5E7EB;
}

.pitfalls-narrative-section {
  background: linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%);
}

.improvement-areas-section {
  background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%);
}

.resources-narrative-section {
  background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%);
}

.expectations-section {
  background: linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%);
}

.narrative-summary {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 32px;
  padding: 20px;
  background: white;
  border-left: 4px solid #1E3A5F;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.narrative-items {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.narrative-card {
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}

.narrative-card:hover {
  box-shadow: 0 8px 24px rgba(30, 58, 95, 0.12);
  transform: translateY(-2px);
}

.pitfall-narrative-card.severity-critical {
  border-color: #EF4444;
  background: linear-gradient(135deg, #FEF2F2 0%, white 100%);
}

.pitfall-narrative-card.severity-high {
  border-color: #F59E0B;
  background: linear-gradient(135deg, #FFFBEB 0%, white 100%);
}

.pitfall-narrative-card.severity-medium {
  border-color: #3B82F6;
  background: linear-gradient(135deg, #EFF6FF 0%, white 100%);
}

.improvement-card.priority-critical {
  border-color: #DC2626;
  border-left-width: 6px;
}

.improvement-card.priority-high {
  border-color: #F59E0B;
  border-left-width: 6px;
}

.narrative-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E5E7EB;
}

.narrative-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.narrative-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  flex: 1;
  line-height: 1.4;
}

.affected-badge,
.priority-badge,
.effectiveness-badge {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.affected-badge {
  background: #FEE2E2;
  color: #DC2626;
}

.priority-badge {
  background: #DBEAFE;
  color: #1E40AF;
}

.effectiveness-badge {
  background: #D1FAE5;
  color: #059669;
  font-family: 'JetBrains Mono', monospace;
}

.narrative-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.narrative-subsection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subsection-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.narrative-text {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  padding-left: 0;
}

.action-item {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  padding-left: 28px;
  position: relative;
}

.action-item::before {
  content: '→';
  position: absolute;
  left: 8px;
  color: #1E3A5F;
  font-weight: 700;
}

.warning-list .action-item::before {
  content: '⚠️';
  font-size: 14px;
}

.timeline-info,
.success-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 8px;
  margin-top: 8px;
}

.timeline-icon,
.success-icon {
  font-size: 16px;
}

.timeline-text,
.success-text {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
}

.confidence-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #6B7280;
}

.confidence-badge strong {
  color: #059669;
  text-transform: capitalize;
}

/* === NEW: PROFESSIONAL ACCORDION TIMELINE (McKinsey Style) === */

.professional-timeline-section {
  padding: 40px 32px;
  background: #FFFFFF;
  border-top: 1px solid #E5E7EB;
}

.timeline-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid #1E3A8A;
}

.timeline-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #1E3A8A;
  margin-bottom: 12px;
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #6B7280;
}

.meta-item {
  font-weight: 500;
}

.meta-separator {
  color: #D1D5DB;
}

/* Accordion Container */
.accordion-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.accordion-item {
  background: white;
  border: 1px solid #E5E7EB;
  transition: all 0.2s ease;
}

.accordion-item.is-expanded {
  border-color: #1E3A8A;
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.08);
}

/* Accordion Header (Collapsed State) */
.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.accordion-header:hover {
  background: #F9FAFB;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.chevron {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #6B7280;
  width: 12px;
  transition: transform 0.2s ease;
}

.week-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #6B7280;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.week-title-text {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.week-hours {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
  min-width: 40px;
  text-align: right;
}

/* Progress Bar */
.progress-bar {
  width: 120px;
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1E3A8A;
  transition: width 0.3s ease;
}

.progress-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  min-width: 40px;
  text-align: right;
}

/* Accordion Content (Expanded State) */
.accordion-content {
  padding: 24px 20px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
}

.week-description {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-left: 3px solid #1E3A8A;
  border-radius: 2px;
}

/* Content Sections */
.content-section {
  margin-bottom: 24px;
}

.section-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

/* Topics Grid */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.topic-item:hover {
  border-color: #1E3A8A;
  background: #F9FAFB;
}

.topic-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #D1D5DB;
  border-radius: 3px;
  cursor: pointer;
  appearance: none;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.topic-checkbox:checked {
  background: #1E3A8A;
  border-color: #1E3A8A;
}

.topic-checkbox:checked::after {
  content: '✓';
  display: block;
  color: white;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 14px;
}

.topic-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  flex: 1;
}

/* Problems List */
.problems-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.problem-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.problem-item:hover {
  border-color: #1E3A8A;
  background: #F9FAFB;
}

.problem-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #D1D5DB;
  border-radius: 3px;
  cursor: pointer;
  appearance: none;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.problem-checkbox:checked {
  background: #1E3A8A;
  border-color: #1E3A8A;
}

.problem-checkbox:checked::after {
  content: '✓';
  display: block;
  color: white;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 14px;
}

.problem-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.problem-name {
  flex: 1;
}

.problem-difficulty {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.problem-difficulty.difficulty-easy {
  background: #D1FAE5;
  color: #059669;
}

.problem-difficulty.difficulty-medium {
  background: #FEF3C7;
  color: #D97706;
}

.problem-difficulty.difficulty-hard {
  background: #FEE2E2;
  color: #DC2626;
}

/* LeetCode Badge */
.leetcode-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  background: #EFF6FF;
  color: #1E40AF;
  border-radius: 4px;
  border: 1px solid #DBEAFE;
  margin-right: 8px;
}

/* Problem Name Link */
.problem-name-link {
  color: #1E40AF;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.15s ease;
  flex: 1;
}

.problem-name-link:hover {
  color: #2563EB;
  text-decoration: underline;
}

/* Problem Time */
.problem-time {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 400;
  margin-left: auto;
}

/* NEW: Detailed Daily Schedules */
.section-header-with-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.week-summary-badges {
  display: flex;
  gap: 8px;
}

.summary-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.summary-badge.problems {
  background: #DCFCE7;
  color: #166534;
}

.summary-badge.hours {
  background: #DBEAFE;
  color: #1E40AF;
}

.dark .summary-badge.problems {
  background: rgba(22, 101, 52, 0.2);
  color: #86EFAC;
}

.dark .summary-badge.hours {
  background: rgba(30, 64, 175, 0.2);
  color: #93C5FD;
}

.detailed-schedules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Daily Schedule Grid (Legacy) */
.daily-schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.day-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.day-card:hover {
  border-color: #1E3A8A;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E5E7EB;
}

.day-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #1E3A8A;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.day-focus {
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  background: #F3F4F6;
  padding: 4px 8px;
  border-radius: 4px;
}

/* McKinsey Clean Session Blocks */
.session-block-clean {
  margin-bottom: 16px;
}

.session-header-clean {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.session-title-clean {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #111827;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.session-duration-clean {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #6B7280;
}

.session-divider-clean {
  height: 1px;
  background: #E5E7EB;
  margin-bottom: 8px;
}

.session-activity-clean {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 10px;
}

/* Session Topics - Clean Typography */
.session-topics-clean {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.topic-bullet-clean {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #374151;
  line-height: 1.5;
}

/* Session Resources - Inline Clean Style */
.session-resources-clean {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #374151;
  line-height: 1.6;
  margin-top: 8px;
}

.resources-label-clean {
  font-weight: 500;
  color: #6B7280;
}

.resource-item-clean {
  color: #374151;
}

.resource-link-clean {
  color: #1E40AF;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.resource-link-clean:hover {
  color: #2563EB;
  text-decoration: underline;
}

/* Session Problems - Clean Table Style */
.session-problems-clean {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.problem-row-clean {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.6;
}

.problem-checkbox-clean {
  color: #6B7280;
  font-size: 14px;
  flex-shrink: 0;
}

.problem-number-clean {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  flex-shrink: 0;
}

.problem-name-clean {
  color: #1E40AF;
  text-decoration: none;
  font-weight: 500;
  flex: 1;
  transition: color 0.15s ease;
}

.problem-name-clean:hover {
  color: #2563EB;
  text-decoration: underline;
}

.problem-difficulty-clean {
  font-size: 12px;
  color: #6B7280;
  font-weight: 400;
  flex-shrink: 0;
}

/* Mark Complete Button */
.mark-complete-btn {
  width: 100%;
  padding: 12px 20px;
  margin-top: 20px;
  background: #1E3A8A;
  color: white;
  border: none;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mark-complete-btn:hover {
  background: #1E40AF;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 58, 138, 0.2);
}

/* Accordion Transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 1024px) {
  .map-info {
    flex-direction: column;
  }

  .map-info-right {
    align-items: flex-start;
    width: 100%;
  }

  .skills-metadata {
    grid-template-columns: repeat(2, 1fr);
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .pitfalls-grid {
    grid-template-columns: 1fr;
  }

  .checklist-categories {
    grid-template-columns: 1fr;
  }
}

/* Resource Title Link (for resource_recommendations section) */
.resource-title-link {
  color: #1E3A5F;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.resource-title-link:hover {
  color: #2C5282;
  text-decoration: underline;
}

.external-icon-inline {
  display: inline-block;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.resource-title-link:hover .external-icon-inline {
  opacity: 1;
}

@media (max-width: 640px) {
  .skills-metadata {
    grid-template-columns: 1fr;
  }

  .pitfalls-section,
  .checklist-section {
    padding: 32px 20px;
  }

  .pitfall-card {
    padding: 16px;
  }

  .checklist-category {
    padding: 18px;
  }

  .category-header {
    font-size: 16px;
  }

  .narrative-section {
    padding: 32px 20px;
  }

  .professional-timeline-section {
    padding: 32px 20px;
  }

  .topics-grid {
    grid-template-columns: 1fr;
  }

  .header-right {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .progress-bar {
    width: 80px;
  }
}
</style>
