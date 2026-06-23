import { useState } from "react";
import { Plus, Trash2, UserPlus, FolderKanban, Info } from "lucide-react";
import { teamService } from "../services/teamService";
import { useNotification } from "../../common/hooks/useNotification";
import { useAuth } from "../../common/hooks/useAuth";
import "./teamOnboardingModal.css";

function TeamOnboardingModal({ visible }) {
  const { user, signIn } = useAuth();
  const { addNotification } = useNotification();
  const [projectId, setProjectId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]); // Array of { name: "", email: "" }
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleAddMember = () => {
    setTeamMembers([...teamMembers, { name: "", email: "" }]);
  };

  const handleRemoveMember = (index) => {
    setTeamMembers(teamMembers.filter((_, idx) => idx !== index));
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const validateEmails = (members) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member.name.trim() || !member.email.trim()) {
        return `Please complete both name and email for teammate #${i + 1}.`;
      }
      if (!emailRegex.test(member.email.trim())) {
        return `Please enter a valid email address for ${member.name || `teammate #${i + 1}`}.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!projectId.trim()) {
      setError("Project ID is required.");
      return;
    }

    // Filter out completely empty rows
    const activeMembers = teamMembers.filter(m => m.name.trim() !== "" || m.email.trim() !== "");

    // Validate active teammate rows
    const validationError = validateEmails(activeMembers);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      // Map members with pending invitation status
      const mappedMembers = activeMembers.map(m => ({
        name: m.name.trim(),
        email: m.email.trim().toLowerCase(),
        status: "Pending"
      }));

      const updatedUser = await teamService.setupTeam(user, {
        projectId: projectId.trim().toUpperCase(),
        teamMembers: mappedMembers
      });

      addNotification("🎉 Workspace configured successfully!", "success", 4000);
      
      // Update state in AuthContext to re-render the app layout and hide the modal
      signIn(updatedUser);
    } catch (err) {
      setError(err.message || "An error occurred during onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal animate-in">
        <div className="onboarding-banner">
          <div className="banner-icon">
            <FolderKanban size={32} />
          </div>
          <h1>Team Workspace Onboarding</h1>
          <p>Configure your workspace to start managing your grants and collaborating with your team.</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {error && (
            <div className="onboarding-error-alert">
              <Info size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="onboarding-field-group">
            <label className="onboarding-label">
              Project ID <span className="required-star">*</span>
            </label>
            <div className="input-with-icon">
              <span className="input-icon">📂</span>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. EYUVA-2026-042"
                className="onboarding-input"
                disabled={isSubmitting}
              />
            </div>
            <p className="field-hint">Enter the unique Project ID provided in your official grant allocation email.</p>
          </div>

          <div className="onboarding-divider" />

          <div className="onboarding-teammates-header">
            <div>
              <h3>Invite Teammates</h3>
              <p>Add the name and email of collaborators. Leave blank if working solo.</p>
            </div>
            <button
              type="button"
              onClick={handleAddMember}
              className="btn-add-teammate"
              disabled={isSubmitting}
            >
              <Plus size={16} /> Add Member
            </button>
          </div>

          <div className="teammates-scroll-area">
            {teamMembers.length === 0 ? (
              <div className="empty-teammates-state">
                <UserPlus size={24} />
                <p>No teammates added yet. Click "Add Member" to invite collaborators.</p>
              </div>
            ) : (
              <div className="teammate-rows-container">
                {teamMembers.map((member, index) => (
                  <div key={index} className="teammate-row-item fade-in">
                    <span className="row-number">{index + 1}</span>
                    <input
                      type="text"
                      placeholder="Teammate Name"
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                      className="onboarding-input teammate-name-input"
                      disabled={isSubmitting}
                    />
                    <input
                      type="email"
                      placeholder="Teammate Email"
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                      className="onboarding-input teammate-email-input"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(index)}
                      className="btn-remove-teammate"
                      title="Remove teammate"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="onboarding-actions">
            <button
              type="submit"
              className="btn-onboarding-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Configuring Workspace..." : "Complete Onboarding Setup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeamOnboardingModal;
