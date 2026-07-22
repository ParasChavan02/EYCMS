import { useState } from "react";
import "./user-erp.css";

const faqAnswers = {
  // Account Category
  "How do I reset my password?": [
    "Navigate to the profile or account settings page.",
    "Click on 'Reset Password' or 'Change Password'.",
    "Enter your current password and your new password.",
    "Verify the new password and click 'Save Changes'.",
    "If it is not resolved, then contact to admin."
  ],
  "Where can I see my assigned events?": [
    "Navigate to the 'Events' section from the main sidebar.",
    "View the calendar or list layout of upcoming events.",
    "Look for the 'Assigned to Me' tag or tab to filter your events.",
    "If it is not resolved, then contact to admin."
  ],
  "How do I upload a project report?": [
    "Go to the 'Reports' section in the sidebar.",
    "Click on the 'Upload Report' button.",
    "Select the report file from your computer and fill in the required metadata.",
    "Click 'Submit' to upload the report.",
    "If it is not resolved, then contact to admin."
  ],
  "How do I track a submitted ticket?": [
    "Navigate to the 'My Support Tickets' page.",
    "Locate your ticket from the table by its Ticket ID.",
    "Click the 'View' button to open details and read message updates.",
    "If it is not resolved, then contact to admin."
  ],
  "Can I request a new ERP feature?": [
    "Navigate to 'Feature Requests' section in the sidebar.",
    "Click on the 'Request a Feature' tab.",
    "Provide a feature title, problem statement, proposed solution, and expected benefit.",
    "Click 'Submit Feature Request' to notify the admin.",
    "If it is not resolved, then contact to admin."
  ],
  "Can I change my account email?": [
    "Go to the Profile/Settings page.",
    "Locate the email field in the account profile information.",
    "Update your email address and click 'Save Settings'.",
    "Check your new email inbox for a verification link.",
    "If it is not resolved, then contact to admin."
  ],
  "Why is my role showing as USER?": [
    "Check the user profile page to see assigned role status.",
    "Your account is automatically assigned 'USER' role upon sign up.",
    "Contact your coordinator to request elevated role assignments.",
    "If it is not resolved, then contact to admin."
  ],
  "How do I update my profile details?": [
    "Open the profile settings dropdown in the top-right corner.",
    "Select 'Profile Settings'.",
    "Modify your personal details such as phone, organization, or name.",
    "Click 'Update Profile' to save updates.",
    "If it is not resolved, then contact to admin."
  ],
  "Who approves account access changes?": [
    "All role and permission modifications are handled by the system administrator.",
    "Contact your project manager or system admin to request a change.",
    "If it is not resolved, then contact to admin."
  ],

  // Transactions Category
  "Can a user create a transaction?": [
    "Navigate to 'Transactions' page.",
    "Click 'Add Transaction' or raise a new request.",
    "Fill in the transaction form details and submit.",
    "If it is not resolved, then contact to admin."
  ],
  "Where can I view transaction status?": [
    "Go to the 'Transactions' page.",
    "Find your transaction in the transaction logs list.",
    "Look at the status badge (e.g., Pending, Approved, Rejected).",
    "If it is not resolved, then contact to admin."
  ],
  "Why is a bill marked pending?": [
    "Check if the bill is uploaded under the correct transaction category.",
    "Pending means the finance team or admin is reviewing the attached document.",
    "Wait up to 2-3 business days for validation.",
    "If it is not resolved, then contact to admin."
  ],
  "What happens after a bill is uploaded?": [
    "The uploaded bill goes into the verification queue.",
    "An administrator or finance reviewer verifies the details.",
    "Once verified, status updates to Approved, and budget heads are updated.",
    "If it is not resolved, then contact to admin."
  ],
  "Who reviews transaction documents?": [
    "Finance admins and designated reviewers check all transaction documents.",
    "For specific queries, check the notes left by reviewers on the transaction detail page.",
    "If it is not resolved, then contact to admin."
  ],

  // Reports Category
  "Which report formats are supported?": [
    "Supported formats include PDF, DOCX, XLSX, and PNG/JPG images.",
    "Make sure the file size does not exceed the maximum limit (5MB).",
    "If it is not resolved, then contact to admin."
  ],
  "How do I know if my report is approved?": [
    "Go to 'Reports' section.",
    "Check the status column beside your submitted report.",
    "You will also receive a system notification once approved.",
    "If it is not resolved, then contact to admin."
  ],
  "Can I replace a submitted report?": [
    "Locate the submitted report in your list.",
    "Click the 'Edit' or 'Replace File' option if it is still under review.",
    "Upload the updated document and click save.",
    "If it is not resolved, then contact to admin."
  ],
  "Why was my report rejected?": [
    "Open the report details modal.",
    "Read the rejection reason comment left by the reviewer.",
    "Correct the highlighted issues and resubmit.",
    "If it is not resolved, then contact to admin."
  ],

  // Events Category
  "Where can I see upcoming events?": [
    "Navigate to the 'Events' page.",
    "Scroll through the list of upcoming organization events.",
    "If it is not resolved, then contact to admin."
  ],
  "How do I confirm event attendance?": [
    "Click on the specific event in the Events page.",
    "Look for the RSVP options (Yes, No, Maybe).",
    "Select your choice and submit attendance confirmation.",
    "If it is not resolved, then contact to admin."
  ],
  "Can I upload event images?": [
    "Open the details modal of the completed event.",
    "Click on 'Upload Gallery Images'.",
    "Choose files and upload.",
    "If it is not resolved, then contact to admin."
  ],
  "Who is the event coordinator?": [
    "Look at the event details card.",
    "The coordinator's name and contact email are listed under the event host section.",
    "If it is not resolved, then contact to admin."
  ],
  "How are event changes notified?": [
    "Any modifications trigger automatic email notifications to registered attendees.",
    "A notification will also appear in your notifications bell dropdown.",
    "If it is not resolved, then contact to admin."
  ],

  // Approvals Category
  "What does Under Review mean?": [
    "This means your submission is received and is currently being audited.",
    "No action is required from you unless feedback is requested.",
    "If it is not resolved, then contact to admin."
  ],
  "How long does approval usually take?": [
    "The typical review time is 24 to 48 hours during business days.",
    "If your request is urgent, please escalate it via support tickets.",
    "If it is not resolved, then contact to admin."
  ],
  "Can I comment on a rejected submission?": [
    "Open the rejected submission detail page.",
    "Scroll down to comments and type your reply/justification.",
    "Submit the comment for the reviewer's attention.",
    "If it is not resolved, then contact to admin."
  ],
  "Who approves my documents?": [
    "Assigned administrators or coordinators verify documents based on category.",
    "You can view the assigned reviewer's name in document details.",
    "If it is not resolved, then contact to admin."
  ],
  "Where do I see pending reviews?": [
    "Go to the 'Approvals' page.",
    "Use the filter status dropdown and select 'Under Review' or 'Pending'.",
    "If it is not resolved, then contact to admin."
  ],

  // Budget Management Category
  "Can users view budget details?": [
    "Users can view budget utilization details on the dashboard/reports page.",
    "Detailed budget heads are visible under the Finance section if permissions allow.",
    "If it is not resolved, then contact to admin."
  ],
  "How are uploaded bills mapped to budget heads?": [
    "Select the appropriate budget head category when submitting a transaction.",
    "The admin verifies mapping alignment prior to final transaction approval.",
    "If it is not resolved, then contact to admin."
  ],
  "What if my expense crosses the available budget?": [
    "The system will show a warning alert if request exceeds budget limits.",
    "You must request a budget head limit increase from the administration.",
    "If it is not resolved, then contact to admin."
  ],
  "Who can edit budget limits?": [
    "Budget limits are editable only by Admin and Finance/Accounts staff.",
    "If it is not resolved, then contact to admin."
  ],
  "Where can I check budget utilization?": [
    "Go to the 'Budget Management' or 'Dashboard' page.",
    "View the budget utilization bar chart or detail tables.",
    "If it is not resolved, then contact to admin."
  ]
};

function HelpCenter() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const categories = ["All", "Account", "Transactions", "Reports", "Events", "Approvals", "Budget Management"];
  const questionsByCategory = {
    All: [
      "How do I reset my password?",
      "Where can I see my assigned events?",
      "How do I upload a project report?",
      "How do I track a submitted ticket?",
      "Can I request a new ERP feature?",
    ],
    Account: [
      "How do I reset my password?",
      "Can I change my account email?",
      "Why is my role showing as USER?",
      "How do I update my profile details?",
      "Who approves account access changes?",
    ],
    Transactions: [
      "Can a user create a transaction?",
      "Where can I view transaction status?",
      "Why is a bill marked pending?",
      "What happens after a bill is uploaded?",
      "Who reviews transaction documents?",
    ],
    Reports: [
      "How do I upload a project report?",
      "Which report formats are supported?",
      "How do I know if my report is approved?",
      "Can I replace a submitted report?",
      "Why was my report rejected?",
    ],
    Events: [
      "Where can I see upcoming events?",
      "How do I confirm event attendance?",
      "Can I upload event images?",
      "Who is the event coordinator?",
      "How are event changes notified?",
    ],
    Approvals: [
      "What does Under Review mean?",
      "How long does approval usually take?",
      "Can I comment on a rejected submission?",
      "Who approves my documents?",
      "Where do I see pending reviews?",
    ],
    "Budget Management": [
      "Can users view budget details?",
      "How are uploaded bills mapped to budget heads?",
      "What if my expense crosses the available budget?",
      "Who can edit budget limits?",
      "Where can I check budget utilization?",
    ],
  };

  const questions = questionsByCategory[activeCategory] || [];

  // Filter based on search query
  const filteredQuestions = questions.filter((q) =>
    q.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="user-erp-page">
      <div className="user-support-layout">
        <header className="user-erp-header">
          <h1>Help Center</h1>
          <p>Find answers to common questions</p>
        </header>

        <input 
          className="user-search-input" 
          type="search" 
          placeholder="Search for help..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <section className="user-help-grid">
          <div className="user-help-categories">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? "active" : ""}
                onClick={() => {
                  setActiveCategory(category);
                  setExpandedQuestion(null); // Close expanded question on category change
                }}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="user-faq-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question) => {
                const isExpanded = expandedQuestion === question;
                const steps = faqAnswers[question] || [
                  "Refer to the related section of the ERP manual.",
                  "If the issue persists, kindly reach out to support.",
                  "If it is not resolved, then contact to admin."
                ];

                return (
                  <div key={question} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <button 
                      type="button" 
                      onClick={() => setExpandedQuestion(isExpanded ? null : question)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        padding: "16px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: isExpanded ? "8px 8px 0 0" : "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        color: "var(--text-muted)",
                        textAlign: "left",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span>{question}</span>
                      <span style={{ 
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", 
                        transition: "transform 0.2s ease" 
                      }}>
                        ▼
                      </span>
                    </button>
                    {isExpanded && (
                      <div style={{
                        padding: "20px 24px",
                        background: "rgba(29, 92, 255, 0.02)",
                        border: "1px solid var(--border-color)",
                        borderTop: "none",
                        borderRadius: "0 0 8px 8px",
                        fontSize: "0.92rem",
                        lineHeight: "1.6",
                        color: "var(--text-muted)"
                      }}>
                        <ol style={{ margin: 0, paddingLeft: "20px" }}>
                          {steps.map((step, index) => {
                            const isLast = index === steps.length - 1;
                            return (
                              <li 
                                key={index} 
                                style={{ 
                                  marginBottom: isLast ? "0" : "8px",
                                  fontWeight: isLast ? "600" : "normal",
                                  color: isLast ? "#1d5cff" : "inherit"
                                }}
                              >
                                {step}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-light)" }}>
                No questions found matching your search.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default HelpCenter;
