type RecommendationCardProps = {
  recommendation: string;
  aiRecommendation: string;
  aiRecommendationStatus: "idle" | "loading" | "ready" | "error";
  aiRecommendationSource: string;
};

export function RecommendationCard({
  recommendation,
  aiRecommendation,
  aiRecommendationStatus,
  aiRecommendationSource,
}: RecommendationCardProps) {
  return (
    <section className="panel recommendation">
      <h3>Gợi ý canh tác</h3>
      <div className="recommendation-block">
        <p className="recommendation-label">Gợi ý nội bộ</p>
        <p>{recommendation}</p>
      </div>

      <div className="recommendation-block recommendation-ai">
        <p className="recommendation-label">Gợi ý từ LLM</p>
        <p>
          {aiRecommendationStatus === "loading"
            ? "Đang hỏi AI..."
            : aiRecommendation}
        </p>
        <p className="recommendation-source">{aiRecommendationSource}</p>
      </div>
    </section>
  );
}
