export async function fetchReportTemplates() {
  return Promise.resolve([])
}

export async function generateReport(payload) {
  return Promise.resolve({ success: true, reportUrl: '/report.pdf' })
}
