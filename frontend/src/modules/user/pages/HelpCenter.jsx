import { useState } from "react";
import "./user-erp.css";

function HelpCenter() {
  const [activeCategory, setActiveCategory] = useState("All");
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
  const questions = questionsByCategory[activeCategory];

  return (
    <main className="user-erp-page">
      <div className="user-support-layout">
        <header className="user-erp-header">
          <h1>Help Center</h1>
          <p>Find answers to common questions</p>
        </header>

        <input className="user-search-input" type="search" placeholder="Search for help..." />

        <section className="user-help-grid">
          <div className="user-help-categories">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? "active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="user-faq-list">
            {questions.map((question) => (
              <button type="button" key={question}>
                <span>{question}</span>
                <span>v</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default HelpCenter;
