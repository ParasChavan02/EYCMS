import "./reportFilters.css";

function ReportFilters({ onApplyFilters }) {
  const handleApplyFilters = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filters = {
      department: formData.get("department"),
      budgetHead: formData.get("budgetHead"),
      reportType: formData.get("reportType"),
      status: formData.get("status"),
      dateFrom: formData.get("dateFrom"),
      dateTo: formData.get("dateTo"),
      coordinator: formData.get("coordinator"),
    };
    onApplyFilters(filters);
  };

  const handleReset = (e) => {
    e.preventDefault();
    e.target.form.reset();
    onApplyFilters({
      department: "",
      budgetHead: "",
      reportType: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      coordinator: "",
    });
  };

  return (
    <div className="report-filters-card">
      <div className="filters-header">
        <h3 className="filters-title">🔍 Filter Reports</h3>
      </div>

      <form onSubmit={handleApplyFilters} className="filters-form">
        <div className="filters-grid-3">
          <div className="filter-group">
            <label htmlFor="department" className="filter-label">
              Department
            </label>
            <select id="department" name="department" className="filter-select">
              <option value="">All Departments</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="HR">Human Resources</option>
              <option value="Projects">Projects</option>
              <option value="Grants">Grants Management</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="budgetHead" className="filter-label">
              Budget Head
            </label>
            <input
              type="text"
              id="budgetHead"
              name="budgetHead"
              placeholder="e.g., BH-001"
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="reportType" className="filter-label">
              Report Type
            </label>
            <select id="reportType" name="reportType" className="filter-select">
              <option value="">All Types</option>
              <option value="UC">Utilization Certificate</option>
              <option value="SoE">Statement of Expenditure</option>
              <option value="PriorApproval">Prior Approval</option>
              <option value="EventReport">Event Report</option>
              <option value="Newsletter">Newsletter</option>
            </select>
          </div>
        </div>

        <div className="filters-grid-3">
          <div className="filter-group">
            <label htmlFor="dateFrom" className="filter-label">
              Date From
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="dateTo" className="filter-label">
              Date To
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="status" className="filter-label">
              Status
            </label>
            <select id="status" name="status" className="filter-select">
              <option value="">All Statuses</option>
              <option value="Generated">Generated</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="filters-grid-1">
          <div className="filter-group">
            <label htmlFor="coordinator" className="filter-label">
              Coordinator
            </label>
            <input
              type="text"
              id="coordinator"
              name="coordinator"
              placeholder="Search by coordinator name"
              className="filter-input"
            />
          </div>
        </div>

        <div className="filters-actions">
          <button type="submit" className="btn-apply-filters">
            ✅ Apply Filters
          </button>
          <button type="reset" onClick={handleReset} className="btn-reset-filters">
            ↻ Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportFilters;
