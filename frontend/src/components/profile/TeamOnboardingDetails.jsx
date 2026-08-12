import { useState } from "react";
import { UserPlus, Mail, ShieldAlert, Plus, X, Check, Users } from "lucide-react";
import { teamService } from "../../modules/user/services/teamService";
import { useNotification } from "../../modules/common/hooks/useNotification";
import { useAuth } from "../../modules/common/hooks/useAuth";
import "./teamOnboardingDetails.css";

function TeamOnboardingDetails() {
  const { user, signIn } = useAuth();
  const { addNotification } = useNotification();
  const [isInviting, setIsInviting] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is not configured yet, don't show details (onboarding modal will block)
  if (!user || user.role !== "USER" || !user.teamConfigured) return null;

  const team = user.teamMembers || [];

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newMember.name.trim() || !newMember.email.trim()) {
      setError("Please fill out both Name and Email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await teamService.addTeammate(user, {
        name: newMember.name.trim(),
        email: newMember.email.trim().toLowerCase()
      });

      addNotification("✉️ Teammate invitation sent successfully!", "success", 4000);
      signIn(updatedUser);
      setNewMember({ name: "", email: "" });
      setIsInviting(false);
    } catch (err) {
      setError(err.message || "Failed to invite teammate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-form-card team-details-card">
      <div className="form-header">
        <h2 className="form-title flex-title">
          <Users size={18} />
          <span>Project & Team Collaboration</span>
        </h2>
        {!isInviting && (
          <button
            type="button"
            className="btn-edit btn-invite-toggle"
            onClick={() => setIsInviting(true)}
          >
            <Plus size={14} /> Invite Teammate
          </button>
        )}
      </div>

      <div className="project-id-badge-container">
        <span className="project-id-label">Project ID:</span>
        <strong className="project-id-value">{user.projectId}</strong>
      </div>

      {isInviting && (
        <form onSubmit={handleInviteSubmit} className="invite-inline-form fade-in">
          <h4 className="invite-form-title">Invite New Collaborator</h4>
          {error && (
            <div className="invite-error">
              <ShieldAlert size={14} />
              <span>{error}</span>
            </div>
          )}
          <div className="invite-fields-row">
            <div className="invite-field">
              <input
                type="text"
                placeholder="Teammate Name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="form-input"
                disabled={isSubmitting}
              />
            </div>
            <div className="invite-field">
              <input
                type="email"
                placeholder="Teammate Email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="form-input"
                disabled={isSubmitting}
              />
            </div>
            <div className="invite-actions">
              <button
                type="submit"
                className="btn-submit btn-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Inviting..." : "Send Invite"}
              </button>
              <button
                type="button"
                className="btn-cancel btn-sm"
                onClick={() => {
                  setIsInviting(false);
                  setError("");
                  setNewMember({ name: "", email: "" });
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="teammates-list-section">
        <h4 className="section-subtitle">Teammates & Invitation Status</h4>
        {team.length === 0 ? (
          <div className="solo-project-alert">
            <p>You are currently working solo on this project. Need help? Invite a teammate using the button above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="teammates-table">
              <thead>
                <tr>
                  <th>Collaborator</th>
                  <th>Email</th>
                  <th>Invitation Status</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member, idx) => (
                  <tr key={idx} className="teammate-row">
                    <td>
                      <div className="teammate-info-cell">
                        <div className="teammate-avatar-mini">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="teammate-name">{member.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="teammate-email-cell">
                        <Mail size={14} />
                        <span>{member.email}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-teammate ${member.status.toLowerCase()}`}>
                        {member.status === "Joined" ? (
                          <Check size={12} className="badge-icon" />
                        ) : (
                          <span className="badge-dot" />
                        )}
                        <span>{member.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamOnboardingDetails;
