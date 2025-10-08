import React, { useState, useEffect } from 'react';
import MilestoneModal from './MilestoneModal';
import './LearningMapDisplay.css';

const LearningMapDisplay = ({ learningMap, isGenerating = false }) => {
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completedLines, setCompletedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Typing animation effect
  useEffect(() => {
    if (!learningMap || !learningMap.title) return;

    const lines = [
      '> INITIALIZING LEARNING MAP GENERATOR...',
      '> ANALYZING CONTENT PATTERNS...',
      '> GENERATING OPTIMAL LEARNING PATH...',
      '> CALIBRATING DIFFICULTY CURVE...',
      '> LEARNING MAP COMPILATION COMPLETE.',
      '',
      `> TITLE: ${learningMap.title}`,
      `> DURATION: ${learningMap.timeline_weeks} weeks`,
      `> DIFFICULTY: ${learningMap.difficulty}`,
      `> MILESTONES: ${learningMap.milestones?.length || 0}`,
      ''
    ];

    let lineIndex = 0;
    let charIndex = 0;
    setIsTyping(true);
    setCompletedLines([]);
    setCurrentText('');

    const typeText = () => {
      if (lineIndex >= lines.length) {
        setIsTyping(false);
        return;
      }

      const currentLine = lines[lineIndex];

      if (charIndex < currentLine.length) {
        setCurrentText(currentLine.substring(0, charIndex + 1));
        charIndex++;
        setTimeout(typeText, 30); // Typing speed
      } else {
        // Line complete, move to next
        setCompletedLines(prev => [...prev, currentLine]);
        setCurrentText('');
        lineIndex++;
        charIndex = 0;
        setTimeout(typeText, 100); // Pause between lines
      }
    };

    const startDelay = setTimeout(typeText, 500);
    return () => clearTimeout(startDelay);
  }, [learningMap]);

  if (isGenerating) {
    return (
      <div className="learning-map-display generating">
        <div className="console-header">
          <span className="console-title">REDCUBE LEARNING MAP GENERATOR</span>
          <span className="console-status">PROCESSING...</span>
        </div>
        <div className="console-body">
          <div className="loading-animation">
            <span className="cursor-blink">█</span> Analyzing content patterns...
          </div>
          <div className="loading-animation">
            <span className="cursor-blink">█</span> Generating optimal learning path...
          </div>
          <div className="loading-animation">
            <span className="cursor-blink">█</span> Calibrating difficulty curve...
          </div>
        </div>
      </div>
    );
  }

  if (!learningMap) {
    return (
      <div className="learning-map-display empty">
        <div className="console-header">
          <span className="console-title">REDCUBE LEARNING MAP GENERATOR</span>
          <span className="console-status">READY</span>
        </div>
        <div className="console-body">
          <div className="prompt-line">
            <span className="prompt">redcube@learning-system:~$</span>
            <span className="cursor-blink">█</span>
          </div>
          <div className="help-text">
            Type 'generate' to create your personalized learning map...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-map-display">
      <div className="console-header">
        <span className="console-title">REDCUBE LEARNING MAP GENERATOR</span>
        <span className="console-status">ACTIVE</span>
      </div>

      <div className="console-body">
        {/* Typing animation section */}
        <div className="terminal-output">
          {completedLines.map((line, index) => (
            <div key={index} className="output-line">
              {line}
            </div>
          ))}
          {isTyping && (
            <div className="output-line current">
              {currentText}<span className="cursor-blink">█</span>
            </div>
          )}
        </div>

        {/* Learning map content */}
        {!isTyping && (
          <div className="learning-map-content">
            <div className="map-header">
              <h2 className="map-title">{learningMap.title}</h2>
              <div className="map-meta">
                <span className="meta-item">Duration: {learningMap.timeline_weeks} weeks</span>
                <span className="meta-item">Difficulty: {learningMap.difficulty}</span>
                <span className="meta-item">Milestones: {learningMap.milestones?.length || 0}</span>
              </div>
            </div>

            <div className="map-summary">
              <div className="section-header">&gt; MISSION BRIEFING</div>
              <p>{learningMap.summary}</p>
            </div>

            {learningMap.milestones && (
              <div className="milestones-section">
                <div className="section-header">&gt; LEARNING MILESTONES</div>
                <div className="milestones-grid">
                  {learningMap.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="milestone-card clickable"
                      onClick={() => setSelectedMilestone(milestone)}
                    >
                      <div className="milestone-header">
                        <span className="milestone-week">WEEK {milestone.week}</span>
                        <div className="milestone-status">[ PENDING ]</div>
                      </div>
                      <h4 className="milestone-title">{milestone.title}</h4>
                      <p className="milestone-description">{milestone.description}</p>

                      <div className="milestone-details">
                        <div className="detail-section">
                          <strong>&gt; SKILLS:</strong>
                          <ul>
                            {milestone.skills?.map((skill, skillIndex) => (
                              <li key={skillIndex}>{skill}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="detail-section">
                          <strong>&gt; TASKS:</strong>
                          <ul>
                            {milestone.tasks?.map((task, taskIndex) => (
                              <li key={taskIndex}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="click-hint">
                        点击查看详细信息 →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestone Detail Modal */}
            {selectedMilestone && (
              <MilestoneModal
                milestone={selectedMilestone}
                onClose={() => setSelectedMilestone(null)}
              />
            )}

            {learningMap.outcomes && (
              <div className="outcomes-section">
                <div className="section-header">&gt; EXPECTED OUTCOMES</div>
                <ul className="outcomes-list">
                  {learningMap.outcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}

            {learningMap.next_steps && (
              <div className="next-steps-section">
                <div className="section-header">&gt; NEXT MISSION OBJECTIVES</div>
                <ul className="next-steps-list">
                  {learningMap.next_steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="map-footer">
              <div className="footer-line">
                &gt; Learning map generated at {new Date(learningMap.created_at).toLocaleString()}
              </div>
              <div className="footer-line">
                &gt; Map ID: {learningMap.id}
              </div>
              <div className="prompt-line">
                <span className="prompt">redcube@learning-system:~$</span>
                <span className="cursor-blink">█</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningMapDisplay;