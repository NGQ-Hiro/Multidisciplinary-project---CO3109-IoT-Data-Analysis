import "./App.css";
import {
  AlertPanel,
  ChartsSection,
  DashboardFilters,
  DashboardHeader,
  MetricSummaryGrid,
  RecommendationCard,
  useSensorDashboard,
} from "./features/dashboard";

function App() {
  const {
    timeFilter,
    setTimeFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    filteredData,
    latestValues,
    alerts,
    recommendation,
    aiRecommendation,
    aiRecommendationStatus,
    aiRecommendationSource,
    statusByMetric,
    isLoading,
    errorMessage,
    lastRefresh,
    reloadData,
    exportCsv,
  } = useSensorDashboard();

  return (
    <div className="dashboard">
      <DashboardHeader
        isLoading={isLoading}
        lastRefresh={lastRefresh}
        onReload={reloadData}
      />

      <DashboardFilters
        timeFilter={timeFilter}
        fromDate={fromDate}
        toDate={toDate}
        onTimeFilterChange={setTimeFilter}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onExportCsv={exportCsv}
      />

      {errorMessage && (
        <section className="panel error">{errorMessage}</section>
      )}

      <MetricSummaryGrid
        latestValues={latestValues}
        statusByMetric={statusByMetric}
      />

      <AlertPanel alerts={alerts} />

      <RecommendationCard
        recommendation={recommendation}
        aiRecommendation={aiRecommendation}
        aiRecommendationStatus={aiRecommendationStatus}
        aiRecommendationSource={aiRecommendationSource}
      />
      <ChartsSection data={filteredData} />
    </div>
  );
}

export default App;
