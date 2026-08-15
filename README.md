# E-YUVA ERP

A web-based **grant management and financial operations platform** built for the E-YUVA Centre to streamline transactions, bills, budgets, reconciliation, utilization certificates, and reporting.

## 🚀 Key Features

- 🔐 Role-based authentication & access control
- 💰 Transaction & budget management
- 📄 Bill and document uploads
- 🏦 Bank reconciliation & transaction matching
- 📊 Financial reports & budget analytics
- 📜 Utilization Certificate (UC) management
- 📥 CSV transaction import/export
- 🔒 Audit tracking and reconciliation locking

## 🛠️ Tech Stack

**Frontend:** React.js, Vite, JavaScript  
**Backend:** FastAPI, Python, SQLAlchemy  
**Database:** PostgreSQL  
**Deployment:** Docker, Nginx, Linux

## ⚙️ Setup

Clone the repository, install the backend and frontend dependencies, configure the required environment variables (database URL, authentication secrets, and API settings), and start PostgreSQL. Run the FastAPI backend with Uvicorn and the React frontend with Vite. For production, the application can be deployed using Docker and Nginx.

```bash
git clone <repository-url>
cd EYCMS

# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd ../frontend
npm install
npm run dev

````


<p align="center"> <strong>E-YUVA ERP</strong> <br /> Grant Management • Financial Operations • Reconciliation • Reporting <br /><br /> Built by :-  · <a href="https://github.com/hindmanas">Manas Pandya</a>  · <a href="https://github.com/Purvak2906">Purva Kalkute</a> ·  <a href="https://github.com/ParasChavan02">Paras Chavan</a>  </p> 


**Guided by:** Dr. Nishant Gopalan, E-YUVA Centre

## 📜 License

Copyright © 2026 Team InnovAces.

Developed for the **E-YUVA Centre, Atmiya University**.

