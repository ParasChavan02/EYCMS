import { useState } from "react";
import "./responsiveSetupChecklist.css";

function ResponsiveSetupChecklist({ steps, onRefresh }) {
  const [expandedStep, setExpandedStep] = useState(null);

  const completedCount = steps.filter(s => s.status === "done").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const toggleStep = (stepId) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="responsive-checklist">
      {/* PROGRESS BAR */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Setup Progress</span>
          <span className="progress-percent">{progressPercent}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="progress-steps">
          {completedCount}/{steps.length} completed
        </div>
      </div>

      {/* ACCORDION STEPS */}
      <div className="checklist-accordion">
        {steps.map((step) => (
          <div key={step.id} className={`accordion-item ${step.status === "done" ? "completed" : "pending"}`}>
            <button
              className="accordion-header"
              onClick={() => toggleStep(step.id)}
            >
              <div className="accordion-icon">
                {step.status === "done" ? "✓" : "○"}
              </div>
              <div className="accordion-title">{step.label}</div>
              <div className="accordion-toggle">
                {expandedStep === step.id ? "−" : "+"}
              </div>
            </button>

            {expandedStep === step.id && (
              <div className="accordion-content">
                <div className="step-description">
                  Complete the {step.label.toLowerCase()} configuration to proceed.
                </div>
                <div className="step-actions">
                  <button className="step-button">
                    ✎ Configure
                  </button>
                  <button className="step-button-secondary">
                    ℹ️ Learn More
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div className="checklist-actions">
        <button type="button" className="action-btn action-btn-primary" onClick={onRefresh}>
          🔄 Refresh Status
        </button>
        <button type="button" className="action-btn action-btn-secondary">
          👥 Skip to Users
        </button>
      </div>
    </div>
  );
}

export default ResponsiveSetupChecklist;
