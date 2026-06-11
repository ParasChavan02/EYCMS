import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import "./user-erp.css";

function ContactSupport() {
  return (
    <main className="user-erp-page">
      <div className="user-support-layout">
        <header className="user-erp-header">
          <h1>Contact Support</h1>
          <p>Get in touch with our support team</p>
        </header>

        <section className="user-erp-card user-support-card">
          <div className="user-contact-item">
            <div className="user-contact-icon"><Mail size={36} /></div>
            <h3>Email</h3>
            <a href="mailto:support@eyuva-erp.com">eyuva@atmiyauni.ac.in</a>
          </div>

          <div className="user-contact-item">
            <div className="user-contact-icon"><Phone size={36} /></div>
            <h3>Phone</h3>
            <strong>+91 85478 50276</strong>
          </div>

          <div className="user-contact-item">
            <div className="user-contact-icon"><Clock3 size={36} /></div>
            <h3>Office Hours</h3>
            <p>Monday - Friday, 9:00 AM - 6:00 PM IST</p>
          </div>

          <div className="user-contact-item">
            <div className="user-contact-icon"><MapPin size={36} /></div>
            <h3>Address</h3>
            <p>E-YUVA ERP Support Desk, Atmiya Univesity</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ContactSupport;
