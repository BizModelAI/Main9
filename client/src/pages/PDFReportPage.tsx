import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PDFReportFull } from "../components/PDFReportFull";
import { QuizData } from "../types";

export const PDFReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [reportData, setReportData] = useState<{
    quizData: QuizData;
    userEmail?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dataParam = searchParams.get("data");
      if (!dataParam) {
        setError("No data provided");
        return;
      }

      // Decode the base64 data
      const decodedData = atob(
        decodeURIComponent(dataParam).replace(
          "data:application/json;base64,",
          "",
        ),
      );
      const data = JSON.parse(decodedData);

      if (!data.quizData) {
        setError("Invalid data format");
        return;
      }

      setReportData(data);
    } catch (err) {
      console.error("Error parsing PDF data:", err);
      setError("Failed to parse report data");
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <PDFReportFull
      quizData={reportData.quizData}
      userEmail={reportData.userEmail}
    />
  );
};

export default PDFReportPage;
