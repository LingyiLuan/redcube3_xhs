import React from 'react';
import './MilestoneModal.css';

/**
 * Modal for displaying detailed milestone information
 */
const MilestoneModal = ({ milestone, onClose }) => {
  if (!milestone) return null;

  return (
    <div className="milestone-modal-overlay" onClick={onClose}>
      <div className="milestone-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <span className="modal-week-badge">WEEK {milestone.week}</span>
            <h2 className="modal-title">{milestone.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <div className="section-label">&gt; DESCRIPTION</div>
            <p className="milestone-description">{milestone.description}</p>
          </div>

          {milestone.skills && milestone.skills.length > 0 && (
            <div className="modal-section">
              <div className="section-label">&gt; SKILLS TO DEVELOP</div>
              <div className="skills-tags">
                {milestone.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {milestone.tasks && milestone.tasks.length > 0 && (
            <div className="modal-section">
              <div className="section-label">&gt; TASKS CHECKLIST</div>
              <ul className="tasks-list">
                {milestone.tasks.map((task, index) => (
                  <li key={index} className="task-item">
                    <input type="checkbox" id={`task-${index}`} />
                    <label htmlFor={`task-${index}`}>{task}</label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {milestone.resources && milestone.resources.length > 0 && (
            <div className="modal-section">
              <div className="section-label">&gt; RESOURCES & TOOLS</div>
              <ul className="resources-list">
                {milestone.resources.map((resource, index) => (
                  <li key={index} className="resource-item">
                    <span className="resource-icon">🔗</span>
                    {resource}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {milestone.estimated_hours && (
            <div className="modal-section">
              <div className="section-label">&gt; TIME ESTIMATE</div>
              <p className="time-estimate">{milestone.estimated_hours} hours</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-action-btn secondary" onClick={onClose}>
            Close
          </button>
          <button className="modal-action-btn primary">
            Mark as Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneModal;
