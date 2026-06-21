import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import CreateBatch from "@/pages/CreateBatch";
import BatchDetail from "@/pages/BatchDetail";
import PhCurve from "@/pages/PhCurve";
import { useAppStore } from "@/store";

export default function App() {
  const loadBatches = useAppStore((state) => state.loadBatches);
  const loadConfig = useAppStore((state) => state.loadConfig);

  useEffect(() => {
    loadConfig();
    loadBatches();
  }, [loadBatches, loadConfig]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/batch/new" element={<CreateBatch />} />
          <Route path="/batch/:id" element={<BatchDetail />} />
          <Route path="/batch/:id/curve" element={<PhCurve />} />
          <Route
            path="*"
            element={
              <div className="text-center py-16">
                <p className="text-2xl font-bold text-earth-700 mb-2">页面不存在</p>
                <p className="text-earth-500">请检查URL是否正确</p>
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
